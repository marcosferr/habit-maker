"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { CalendarEntry } from "./types"

export async function generatePlan(formData: {
  name: string
  goal: string
  category: string
  currentLevel: string
}): Promise<CalendarEntry[]> {
  try {
    const prompt = `
      Create a personalized training plan for the following goal:
      
      Habit Name: ${formData.name}
      Goal: ${formData.goal}
      Category: ${formData.category}
      Current Level: ${formData.currentLevel}
      
      Generate a structured training plan with calendar entries. Each entry should include:
      - A start date (starting from today and extending as needed)
      - Details of the activity
      - An amount (numeric value)
      - A measurement unit (e.g., km, minutes, pages)
      
      Format the response as a valid JSON array with the following schema:
      [
        {
          "date_start": "YYYY-MM-DD",
          "details": "Description of the activity",
          "amount": number,
          "measure_unit": "unit"
        }
      ]
      
      The plan should be progressive, realistic, and tailored to the user's current level.
      Only return the JSON array, nothing else.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Parse the response as JSON
    const plan = JSON.parse(text) as CalendarEntry[]

    return plan
  } catch (error) {
    console.error("Error generating plan:", error)
    throw new Error("Failed to generate plan. Please try again.")
  }
}

