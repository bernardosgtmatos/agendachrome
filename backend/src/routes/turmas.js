// Rotas de turmas

const { Router } = require("express");
const turmaController = require("../controllers/turmaController");
const { authMiddleware } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");
const { ROLES } = require("../config/constants");

const router = Router();

// GET /api/turmas — Listar (qualquer autenticado)
router.get("/", authMiddleware, turmaController.listar);

// POST /api/turmas — Criar (apenas coordenador)
router.post("/", authMiddleware, roleAuth(ROLES.COORDENADOR), turmaController.criar);

// PUT /api/turmas/:id — Atualizar (apenas coordenador)
router.put("/:id", authMiddleware, roleAuth(ROLES.COORDENADOR), turmaController.atualizar);

// DELETE /api/turmas/:id — Remover (apenas coordenador)
router.delete("/:id", authMiddleware, roleAuth(ROLES.COORDENADOR), turmaController.remover);

module.exports = router;
