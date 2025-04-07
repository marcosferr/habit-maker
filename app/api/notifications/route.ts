import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { notificationInputSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        {
          message: "User ID is required",
        },
        { status: 400 },
      )
    }

    // Get notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch notifications",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const validatedData = notificationInputSchema.parse(body)

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        userId: validatedData.userId,
      },
    })

    return NextResponse.json(
      {
        notification,
        message: "Notification created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      {
        message: "Failed to create notification",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, read } = body

    if (!id) {
      return NextResponse.json(
        {
          message: "Notification ID is required",
        },
        { status: 400 },
      )
    }

    // Update the notification read status
    const notification = await prisma.notification.update({
      where: {
        id,
      },
      data: {
        read,
      },
    })

    return NextResponse.json({
      notification,
      message: "Notification updated successfully",
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      {
        message: "Failed to update notification",
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
          message: "Notification ID is required",
        },
        { status: 400 },
      )
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      {
        message: "Failed to delete notification",
      },
      { status: 500 },
    )
  }
}

