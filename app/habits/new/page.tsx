import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HabitForm } from "@/components/habit-form"

export default function NewHabitPage() {
  return (
    <div className="container py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Goal</CardTitle>
          <CardDescription>Define your goal and let AI help you create a personalized plan</CardDescription>
        </CardHeader>
        <CardContent>
          <HabitForm />
        </CardContent>
      </Card>
    </div>
  )
}

