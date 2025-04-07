"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CalendarView } from "@/components/calendar-view"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Appointment = {
  id: string
  dateStart: string
  details: string
  amount: number
  measureUnit: string
  completed: boolean
}

type Plan = {
  id: string
  name: string
  goal: string
  category: string
  currentLevel: string
  createdAt: string
  updatedAt: string
  userId: string
  appointments: Appointment[]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        const response = await fetch('/api/plans')
        
        if (!response.ok) {
          throw new Error('Failed to fetch plans')
        }
        
        const data = await response.json()
        setPlans(data)
      } catch (err) {
        console.error('Error fetching plans:', err)
        setError('Failed to load your plans. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlans()
  }, [])

  // Calculate progress for each plan
  const plansWithProgress = plans.map(plan => {
    const totalAppointments = plan.appointments.length
    const completedAppointments = plan.appointments.filter(a => a.completed).length
    const progress = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100) 
      : 0
      
    return {
      ...plan,
      progress,
      completedCount: completedAppointments,
      totalCount: totalAppointments
    }
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Flatten all appointments for the calendar view
  const allAppointments = plans.flatMap(plan => 
    plan.appointments.map(appointment => ({
      ...appointment,
      planId: plan.id,
      planName: plan.name,
      planCategory: plan.category
    }))
  )

  return (
    <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 pt-4">
        {plansWithProgress.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground">Create your first goal to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plansWithProgress.map((plan) => {
              // Find the latest appointment
              const latestAppointment = [...plan.appointments]
                .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime())
                .find(a => !a.completed);
                
              return (
                <Card key={plan.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.goal}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Progress value={plan.progress} className="h-2" />
                      <span className="ml-2 text-sm font-medium">{plan.progress}%</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {plan.completedCount} of {plan.totalCount} activities completed
                    </div>
                    {latestAppointment && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Next up:</span> {latestAppointment.details} - {latestAppointment.amount} {latestAppointment.measureUnit}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>
      <TabsContent value="calendar" className="pt-4">
        <CalendarView appointments={allAppointments} />
      </TabsContent>
    </Tabs>
  )
}

