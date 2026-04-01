/**
 * Seed script — populates the database with sample data for development.
 *
 * Usage: node src/seed.js
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('./prisma/client');

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Clean existing data ──────────────────────────────────────────────────
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ─── Create Users ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@finance.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      status: 'active',
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@finance.com',
      password: hashedPassword,
      name: 'Analyst User',
      role: 'analyst',
      status: 'active',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@finance.com',
      password: hashedPassword,
      name: 'Viewer User',
      role: 'viewer',
      status: 'active',
    },
  });

  console.log('  ✓ Created 3 users (admin, analyst, viewer)');
  console.log(`    Admin:   admin@finance.com / password123`);
  console.log(`    Analyst: analyst@finance.com / password123`);
  console.log(`    Viewer:  viewer@finance.com / password123`);

  // ─── Create Financial Records ─────────────────────────────────────────────
  const categories = ['Salary', 'Freelance', 'Rent', 'Utilities', 'Groceries', 'Transport', 'Entertainment', 'Healthcare', 'Investment', 'Miscellaneous'];

  const records = [];

  // Generate 12 months of data
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);

    // Monthly salary income
    records.push({
      amount: 5000 + Math.random() * 1000,
      type: 'income',
      category: 'Salary',
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      notes: `Salary for ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      createdBy: admin.id,
    });

    // Occasional freelance income
    if (Math.random() > 0.4) {
      records.push({
        amount: 500 + Math.random() * 2000,
        type: 'income',
        category: 'Freelance',
        date: new Date(date.getFullYear(), date.getMonth(), 15),
        notes: 'Freelance project payment',
        createdBy: admin.id,
      });
    }

    // Monthly expenses
    const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Transport', 'Entertainment', 'Healthcare'];
    for (const cat of expenseCategories) {
      if (Math.random() > 0.2) {
        records.push({
          amount: cat === 'Rent' ? 1500 : 50 + Math.random() * 500,
          type: 'expense',
          category: cat,
          date: new Date(date.getFullYear(), date.getMonth(), 5 + Math.floor(Math.random() * 20)),
          notes: `${cat} expense`,
          createdBy: admin.id,
        });
      }
    }
  }

  await prisma.financialRecord.createMany({ data: records });
  console.log(`  ✓ Created ${records.length} financial records (12 months)`);

  console.log('\n✅ Database seeded successfully!\n');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
