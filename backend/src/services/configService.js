const prisma = require("../lib/prisma");

async function getLimiteChromebooks() {
  const config = await prisma.configuracao.findFirst();
  return config?.limiteChromebooks ?? 36;
}

async function upsertConfig(data) {
  const existing = await prisma.configuracao.findFirst();
  if (existing) {
    return prisma.configuracao.update({
      where: { id: existing.id },
      data
    });
  }
  return prisma.configuracao.create({ data });
}

module.exports = { getLimiteChromebooks, upsertConfig };
