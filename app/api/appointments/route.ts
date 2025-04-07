import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { appointmentInputSchema, appointmentUpdateSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    const planId = url.searchParams.get("planId")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build the query filters
    const filters: any = {}

    if (userId) {
      filters.userId = userId
    }

    if (planId) {
      filters.planId = planId
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      filters.dateStart = {}

      if (startDate) {
        filters.dateStart.gte = new Date(startDate)
      }

      if (endDate) {
        filters.dateStart.lte = new Date(endDate)
      }
    }

    // Get appointments based on filters
    const appointments = await prisma.appointment.findMany({
      where: filters,
      orderBy: {
        dateStart: "asc",
      },
      include: {
        plan: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch appointments",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const validatedData = appointmentInputSchema.parse(body)

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        dateStart: new Date(validatedData.dateStart),
        details: validatedData.details,
        amount: validatedData.amount,
        measureUnit: validatedData.measureUnit,
        planId: validatedData.planId,
        userId: validatedData.userId,
      },
    })

    return NextResponse.json(
      {
        appointment,
        message: "Appointment created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      {
        message: "Failed to create appointment",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const validatedData = appointmentUpdateSchema.parse(body)

    // Update the appointment
    const appointment = await prisma.appointment.update({
      where: {
        id: validatedData.id,
      },
      data: {
        ...(validatedData.dateStart && { dateStart: new Date(validatedData.dateStart) }),
        ...(validatedData.details && { details: validatedData.details }),
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.measureUnit && { measureUnit: validatedData.measureUnit }),
        ...(validatedData.completed !== undefined && { completed: validatedData.completed }),
      },
    })

    return NextResponse.json({
      appointment,
      message: "Appointment updated successfully",
    })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      {
        message: "Failed to update appointment",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          message: "Appointment ID is required",
        },
        { status: 400 },
      )
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      message: "Appointment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json(
      {
        message: "Failed to delete appointment",
      },
      { status: 500 },
    )
  }
}

