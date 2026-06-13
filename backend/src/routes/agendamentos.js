// Rotas de agendamentos

const { Router } = require("express");
const agendamentoController = require("../controllers/agendamentoController");
const { authMiddleware } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");
const { ROLES } = require("../config/constants");

const router = Router();

// GET /api/agendamentos — Listar (qualquer autenticado)
router.get("/", authMiddleware, agendamentoController.listar);

// GET /api/agendamentos/export — Exportar CSV (coordenador)
router.get("/export", authMiddleware, roleAuth(ROLES.COORDENADOR), agendamentoController.exportarCSV);

// POST /api/agendamentos — Criar (qualquer autenticado)
router.post("/", authMiddleware, agendamentoController.criar);

// PUT /api/agendamentos/:id/cancelar — Cancelar (dono ou coordenador)
router.put("/:id/cancelar", authMiddleware, agendamentoController.cancelar);

module.exports = router;
