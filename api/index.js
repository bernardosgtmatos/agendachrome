// Função serverless do Vercel
// O Vercel roteia /api/* para este arquivo (ver vercel.json)

const app = require("../backend/src/app");

module.exports = app;
