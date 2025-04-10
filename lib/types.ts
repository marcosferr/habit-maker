export type CalendarEntry = {
  date_start: Date | string;
  details: string;
  amount: number;
  measure_unit: string;
};

export type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
  token_type: string;
};

export type GoogleCalendarEvent = {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
};

export type GoogleTaskItem = {
  title: string;
  notes: string;
  due: string;
  status: "needsAction" | "completed";
};

export type CalendarExportOptions = {
  appointmentIds: string[];
  exportAsTask: boolean;
  includeAmount: boolean;
  includeMeasureUnit: boolean;
  addReminders: boolean;
  reminderMinutes: number;
};
