// Servidor Express do Sistema de Agendamento de Chromebooks
// Em produção: serve arquivos estáticos do frontend + API REST

const express = require("express");
const cors = require("cors");
const path = require("path");
const { errorHandler } = require("./src/middleware/errorHandler");

// Carrega variáveis de ambiente em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARES GLOBAIS ====================

// CORS — permite requisições de outras origens
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse de JSON no body das requisições
app.use(express.json());

// ==================== ARQUIVOS ESTÁTICOS (FRONTEND) ====================

// Serve os arquivos estáticos da pasta raiz do projeto (index.html)
app.use(express.static(path.join(__dirname, "..")));

// ==================== ROTAS DA API ====================

const authRoutes = require("./src/routes/auth");
const turmaRoutes = require("./src/routes/turmas");
const agendamentoRoutes = require("./src/routes/agendamentos");
const disponibilidadeRoutes = require("./src/routes/disponibilidade");

app.use("/api/auth", authRoutes);
app.use("/api/turmas", turmaRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/disponibilidade", disponibilidadeRoutes);

// ==================== HEALTH CHECK ====================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || "development"
  });
});

// ==================== TRATAMENTO DE ERROS ====================

app.use(errorHandler);

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`📁 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
