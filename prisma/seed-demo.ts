/**
 * Optional DEMO data: a few writers with handwriting samples so the
 * handwriting gallery has content during demos. NOT part of `npm run setup`.
 * Run with: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const MATH =
  "Module 2 — Linear Algebra\n\nTheorem: If A has n linearly independent eigenvectors, then A is diagonalizable.\n\nA = PDP⁻¹,  D = diag(λ₁, λ₂, …, λₙ)\n\n∫₀^π sin x dx = 2";
const PHYSICS =
  "Chapter 4 — Laws of Motion\n\nNewton's Second Law:\nF = dp/dt = ma (constant mass)\n\n• Friction: f ≤ μN\n• Inclined plane: a = g(sin θ − μ cos θ)";
const CODE =
  "Recursion — notes\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\n# Time: O(2^n)  Space: O(n)";
const HEADINGS =
  "UNIT 3 · THERMODYNAMICS\n— Zeroth Law —\n\n✦ Key idea: thermal equilibrium is transitive.\n\n1. First Law →  ΔU = Q − W";
const CHEM =
  "Unit 5 — Alcohols & Phenols\n\nR–OH + Na → R–ONa + ½H₂\n\nOxidation:\n1° alcohol → aldehyde → carboxylic acid\n2° alcohol → ketone";
const ENGLISH =
  "Chapter 2 — Character Sketch\n\nElizabeth's wit is not merely decorative; it is the instrument through which Austen examines pride and perception.";

const DEMO = [
  {
    name: "Ananya Rao",
    email: "ananya@demo.dev",
    college: "CBIT, Hyderabad",
    profile: {
      title: "Engineering notes specialist",
      bio: "Demo writer — neat exam-ready notes with clean diagrams and math notation.",
      location: "Hyderabad",
      languages: "English,Telugu,Hindi",
      subjects: "Engineering Mathematics,Physics,Computer Science",
      handwritingStyles: "Very Neat,Exam Revision,Diagrams,Math Notation",
      pricePerPage: 8,
      digitalPricePerPage: 5,
      availability: "AVAILABLE",
      turnaroundDays: 2,
      identityVerified: true,
      phoneVerified: true,
      jobsCompleted: 127,
      totalPagesWritten: 3480,
      onTimePercent: 98,
      avgResponseMins: 14,
      ratingAvg: 4.9,
      ratingCount: 84,
    },
    samples: [
      { title: "Mathematical notation", style: "MATH", fontKey: "hand2", sampleText: MATH },
      { title: "Heading & structure style", style: "HEADINGS", fontKey: "hand", sampleText: HEADINGS },
      { title: "Physics — neat everyday writing", style: "NEAT", fontKey: "hand2", sampleText: PHYSICS },
    ],
  },
  {
    name: "Karthik Iyer",
    email: "karthik@demo.dev",
    college: "Anna University",
    profile: {
      title: "Fast writer, record-book pro",
      bio: "Demo writer — bulk notebook completion at speed without losing legibility.",
      location: "Chennai",
      languages: "English,Tamil",
      subjects: "Engineering Mathematics,Physics,Chemistry",
      handwritingStyles: "Fast,Normal,Diagrams",
      pricePerPage: 6,
      digitalPricePerPage: 4,
      availability: "AVAILABLE",
      turnaroundDays: 1,
      identityVerified: true,
      phoneVerified: true,
      jobsCompleted: 210,
      totalPagesWritten: 6200,
      onTimePercent: 96,
      avgResponseMins: 22,
      ratingAvg: 4.7,
      ratingCount: 156,
    },
    samples: [
      { title: "Fast record-book writing", style: "NORMAL", fontKey: "hand3", sampleText: PHYSICS },
      { title: "Math notation (fast)", style: "MATH", fontKey: "hand3", sampleText: MATH },
    ],
  },
  {
    name: "Meera Nair",
    email: "meera@demo.dev",
    college: "University of Kerala",
    profile: {
      title: "Presentation & digital notes",
      bio: "Demo writer — structured revision sheets and presentation-ready notes.",
      location: "Kochi",
      languages: "English,Malayalam,Hindi",
      subjects: "Machine Learning,Python,Computer Science,English",
      handwritingStyles: "Very Neat,Exam Revision,Code Notes",
      pricePerPage: 10,
      digitalPricePerPage: 6,
      availability: "BUSY",
      turnaroundDays: 3,
      identityVerified: true,
      phoneVerified: false,
      jobsCompleted: 64,
      totalPagesWritten: 1430,
      onTimePercent: 100,
      avgResponseMins: 40,
      ratingAvg: 4.8,
      ratingCount: 49,
    },
    samples: [
      { title: "Programming notes", style: "CODE", fontKey: "hand2", sampleText: CODE },
      { title: "Chemistry — very neat", style: "VERY_NEAT", fontKey: "hand2", sampleText: CHEM },
      { title: "Long-form cursive", style: "NEAT", fontKey: "hand", sampleText: ENGLISH },
    ],
  },
];

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  for (const d of DEMO) {
    const user = await db.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        name: d.name,
        email: d.email,
        college: d.college,
        passwordHash: hash,
        trialEndsAt: new Date(Date.now() + 60 * 86400000),
      },
    });
    const profile = await db.writerProfile.upsert({
      where: { userId: user.id },
      update: d.profile,
      create: { ...d.profile, userId: user.id },
    });
    await db.handwritingSample.deleteMany({ where: { writerId: profile.id } });
    for (const [i, s] of d.samples.entries()) {
      await db.handwritingSample.create({
        data: { ...s, writerId: profile.id, sortOrder: i },
      });
    }
    console.log(`demo writer ready: ${d.email}`);
  }
  console.log("Demo data created (password for all: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
