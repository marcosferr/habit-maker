import { openai } from "@ai-sdk/openai";
import { generateObject, jsonSchema } from "ai";

// Define the schema for the plan entries
export type PlanEntry = {
  date_start: string;
  details: string;
  amount: number;
  measure_unit: string;
};

// Define the schema for the user input
export type PlanInput = {
  name: string;
  goal: string;
  category: string;
  currentLevel: string;
  experience: string;
  frequency: number;
  preferredDays: string[];
  constraints: string;
  preferences: string;
  duration: number; // in weeks
  specificDetails?: Record<string, any>;
};

// Function to generate a plan using OpenAI function calling
export async function generatePlan(input: PlanInput): Promise<PlanEntry[]> {
  try {
    // Get the current date for context
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Create a category-specific section of the prompt
    let categorySpecificPrompt = "";

    switch (input.category.toLowerCase()) {
      case "fitness":
        categorySpecificPrompt = `
          This is a fitness-related goal. Consider:
          - Progressive overload principles
          - Rest and recovery days
          - Variety in exercise types
          - Appropriate intensity based on experience level (${input.experience})
        `;
        break;
      case "learning":
        categorySpecificPrompt = `
          This is a learning-related goal. Consider:
          - Spaced repetition for knowledge retention
          - Mix of theory and practical application
          - Increasing complexity over time
          - Resources needed for each learning session
        `;
        break;
      case "productivity":
        categorySpecificPrompt = `
          This is a productivity-related goal. Consider:
          - Time blocking techniques
          - Task prioritization methods
          - Accountability measures
          - Balancing focus work with breaks
        `;
        break;
      case "mindfulness":
        categorySpecificPrompt = `
          This is a mindfulness-related goal. Consider:
          - Gradual increase in meditation duration
          - Variety of mindfulness practices
          - Integration into daily routine
          - Progress indicators beyond time spent
        `;
        break;
      case "creative":
        categorySpecificPrompt = `
          This is a creative goal. Consider:
          - Skill-building exercises
          - Project milestones
          - Inspiration sources
          - Feedback opportunities
        `;
        break;
      default:
        categorySpecificPrompt = `
          Consider the specific nature of this goal and create appropriate activities
          that will help the user progress steadily toward their objective.
        `;
    }

    // Create a prompt that includes all the user input details
    const prompt = `
      Create a personalized plan based on the following information:

      Name: ${input.name}
      Goal: ${input.goal}
      Category: ${input.category}
      Current Level: ${input.currentLevel}
      Experience Level: ${input.experience}
      Preferred Frequency: ${input.frequency} days per week
      Preferred Days: ${input.preferredDays.join(", ")}
      Constraints or Limitations: ${input.constraints || "None"}
      Preferences: ${input.preferences}
      Duration: ${input.duration} weeks

      ${categorySpecificPrompt}

      ${
        input.specificDetails
          ? `Additional Details: ${JSON.stringify(input.specificDetails)}`
          : ""
      }

      Today's date is ${formattedToday}. Generate a structured plan with calendar entries starting from today and extending for ${
      input.duration
    } weeks. Each entry should include a start date, details of the activity, an amount (numeric value), and a measurement unit appropriate for the category and activity.

      The plan should be progressive, realistic, and tailored to the user's current level. Prioritize scheduling activities on the user's preferred days (${input.preferredDays.join(
        ", "
      )}) when possible.
    `;

    // Use OpenAI with function calling to generate the plan
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      prompt,
      schema: jsonSchema({
        type: "object",
        properties: {
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date_start: {
                  type: "string",
                  format: "date",
                  description:
                    "The start date for this activity in YYYY-MM-DD format",
                },
                details: {
                  type: "string",
                  description: "Description of the activity",
                },
                amount: {
                  type: "number",
                  description:
                    "Numeric value representing the quantity or duration",
                },
                measure_unit: {
                  type: "string",
                  description:
                    "Unit of measurement (e.g., km, minutes, pages, tasks, sessions)",
                },
              },
              required: ["date_start", "details", "amount", "measure_unit"],
            },
          },
        },
        required: ["entries"],
      }),
    });

    // Extract the entries array from the object
    return (object as { entries: PlanEntry[] }).entries;
  } catch (error) {
    console.error("Error generating plan:", error);
    throw new Error("Failed to generate plan. Please try again.");
  }
}
