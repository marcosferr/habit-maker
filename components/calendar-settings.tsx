"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function CalendarSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState({
    exportAsTask: false,
    includeAmount: true,
    includeMeasureUnit: true,
    addReminders: true,
    reminderMinutes: 30,
  });

  // Handle success/error messages from URL params (after OAuth redirect)
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected.",
        variant: "default",
      });
      // Remove the query params
      router.replace("/settings");
    }

    if (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to Google Calendar: ${error}`,
        variant: "destructive",
      });
      // Remove the query params
      router.replace("/settings");
    }
  }, [searchParams, router]);

  // Fetch calendar settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await fetch("/api/calendar/settings");
        
        if (!response.ok) {
          throw new Error("Failed to fetch calendar settings");
        }

        const data = await response.json();
        setConnected(data.connected);
        
        if (data.settings) {
          setSettings({
            exportAsTask: data.settings.exportAsTask,
            includeAmount: data.settings.includeAmount,
            includeMeasureUnit: data.settings.includeMeasureUnit,
            addReminders: data.settings.addReminders,
            reminderMinutes: data.settings.reminderMinutes,
          });
        }
      } catch (error) {
        console.error("Error fetching calendar settings:", error);
        toast({
          title: "Error",
          description: "Failed to load calendar settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Connect to Google Calendar
  const handleConnect = async () => {
    try {
      setConnecting(true);
      // Redirect to Google OAuth flow
      window.location.href = "/api/auth/google?userId=user-id-placeholder";
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  // Disconnect from Google Calendar
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const response = await fetch("/api/calendar/settings?userId=user-id-placeholder", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect from Google Calendar");
      }

      setConnected(false);
      toast({
        title: "Disconnected",
        description: "Your Google Calendar has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting from Google Calendar:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Google Calendar",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Save calendar settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/calendar/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          userId: "user-id-placeholder",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save calendar settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your calendar integration settings have been saved",
      });
    } catch (error) {
      console.error("Error saving calendar settings:", error);
      toast({
        title: "Error",
        description: "Failed to save calendar settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to export appointments from the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {connected ? (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Connected to Google Calendar</AlertTitle>
                <AlertDescription>
                  Your account is connected to Google Calendar. You can now export your appointments.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Connected</AlertTitle>
                <AlertDescription>
                  Connect your Google Calendar to export appointments from the app.
                </AlertDescription>
              </Alert>
            )}

            {connected && (
              <div className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="export-as-task">Export as Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Export appointments as Google Tasks instead of Calendar events
                      </p>
                    </div>
                    <Switch
                      id="export-as-task"
                      checked={settings.exportAsTask}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, exportAsTask: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-amount">Include Amount</Label>
                      <p className="text-sm text-muted-foreground">
                        Include the amount in the event title
                      </p>
                    </div>
                    <Switch
                      id="include-amount"
                      checked={settings.includeAmount}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, includeAmount: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-measure-unit">Include Measure Unit</Label>
                      <p className="text-sm text-muted-foreground">
                        Include the measure unit in the event title
                      </p>
                    </div>
                    <Switch
                      id="include-measure-unit"
                      checked={settings.includeMeasureUnit}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, includeMeasureUnit: checked })
                      }
                    />
                  </div>

                  {!settings.exportAsTask && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="add-reminders">Add Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Add reminders to calendar events
                          </p>
                        </div>
                        <Switch
                          id="add-reminders"
                          checked={settings.addReminders}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, addReminders: checked })
                          }
                        />
                      </div>

                      {settings.addReminders && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="reminder-minutes">Reminder Time</Label>
                            <span className="text-sm text-muted-foreground">
                              {settings.reminderMinutes} minutes before
                            </span>
                          </div>
                          <Slider
                            id="reminder-minutes"
                            min={5}
                            max={120}
                            step={5}
                            value={[settings.reminderMinutes]}
                            onValueChange={(value) =>
                              setSettings({ ...settings, reminderMinutes: value[0] })
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {connected ? (
          <>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting || saving}
            >
              {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving || disconnecting}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={connecting} className="ml-auto">
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect to Google Calendar
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
