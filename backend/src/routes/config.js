const { Router } = require("express");
const configController = require("../controllers/configController");
const { authMiddleware } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");
const { ROLES } = require("../config/constants");

const router = Router();

// GET /api/config — Qualquer autenticado pode ler
router.get("/", authMiddleware, configController.getConfig);

// PUT /api/config — Apenas coordenador pode alterar
router.put("/", authMiddleware, roleAuth(ROLES.COORDENADOR), configController.updateConfig);

module.exports = router;
