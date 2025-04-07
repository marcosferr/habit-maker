import { z } from "zod"

// Schema for plan creation input validation
export const planInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  goal: z.string().min(5, "Goal must be at least 5 characters"),
  category: z.string({
    required_error: "Please select a category.",
  }),
  currentLevel: z.string().min(5, "Please describe your current level."),

  // More generic fields for all goal types
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  frequency: z.number().int().min(1).max(7),
  preferredDays: z.array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])),
  constraints: z.string().optional(),
  preferences: z.string(),
  duration: z.number().int().min(1).max(52),

  // Category-specific fields
  specificDetails: z.record(z.string()).optional(),
})

// Schema for appointment creation input validation
export const appointmentInputSchema = z.object({
  dateStart: z.string().or(z.date()),
  details: z.string().min(3, "Details must be at least 3 characters"),
  amount: z.number().int().positive(),
  measureUnit: z.string().min(1, "Measure unit is required"),
  planId: z.string().min(1, "Plan ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

// Schema for appointment update input validation
export const appointmentUpdateSchema = z.object({
  id: z.string().min(1, "Appointment ID is required"),
  dateStart: z.string().or(z.date()).optional(),
  details: z.string().min(3, "Details must be at least 3 characters").optional(),
  amount: z.number().int().positive().optional(),
  measureUnit: z.string().min(1, "Measure unit is required").optional(),
  completed: z.boolean().optional(),
})

// Schema for notification input validation
export const notificationInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  userId: z.string().min(1, "User ID is required"),
})

