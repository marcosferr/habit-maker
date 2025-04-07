import { type NextRequest, NextResponse } from "next/server"
import { generatePlan } from "@/lib/openai"
import { planInputSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json()

    // Validate the input against our schema
    const validatedData = planInputSchema.parse(body)

    // Generate the plan using OpenAI with function calling
    const plan = await generatePlan(validatedData)

    // Return the generated plan without saving to database
    return NextResponse.json({
      plan: plan,
      message: "Plan preview generated successfully",
    })
  } catch (error) {
    console.error("Error generating plan preview:", error)
    return NextResponse.json(
      {
        message: "Failed to generate plan preview",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

