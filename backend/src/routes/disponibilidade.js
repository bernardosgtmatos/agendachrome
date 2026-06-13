// Rotas de disponibilidade

const { Router } = require("express");
const { authMiddleware } = require("../middleware/auth");
const { calcularDisponibilidade } = require("../services/disponibilidadeService");

const router = Router();

// GET /api/disponibilidade?data=YYYY-MM-DD — Retorna disponibilidade por horário
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ erro: "O parâmetro 'data' é obrigatório (YYYY-MM-DD)." });
    }

    const disponibilidade = await calcularDisponibilidade(data);
    res.json({ data, disponibilidade });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
