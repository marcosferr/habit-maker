import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calendarIntegrationSchema } from "@/lib/validation";

/**
 * GET handler for retrieving calendar integration settings
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "user-id-placeholder";

    // Get user's Google connection status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    // Get calendar integration settings
    const settings = await prisma.calendarIntegration.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      connected: Boolean(user?.googleAccessToken && user?.googleRefreshToken),
      tokenExpiry: user?.googleTokenExpiry,
      settings: settings || null,
    });
  } catch (error) {
    console.error("Error fetching calendar settings:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch calendar settings",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating calendar integration settings
 */
export async function PUT(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = calendarIntegrationSchema.parse(body);
    const userId = body.userId || "user-id-placeholder";

    // Update or create calendar integration settings
    const settings = await prisma.calendarIntegration.upsert({
      where: { userId },
      update: {
        exportAsTask: validatedData.exportAsTask,
        includeAmount: validatedData.includeAmount,
        includeMeasureUnit: validatedData.includeMeasureUnit,
        addReminders: validatedData.addReminders,
        reminderMinutes: validatedData.reminderMinutes,
      },
      create: {
        userId,
        exportAsTask: validatedData.exportAsTask,
        includeAmount: validatedData.includeAmount,
        includeMeasureUnit: validatedData.includeMeasureUnit,
        addReminders: validatedData.addReminders,
        reminderMinutes: validatedData.reminderMinutes,
      },
    });

    return NextResponse.json({
      settings,
      message: "Calendar settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating calendar settings:", error);
    return NextResponse.json(
      {
        message: "Failed to update calendar settings",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for disconnecting Google Calendar
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "user-id-placeholder";

    // Remove Google tokens from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });

    // Create notification about disconnection
    await prisma.notification.create({
      data: {
        title: "Google Calendar Disconnected",
        message: "Your Google Calendar has been disconnected from the app.",
        userId,
      },
    });

    return NextResponse.json({
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json(
      {
        message: "Failed to disconnect Google Calendar",
      },
      { status: 500 }
    );
  }
}
