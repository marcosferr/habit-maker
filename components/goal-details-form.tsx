"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { planInputSchema } from "@/lib/validation"

// Define the days of the week for the form
const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

type GoalDetailsFormProps = {
  initialData: {
    name: string
    goal: string
    category: string
    currentLevel: string
  }
  onSubmit: (values: z.infer<typeof planInputSchema>) => Promise<void>
}

export function GoalDetailsForm({ initialData, onSubmit }: GoalDetailsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categorySpecificFields, setCategorySpecificFields] = useState<React.ReactNode | null>(null)
  const [specificDetails, setSpecificDetails] = useState<Record<string, any>>({})

  // Create form with validation schema
  const form = useForm<z.infer<typeof planInputSchema>>({
    resolver: zodResolver(planInputSchema),
    defaultValues: {
      ...initialData,
      experience: "beginner",
      frequency: 3,
      preferredDays: ["monday", "wednesday", "friday"],
      constraints: "",
      preferences: "",
      duration: 8,
      specificDetails: {},
    },
  })

  // Watch for category changes to update specific fields
  const category = form.watch("category")

  useEffect(() => {
    // Reset specific details when category changes
    setSpecificDetails({})
  }, [category])

  // Separate function to render category-specific fields
  const renderCategoryFields = () => {
    switch (category) {
      case "fitness":
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Fitness Details</h4>

            <FormItem>
              <FormLabel>Fitness Type</FormLabel>
              <Select
                onValueChange={(value) => setSpecificDetails((prev) => ({ ...prev, fitnessType: value }))}
                value={specificDetails.fitnessType || "cardio"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fitness type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="sport">Sport-specific</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the primary type of fitness activity.</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Current Fitness Metrics</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., 5km run in 30 minutes, can do 10 push-ups, etc."
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, metrics: e.target.value }))}
                  value={specificDetails.metrics || ""}
                />
              </FormControl>
              <FormDescription>Provide specific metrics about your current fitness level.</FormDescription>
            </FormItem>
          </div>
        )
      case "learning":
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Learning Details</h4>

            <FormItem>
              <FormLabel>Subject Area</FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., Programming, Spanish, Piano"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, subject: e.target.value }))}
                  value={specificDetails.subject || ""}
                />
              </FormControl>
              <FormDescription>What specific subject or skill are you learning?</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Available Resources</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., Online courses, textbooks, tutor, etc."
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, resources: e.target.value }))}
                  value={specificDetails.resources || ""}
                />
              </FormControl>
              <FormDescription>List the resources you have available for learning.</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Daily Time Available (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, timeAvailable: e.target.value }))}
                  value={specificDetails.timeAvailable || ""}
                />
              </FormControl>
              <FormDescription>How much time can you dedicate each day?</FormDescription>
            </FormItem>
          </div>
        )
      case "productivity":
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Productivity Details</h4>

            <FormItem>
              <FormLabel>Productivity Goal Type</FormLabel>
              <Select
                onValueChange={(value) => setSpecificDetails((prev) => ({ ...prev, productivityType: value }))}
                value={specificDetails.productivityType || "time-management"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="time-management">Time Management</SelectItem>
                  <SelectItem value="task-completion">Task Completion</SelectItem>
                  <SelectItem value="habit-building">Habit Building</SelectItem>
                  <SelectItem value="focus-improvement">Focus Improvement</SelectItem>
                  <SelectItem value="project-completion">Project Completion</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>What aspect of productivity are you focusing on?</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Current Challenges</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., Procrastination, distractions, lack of structure"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, challenges: e.target.value }))}
                  value={specificDetails.challenges || ""}
                />
              </FormControl>
              <FormDescription>What productivity challenges are you currently facing?</FormDescription>
            </FormItem>
          </div>
        )
      case "mindfulness":
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Mindfulness Details</h4>

            <FormItem>
              <FormLabel>Mindfulness Practice Type</FormLabel>
              <Select
                onValueChange={(value) => setSpecificDetails((prev) => ({ ...prev, mindfulnessType: value }))}
                value={specificDetails.mindfulnessType || "meditation"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select practice type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="meditation">Meditation</SelectItem>
                  <SelectItem value="breathing">Breathing Exercises</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="journaling">Mindful Journaling</SelectItem>
                  <SelectItem value="mixed">Mixed Practices</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>What type of mindfulness practice are you interested in?</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Current Practice Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, currentDuration: e.target.value }))}
                  value={specificDetails.currentDuration || ""}
                />
              </FormControl>
              <FormDescription>How long are your current mindfulness sessions?</FormDescription>
            </FormItem>
          </div>
        )
      case "creative":
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Creative Project Details</h4>

            <FormItem>
              <FormLabel>Creative Medium</FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., Writing, painting, music, photography"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, medium: e.target.value }))}
                  value={specificDetails.medium || ""}
                />
              </FormControl>
              <FormDescription>What creative medium are you working with?</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your creative project or goal"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, projectDescription: e.target.value }))}
                  value={specificDetails.projectDescription || ""}
                />
              </FormControl>
              <FormDescription>Provide details about your creative project.</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Skills to Develop</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What specific skills do you want to develop?"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, skillsToDevelop: e.target.value }))}
                  value={specificDetails.skillsToDevelop || ""}
                />
              </FormControl>
              <FormDescription>List the skills you want to improve through this project.</FormDescription>
            </FormItem>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Additional Details</h4>

            <FormItem>
              <FormLabel>Specific Requirements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requirements or details for your goal"
                  onChange={(e) => setSpecificDetails((prev) => ({ ...prev, requirements: e.target.value }))}
                  value={specificDetails.requirements || ""}
                />
              </FormControl>
              <FormDescription>Provide any additional details that will help create your plan.</FormDescription>
            </FormItem>
          </div>
        )
    }
  }

  async function handleSubmit(values: z.infer<typeof planInputSchema>) {
    setIsSubmitting(true)

    try {
      // Add the specific details to the form values
      const formData = {
        ...values,
        specificDetails,
      }

      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Experience Level</h3>

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the option that best describes your current experience level.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="constraints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Constraints or Limitations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any constraints or limitations that might affect your progress"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>This helps us create a plan that accommodates your situation.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule Preferences</h3>

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Frequency: {field.value} days</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={7}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>How many days per week would you like to work on this goal?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredDays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Preferred Days</FormLabel>
                        <FormDescription>Select the days you prefer to work on this goal.</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {daysOfWeek.map((day) => (
                          <FormField
                            key={day.id}
                            control={form.control}
                            name="preferredDays"
                            render={({ field }) => {
                              return (
                                <FormItem key={day.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, day.id])
                                          : field.onChange(field.value?.filter((value) => value !== day.id))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{day.label}</FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">{renderCategoryFields()}</CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferences</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any specific preferences for your plan"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>This helps us tailor the plan to your preferences.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Duration (weeks): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={52}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>How many weeks would you like your plan to cover?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Plan
          </Button>
        </div>
      </form>
    </Form>
  )
}

