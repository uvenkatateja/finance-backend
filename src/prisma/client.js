require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Singleton pattern — prevent multiple instances during hot reloads
let prisma;

function createPrismaClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  const options = { adapter };

  if (process.env.NODE_ENV !== 'production') {
    options.log = ['warn', 'error'];
  }

  return new PrismaClient(options);
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = { prisma };
