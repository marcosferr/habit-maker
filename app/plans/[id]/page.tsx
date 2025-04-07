import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarView } from "@/components/calendar-view"
import { NotificationsTab } from "@/components/notifications-tab"
import prisma from "@/lib/db"
import { ArrowLeft } from 'lucide-react'

export default async function PlanDetailsPage({ params }: { params: { id: string } }) {
  // Fetch plan and appointments from database
  const plan = await prisma.plan.findUnique({
    where: {
      id: params.id,
    },
    include: {
      appointments: true,
    },
  })

  if (!plan) {
    notFound()
  }

  // Format appointments for the calendar view
  const formattedAppointments = plan.appointments.map((appointment) => ({
    id: appointment.id,
    dateStart: appointment.dateStart,
    details: appointment.details,
    amount: appointment.amount,
    measureUnit: appointment.measureUnit,
    completed: appointment.completed,
  }))

  // Calculate progress
  const totalAppointments = plan.appointments.length
  const completedAppointments = plan.appointments.filter((a) => a.completed).length
  const progress = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{plan.name}</h1>
        <p className="text-muted-foreground mt-1">{plan.goal}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progress}%</div>
            <p className="text-sm text-muted-foreground">
              {completedAppointments} of {totalAppointments} activities completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium capitalize">{plan.category}</div>
            <p className="text-sm text-muted-foreground">Created on {new Date(plan.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{plan.currentLevel}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <CalendarView appointments={formattedAppointments} planId={plan.id} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab userId={plan.userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

