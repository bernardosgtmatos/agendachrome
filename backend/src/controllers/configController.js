const { getLimiteChromebooks, upsertConfig } = require("../services/configService");

// GET /api/config — Retorna as configurações do sistema
async function getConfig(req, res, next) {
  try {
    const limiteChromebooks = await getLimiteChromebooks();
    res.json({ limiteChromebooks });
  } catch (error) {
    next(error);
  }
}

// PUT /api/config — Atualiza configurações (coordenador)
async function updateConfig(req, res, next) {
  try {
    const { limiteChromebooks } = req.body;

    if (!limiteChromebooks || limiteChromebooks < 1 || limiteChromebooks > 999) {
      return res.status(400).json({
        erro: "O limite de chromebooks deve estar entre 1 e 999."
      });
    }

    const config = await upsertConfig({ limiteChromebooks: Number(limiteChromebooks) });
    res.json({ limiteChromebooks: config.limiteChromebooks });
  } catch (error) {
    next(error);
  }
}

module.exports = { getConfig, updateConfig };
