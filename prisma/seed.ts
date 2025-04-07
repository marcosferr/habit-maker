const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Create a test user if it doesn't exist
  const testUser = await prisma.user.upsert({
    where: { id: "user-id-placeholder" },
    update: {},
    create: {
      id: "user-id-placeholder",
      email: "test@example.com",
      name: "Test User",
    },
  });

  console.log("Seed data created:", { testUser });
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
