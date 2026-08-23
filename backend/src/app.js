// Aplicação Express (sem listen e sem estáticos)
// Compartilhada entre:
//  - server.js  (desenvolvimento local, com express.static + listen)
//  - api/index.js (produção no Vercel, como serverless function)

const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// CORS — permite requisições de outras origens
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse de JSON no body das requisições
app.use(express.json());

// ==================== ROTAS DA API ====================

const authRoutes = require("./routes/auth");
const turmaRoutes = require("./routes/turmas");
const agendamentoRoutes = require("./routes/agendamentos");
const disponibilidadeRoutes = require("./routes/disponibilidade");
const configRoutes = require("./routes/config");

app.use("/api/auth", authRoutes);
app.use("/api/turmas", turmaRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/disponibilidade", disponibilidadeRoutes);
app.use("/api/config", configRoutes);

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

module.exports = app;
