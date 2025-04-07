"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Loader2 } from "lucide-react"
import type { PlanEntry } from "@/lib/openai"

type PlanPreviewProps = {
  planData: any
  onSave: () => Promise<void>
  onEdit: () => void
}

export function PlanPreview({ planData, onSave, onEdit }: PlanPreviewProps) {
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Group entries by week
  const entriesByWeek: Record<number, PlanEntry[]> = {}

  planData.plan.forEach((entry: PlanEntry) => {
    const date = new Date(entry.date_start)
    const startDate = new Date(planData.startDate || Date.now())
    const diffTime = Math.abs(date.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1

    if (!entriesByWeek[weekNumber]) {
      entriesByWeek[weekNumber] = []
    }

    entriesByWeek[weekNumber].push(entry)
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
      // Redirect will be handled by the parent component
    } catch (error) {
      console.error("Error saving plan:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get category-specific badge color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "fitness":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "learning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "productivity":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "mindfulness":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "creative":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{planData.name}</h2>
          <div className="flex items-center mt-1">
            <Badge className={getCategoryColor(planData.category)}>{planData.category}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} disabled={isSaving}>
            Edit Details
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Plan
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(entriesByWeek).map((weekNum) => (
                <div key={weekNum} className="space-y-2">
                  <h3 className="font-medium text-lg">Week {weekNum}</h3>
                  <div className="grid gap-2">
                    {entriesByWeek[Number(weekNum)].map((entry, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {new Date(entry.date_start).toLocaleDateString()} - {entry.details}
                            </div>
                            <div className="font-medium">
                              {entry.amount} {entry.measure_unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit} disabled={isSaving}>
            Edit Details
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Plan
          </Button>
        </div>
      </div>
    </div>
  )
}

