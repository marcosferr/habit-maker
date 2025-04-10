"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  CalendarDays,
  CalendarClock,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Appointment = {
  id: string;
  dateStart: string | Date;
  details: string;
  amount: number;
  measureUnit: string;
  completed?: boolean;
  planId?: string;
  planName?: string;
  planCategory?: string;
};

type CalendarViewProps = {
  appointments: Appointment[];
  planId?: string;
};

export function CalendarView({ appointments, planId }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>(
    []
  );
  const [googleConnected, setGoogleConnected] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    exportAsTask: false,
    includeAmount: true,
    includeMeasureUnit: true,
    addReminders: true,
    reminderMinutes: 30,
  });

  // Check if Google Calendar is connected
  useEffect(() => {
    async function checkGoogleConnection() {
      try {
        const response = await fetch("/api/calendar/settings");

        if (response.ok) {
          const data = await response.json();
          setGoogleConnected(data.connected);

          if (data.settings) {
            setExportSettings({
              exportAsTask: data.settings.exportAsTask,
              includeAmount: data.settings.includeAmount,
              includeMeasureUnit: data.settings.includeMeasureUnit,
              addReminders: data.settings.addReminders,
              reminderMinutes: data.settings.reminderMinutes,
            });
          }
        }
      } catch (error) {
        console.error("Error checking Google connection:", error);
      }
    }

    checkGoogleConnection();
  }, []);

  // Convert all dateStart to Date objects
  const processedAppointments = appointments.map((appointment) => ({
    ...appointment,
    dateStart:
      appointment.dateStart instanceof Date
        ? appointment.dateStart
        : new Date(appointment.dateStart),
  }));

  // Get appointments for the selected date
  const selectedDateAppointments = processedAppointments.filter(
    (appointment) =>
      date && appointment.dateStart.toDateString() === date.toDateString()
  );

  // Function to highlight dates with appointments
  const isDayWithAppointment = (day: Date) => {
    return processedAppointments.some(
      (appointment) =>
        appointment.dateStart.toDateString() === day.toDateString()
    );
  };

  // Function to toggle appointment completion status
  const toggleAppointmentStatus = async (
    appointmentId: string,
    currentStatus: boolean
  ) => {
    setIsUpdating((prev) => ({ ...prev, [appointmentId]: true }));

    try {
      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: appointmentId,
          completed: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }

      // Get the updated appointment from the response
      const data = await response.json();

      // Update the appointments state with the updated appointment
      const updatedAppointments = [...processedAppointments];
      const index = updatedAppointments.findIndex(
        (a) => a.id === appointmentId
      );

      if (index !== -1) {
        updatedAppointments[index] = {
          ...updatedAppointments[index],
          completed: !currentStatus,
        };
      }

      toast({
        title: "Status updated",
        description: `Activity marked as ${
          !currentStatus ? "completed" : "incomplete"
        }.`,
      });

      // Force a refresh of the parent component
      window.location.reload();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update activity status. Please try again.",
      });
    } finally {
      setIsUpdating((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  // Get category-specific badge color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "fitness":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "learning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "productivity":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "mindfulness":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "creative":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Handle export to Google Calendar
  const handleExportToGoogle = async () => {
    try {
      setIsExporting(true);

      // If no appointments are selected, use all appointments for the selected date
      const appointmentsToExport =
        selectedAppointments.length > 0
          ? selectedAppointments
          : selectedDateAppointments.map((a) => a.id);

      if (appointmentsToExport.length === 0) {
        toast({
          title: "No appointments selected",
          description: "Please select at least one appointment to export",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const response = await fetch("/api/calendar/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentIds: appointmentsToExport,
          exportAsTask: exportSettings.exportAsTask,
          includeAmount: exportSettings.includeAmount,
          includeMeasureUnit: exportSettings.includeMeasureUnit,
          addReminders: exportSettings.addReminders,
          reminderMinutes: exportSettings.reminderMinutes,
          userId: "user-id-placeholder",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to export to Google Calendar"
        );
      }

      const data = await response.json();

      toast({
        title: "Export Successful",
        description: data.message,
      });

      // Close the dialog
      setExportDialogOpen(false);
      // Clear selected appointments
      setSelectedAppointments([]);
    } catch (error) {
      console.error("Error exporting to Google Calendar:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle appointment selection for export
  const toggleAppointmentSelection = (id: string) => {
    setSelectedAppointments((prev) =>
      prev.includes(id)
        ? prev.filter((appointmentId) => appointmentId !== id)
        : [...prev, id]
    );
  };

  // Connect to Google Calendar
  const handleConnectToGoogle = () => {
    window.location.href = "/api/auth/google?userId=user-id-placeholder";
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Calendar</CardTitle>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setSelectedAppointments([])}
              >
                <CalendarClock className="h-4 w-4" />
                Export to Google
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export to Google Calendar</DialogTitle>
                <DialogDescription>
                  Export your appointments to Google Calendar as events or
                  tasks.
                </DialogDescription>
              </DialogHeader>

              {!googleConnected ? (
                <div className="space-y-4 py-4">
                  <p className="text-sm">
                    You need to connect your Google Calendar first.
                  </p>
                  <Button onClick={handleConnectToGoogle} className="w-full">
                    Connect to Google Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="export-as-task">Export as Tasks</Label>
                      <Switch
                        id="export-as-task"
                        checked={exportSettings.exportAsTask}
                        onCheckedChange={(checked) =>
                          setExportSettings({
                            ...exportSettings,
                            exportAsTask: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-amount">Include Amount</Label>
                      <Switch
                        id="include-amount"
                        checked={exportSettings.includeAmount}
                        onCheckedChange={(checked) =>
                          setExportSettings({
                            ...exportSettings,
                            includeAmount: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-measure-unit">
                        Include Measure Unit
                      </Label>
                      <Switch
                        id="include-measure-unit"
                        checked={exportSettings.includeMeasureUnit}
                        onCheckedChange={(checked) =>
                          setExportSettings({
                            ...exportSettings,
                            includeMeasureUnit: checked,
                          })
                        }
                      />
                    </div>

                    {!exportSettings.exportAsTask && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="add-reminders">Add Reminders</Label>
                          <Switch
                            id="add-reminders"
                            checked={exportSettings.addReminders}
                            onCheckedChange={(checked) =>
                              setExportSettings({
                                ...exportSettings,
                                addReminders: checked,
                              })
                            }
                          />
                        </div>

                        {exportSettings.addReminders && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="reminder-minutes">
                                Reminder Time
                              </Label>
                              <span className="text-sm text-muted-foreground">
                                {exportSettings.reminderMinutes} minutes before
                              </span>
                            </div>
                            <Slider
                              id="reminder-minutes"
                              min={5}
                              max={120}
                              step={5}
                              value={[exportSettings.reminderMinutes]}
                              onValueChange={(value) =>
                                setExportSettings({
                                  ...exportSettings,
                                  reminderMinutes: value[0],
                                })
                              }
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {selectedDateAppointments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Appointments to Export</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {selectedDateAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`select-${appointment.id}`}
                              checked={selectedAppointments.includes(
                                appointment.id
                              )}
                              onCheckedChange={() =>
                                toggleAppointmentSelection(appointment.id)
                              }
                            />
                            <Label
                              htmlFor={`select-${appointment.id}`}
                              className="text-sm"
                            >
                              {appointment.details} ({appointment.amount}{" "}
                              {appointment.measureUnit})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setExportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportToGoogle}
                  disabled={!googleConnected || isExporting}
                >
                  {isExporting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Export to Google
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              hasAppointment: isDayWithAppointment,
            }}
            modifiersStyles={{
              hasAppointment: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary) / 0.1)",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {date ? date.toLocaleDateString() : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateAppointments.length > 0 ? (
            <ul className="space-y-3">
              {selectedDateAppointments.map((appointment) => (
                <li key={appointment.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    {appointment.planCategory && !planId && (
                      <Badge
                        className={getCategoryColor(appointment.planCategory)}
                      >
                        {appointment.planName || appointment.planCategory}
                      </Badge>
                    )}
                    <span className="font-medium">
                      {appointment.amount} {appointment.measureUnit}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{appointment.details}</p>

                  {appointment.id && (
                    <div className="mt-3 flex items-center space-x-2">
                      <Checkbox
                        id={`complete-${appointment.id}`}
                        checked={appointment.completed}
                        disabled={isUpdating[appointment.id]}
                        onCheckedChange={() =>
                          toggleAppointmentStatus(
                            appointment.id,
                            !!appointment.completed
                          )
                        }
                      />
                      <label
                        htmlFor={`complete-${appointment.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {appointment.completed
                          ? "Completed"
                          : "Mark as completed"}
                      </label>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No activities scheduled for this date.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
