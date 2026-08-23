// Servidor Express do Sistema de Agendamento de Chromebooks
// Uso local/desenvolvimento: adiciona estáticos + listen
// Produção (Vercel) usa api/index.js — não executa este arquivo

// Carrega variáveis de ambiente em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

// ==================== ARQUIVOS ESTÁTICOS (FRONTEND) ====================

// Serve os arquivos estáticos do frontend (pasta public/ — mesmo layout do Vercel)
app.use(express.static(path.join(__dirname, "..", "public")));

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`📁 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
