"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

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

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
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
