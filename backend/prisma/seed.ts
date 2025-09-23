import { PrismaClient, Role } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
      password: "supersecurepassword",
    },
    {
      name: "User One",
      email: "user1@example.com",
      role: "USER",
      password: "password1",
    },
    {
      name: "User Two",
      email: "user2@example.com",
      role: "USER",
      password: "password2",
    },
    {
      name: "User Three",
      email: "user3@example.com",
      role: "USER",
      password: "password3",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role as Role,
        password: hashedPassword,
      },
    });
  }

  console.log("Seeded 4 users (3 regular + 1 admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
