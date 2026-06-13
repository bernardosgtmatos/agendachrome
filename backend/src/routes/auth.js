// Rotas de autenticação

const { Router } = require("express");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");
const { ROLES } = require("../config/constants");

const router = Router();

// POST /api/auth/login — Login público
router.post("/login", authController.login);

// POST /api/auth/register — Criar usuário (apenas coordenador)
router.post("/register", authMiddleware, roleAuth(ROLES.COORDENADOR), authController.register);

// GET /api/auth/me — Dados do usuário logado
router.get("/me", authMiddleware, authController.me);

// GET /api/auth/usuarios — Listar usuários (apenas coordenador)
router.get("/usuarios", authMiddleware, roleAuth(ROLES.COORDENADOR), authController.listarUsuarios);

// DELETE /api/auth/usuarios/:id — Excluir usuário (apenas coordenador)
router.delete("/usuarios/:id", authMiddleware, roleAuth(ROLES.COORDENADOR), authController.deletar);

module.exports = router;
