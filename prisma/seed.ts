/**
 * Database seed script.
 *
 * Run with: npm run db:seed
 *
 * Idempotent — uses upsert, so re-running never creates duplicates.
 * This is a standalone tsx script, so console output is intentional here.
 *
 * Note: this seeds a raw User row for local development and UI testing.
 * Password-based login still goes through Better Auth's sign-up flow,
 * which hashes credentials into the Account table; seeded users here do
 * not have a usable password until they sign up.
 */
import prisma from "@/lib/prisma";

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: "seed-demo-user",
      name: "Demo User",
      email: "demo@example.com",
      emailVerified: true,
      role: "admin",
    },
  });

  console.log(`Seeded user: ${demoUser.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
