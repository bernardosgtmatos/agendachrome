// Script de seed para popular o banco com dados iniciais
// Uso: node src/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TURMAS_DEFAULT = [
  "6° Ano A", "6° Ano B", "6° Ano C",
  "7° Ano A", "7° Ano B", "7° Ano C",
  "8° Ano A", "8° Ano B", "8° Ano C",
  "9° Ano A", "9° Ano B", "9° Ano C",
  "1° Ano EM", "2° Ano EM", "3° Ano EM"
];

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Cria usuário coordenador padrão
  const senhaHash = await bcrypt.hash("admin123", 10);
  const coordenador = await prisma.usuario.upsert({
    where: { email: "coordenador@escola.com" },
    update: {},
    create: {
      nome: "Coordenador",
      email: "coordenador@escola.com",
      senha: senhaHash,
      role: "coordenador"
    }
  });
  console.log(`✅ Coordenador criado: ${coordenador.email} (senha: admin123)`);

  // 2. Cria um professor de exemplo
  const senhaProfHash = await bcrypt.hash("prof123", 10);
  const professor = await prisma.usuario.upsert({
    where: { email: "professor@escola.com" },
    update: {},
    create: {
      nome: "Professor Exemplo",
      email: "professor@escola.com",
      senha: senhaProfHash,
      role: "professor"
    }
  });
  console.log(`✅ Professor criado: ${professor.email} (senha: prof123)`);

  // 3. Cria configuração padrão do sistema
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: { limiteChromebooks: 36 },
    create: { id: 1, limiteChromebooks: 36 }
  });
  console.log("✅ Configuração padrão criada (limite: 36 chromebooks).");

  // 4. Cria as turmas padrão
  let turmasCriadas = 0;
  for (const nome of TURMAS_DEFAULT) {
    try {
      await prisma.turma.upsert({
        where: { nome },
        update: {},
        create: { nome }
      });
      turmasCriadas++;
    } catch (error) {
      console.error(`❌ Erro ao criar turma "${nome}":`, error.message);
    }
  }
  console.log(`✅ ${turmasCriadas} turmas criadas.`);

  console.log("\n✨ Seed concluído com sucesso!");
  console.log("📧 Login coordenador: coordenador@escola.com / admin123");
  console.log("📧 Login professor:   professor@escola.com / prof123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
