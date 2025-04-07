import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { generatePlan } from "@/lib/openai"
import { planInputSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json()

    // Validate the input against our schema
    const validatedData = planInputSchema.parse(body)

    // Get the user ID from the request (assuming authentication is implemented)
    // In a real app, you would get this from the authenticated session
    const userId = body.userId || "user-id-placeholder"

    // Generate the plan using OpenAI with function calling
    const generatedPlan = await generatePlan(validatedData)

    // Create the plan in the database
    const plan = await prisma.plan.create({
      data: {
        name: validatedData.name,
        goal: validatedData.goal,
        category: validatedData.category,
        currentLevel: validatedData.currentLevel,
        userId,
      },
    })

    // Create appointments for each entry in the generated plan
    const appointments = await Promise.all(
      generatedPlan.map((entry) =>
        prisma.appointment.create({
          data: {
            dateStart: new Date(entry.date_start),
            details: entry.details,
            amount: entry.amount,
            measureUnit: entry.measure_unit,
            planId: plan.id,
            userId,
          },
        }),
      ),
    )

    // Create a notification for the new plan
    await prisma.notification.create({
      data: {
        title: "New Plan Created",
        message: `Your ${validatedData.name} plan has been created with ${appointments.length} scheduled activities.`,
        userId,
      },
    })

    // Return the plan and appointments
    return NextResponse.json(
      {
        plan,
        appointments,
        message: "Plan created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating plan:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid input data",
          errors: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        message: "Failed to create plan",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the user ID from the request (assuming authentication is implemented)
    // In a real app, you would get this from the authenticated session
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId") || "user-id-placeholder"

    // Get all plans for the user
    const plans = await prisma.plan.findMany({
      where: {
        userId,
      },
      include: {
        appointments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch plans",
      },
      { status: 500 },
    )
  }
}

