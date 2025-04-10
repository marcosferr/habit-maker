import { Metadata } from "next";
import { CalendarSettings } from "@/components/calendar-settings";

export const metadata: Metadata = {
  title: "Settings | Goal Tracker",
  description: "Manage your account settings and integrations",
};

export default function SettingsPage() {
  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and integrations
        </p>
      </div>

      <div className="grid gap-6">
        <CalendarSettings />
      </div>
    </div>
  );
}
