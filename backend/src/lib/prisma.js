// Instância única do PrismaClient
// Cache em globalThis: evita múltiplas conexões em warm starts no Vercel

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

globalForPrisma.prisma = prisma;

module.exports = prisma;
