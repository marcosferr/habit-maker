import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { googleTokenSchema } from "@/lib/validation";
import { GoogleTokens } from "@/lib/types";

// Google OAuth 2.0 token endpoint
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * GET handler for Google OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // Contains userId
    const error = url.searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`/settings?error=${error}`);
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect("/settings?error=missing_params");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect("/settings?error=token_exchange");
    }

    // Parse and validate token response
    const tokenData = await tokenResponse.json();
    const validatedTokens = googleTokenSchema.parse({
      ...tokenData,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
    });

    // Update user with Google tokens
    await prisma.user.update({
      where: { id: state },
      data: {
        googleAccessToken: validatedTokens.access_token,
        googleRefreshToken: validatedTokens.refresh_token,
        googleTokenExpiry: new Date(validatedTokens.expires_at * 1000),
      },
    });

    // Create default calendar integration settings if not exists
    const existingSettings = await prisma.calendarIntegration.findUnique({
      where: { userId: state },
    });

    if (!existingSettings) {
      await prisma.calendarIntegration.create({
        data: {
          userId: state,
          exportAsTask: false,
          includeAmount: true,
          includeMeasureUnit: true,
          addReminders: true,
          reminderMinutes: 30,
        },
      });
    }

    // Create success notification
    await prisma.notification.create({
      data: {
        title: "Google Calendar Connected",
        message: "Your Google Calendar has been successfully connected. You can now export your appointments.",
        userId: state,
      },
    });

    // Redirect to settings page with success message
    return NextResponse.redirect("/settings?success=google_connected");
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.redirect("/settings?error=unexpected");
  }
}
