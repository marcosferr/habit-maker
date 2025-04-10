import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calendarExportSchema } from "@/lib/validation";
import {
  appointmentToCalendarEvent,
  appointmentToTask,
  createCalendarEvent,
  createTask,
} from "@/lib/google-api";

/**
 * POST handler for exporting appointments to Google Calendar
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = calendarExportSchema.parse(body);
    const userId = body.userId || "user-id-placeholder";

    // Check if user has Google integration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
      },
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return NextResponse.json(
        {
          message: "Google Calendar not connected. Please connect your account first.",
        },
        { status: 400 }
      );
    }

    // Get the appointments to export
    const appointments = await prisma.appointment.findMany({
      where: {
        id: { in: validatedData.appointmentIds },
        userId,
      },
      include: {
        plan: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json(
        {
          message: "No appointments found to export",
        },
        { status: 404 }
      );
    }

    // Export each appointment
    const results = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          if (validatedData.exportAsTask) {
            // Export as Google Task
            const task = appointmentToTask(appointment, {
              includeAmount: validatedData.includeAmount,
              includeMeasureUnit: validatedData.includeMeasureUnit,
            });
            
            const result = await createTask(userId, task);
            return {
              appointmentId: appointment.id,
              success: true,
              type: "task",
              taskId: result.id,
            };
          } else {
            // Export as Google Calendar Event
            const event = appointmentToCalendarEvent(appointment, {
              includeAmount: validatedData.includeAmount,
              includeMeasureUnit: validatedData.includeMeasureUnit,
              addReminders: validatedData.addReminders,
              reminderMinutes: validatedData.reminderMinutes,
            });
            
            const result = await createCalendarEvent(userId, event);
            return {
              appointmentId: appointment.id,
              success: true,
              type: "event",
              eventId: result.id,
            };
          }
        } catch (error) {
          console.error(`Error exporting appointment ${appointment.id}:`, error);
          return {
            appointmentId: appointment.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Update the last synced time in calendar settings
    await prisma.calendarIntegration.update({
      where: { userId },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    // Create a notification about the export
    const successCount = results.filter((r) => r.success).length;
    await prisma.notification.create({
      data: {
        title: "Calendar Export Complete",
        message: `Successfully exported ${successCount} of ${appointments.length} appointments to Google ${
          validatedData.exportAsTask ? "Tasks" : "Calendar"
        }.`,
        userId,
      },
    });

    return NextResponse.json({
      results,
      message: `Exported ${successCount} of ${appointments.length} appointments`,
    });
  } catch (error) {
    console.error("Error exporting to calendar:", error);
    return NextResponse.json(
      {
        message: "Failed to export appointments to calendar",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
