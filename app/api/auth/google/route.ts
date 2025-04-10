import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { googleTokenSchema } from "@/lib/validation";
import { GoogleTokens } from "@/lib/types";

// Google OAuth 2.0 endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Required scopes for Google Calendar API
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/tasks",
  "profile",
  "email",
];

/**
 * GET handler for initiating Google OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Create OAuth authorization URL
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID || "");
    authUrl.searchParams.append(
      "redirect_uri",
      process.env.GOOGLE_REDIRECT_URI || ""
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", SCOPES.join(" "));
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");
    authUrl.searchParams.append("state", userId); // Pass userId in state parameter

    // Redirect to Google's OAuth page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      { message: "Failed to initiate Google OAuth" },
      { status: 500 }
    );
  }
}
