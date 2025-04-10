import { GoogleCalendarEvent, GoogleTaskItem, GoogleTokens } from "./types";
import prisma from "./db";

// Google API endpoints
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TASKS_API = "https://tasks.googleapis.com/tasks/v1";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Refresh Google access token if expired
 */
export async function refreshTokenIfNeeded(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleAccessToken || !user?.googleRefreshToken) {
    throw new Error("User not connected to Google");
  }

  // Check if token is expired or will expire in the next 5 minutes
  const isExpired =
    !user.googleTokenExpiry ||
    user.googleTokenExpiry.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    // Refresh the token
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Google token");
    }

    const data = await response.json();
    const newExpiryTime = new Date(Date.now() + data.expires_in * 1000);

    // Update the user's token in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: data.access_token,
        googleTokenExpiry: newExpiryTime,
      },
    });

    return data.access_token;
  }

  return user.googleAccessToken;
}

/**
 * Create a Google Calendar event
 */
export async function createCalendarEvent(
  userId: string,
  event: GoogleCalendarEvent
): Promise<any> {
  const accessToken = await refreshTokenIfNeeded(userId);

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create calendar event: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Create a Google Task
 */
export async function createTask(
  userId: string,
  task: GoogleTaskItem
): Promise<any> {
  const accessToken = await refreshTokenIfNeeded(userId);

  // First, get the default task list
  const listsResponse = await fetch(`${GOOGLE_TASKS_API}/users/@me/lists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listsResponse.ok) {
    throw new Error("Failed to fetch task lists");
  }

  const listsData = await listsResponse.json();
  const defaultList = listsData.items[0]?.id;

  if (!defaultList) {
    throw new Error("No task list found");
  }

  // Create the task
  const response = await fetch(`${GOOGLE_TASKS_API}/lists/${defaultList}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create task: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Convert an appointment to a Google Calendar event
 */
export function appointmentToCalendarEvent(
  appointment: any,
  options: {
    includeAmount: boolean;
    includeMeasureUnit: boolean;
    addReminders: boolean;
    reminderMinutes: number;
  }
): GoogleCalendarEvent {
  // Calculate end time (default to 1 hour after start)
  const startDate = new Date(appointment.dateStart);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  // Format title based on options
  let title = appointment.details;
  if (options.includeAmount && options.includeMeasureUnit) {
    title = `${title} (${appointment.amount} ${appointment.measureUnit})`;
  } else if (options.includeAmount) {
    title = `${title} (${appointment.amount})`;
  } else if (options.includeMeasureUnit) {
    title = `${title} (${appointment.measureUnit})`;
  }

  // Create event object
  const event: GoogleCalendarEvent = {
    summary: title,
    description: `Goal: ${appointment.plan?.name || "Unknown"}\nAmount: ${
      appointment.amount
    } ${appointment.measureUnit}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  // Add reminders if enabled
  if (options.addReminders) {
    event.reminders = {
      useDefault: false,
      overrides: [
        {
          method: "popup",
          minutes: options.reminderMinutes,
        },
      ],
    };
  }

  return event;
}

/**
 * Convert an appointment to a Google Task
 */
export function appointmentToTask(
  appointment: any,
  options: {
    includeAmount: boolean;
    includeMeasureUnit: boolean;
  }
): GoogleTaskItem {
  // Format title based on options
  let title = appointment.details;
  if (options.includeAmount && options.includeMeasureUnit) {
    title = `${title} (${appointment.amount} ${appointment.measureUnit})`;
  } else if (options.includeAmount) {
    title = `${title} (${appointment.amount})`;
  } else if (options.includeMeasureUnit) {
    title = `${title} (${appointment.measureUnit})`;
  }

  // Create task object
  const task: GoogleTaskItem = {
    title,
    notes: `Goal: ${appointment.plan?.name || "Unknown"}\nAmount: ${
      appointment.amount
    } ${appointment.measureUnit}`,
    due: new Date(appointment.dateStart).toISOString(),
    status: appointment.completed ? "completed" : "needsAction",
  };

  return task;
}
