"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoalDetailsForm } from "@/components/goal-details-form";
import { PlanPreview } from "@/components/plan-preview";
import type { planInputSchema } from "@/lib/validation";
import type { z } from "zod";

export default function GoalDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial data from URL params
  const initialData = {
    name: searchParams.get("name") || "",
    goal: searchParams.get("goal") || "",
    category: searchParams.get("category") || "",
    currentLevel: searchParams.get("currentLevel") || "",
  };

  const [step, setStep] = useState<"details" | "preview">("details");
  const [planData, setPlanData] = useState<any>(null);
  const [formData, setFormData] = useState<z.infer<
    typeof planInputSchema
  > | null>(null);

  // Function to generate plan preview
  async function generatePlanPreview(data: z.infer<typeof planInputSchema>) {
    try {
      setFormData(data);

      const response = await fetch("/api/generate-plan-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: "user-id-placeholder", // In a real app, get this from authentication
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan preview");
      }

      const previewData = await response.json();
      setPlanData({
        ...previewData,
        name: data.name,
        category: data.category,
        startDate: new Date(),
      });

      setStep("preview");
    } catch (error) {
      console.error("Error generating plan preview:", error);
      // Handle error (show toast, etc.)
    }
  }

  // Function to save the plan
  async function savePlan() {
    try {
      if (!formData) return;

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: "user-id-placeholder", // In a real app, get this from authentication
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save plan");
      }

      const data = await response.json();

      // Redirect to the plan details page
      router.push(`/plans/${data.plan.id}`);
    } catch (error) {
      console.error("Error saving plan:", error);
      // Handle error (show toast, etc.)
    }
  }

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-10 max-w-7xl mx-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Goal Plan</CardTitle>
          <CardDescription>
            {step === "details"
              ? "Provide additional details to help us create your personalized plan"
              : "Review your personalized plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "details" ? (
            <GoalDetailsForm
              initialData={initialData}
              onSubmit={generatePlanPreview}
            />
          ) : (
            <PlanPreview
              planData={planData}
              onSave={savePlan}
              onEdit={() => setStep("details")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
