// Middleware de autenticação JWT
// Verifica se o token é válido e adiciona os dados do usuário na requisição

const jwt = require("jsonwebtoken");
const { criarErro } = require("./errorHandler");

const JWT_SECRET = process.env.JWT_SECRET || "chromebook-secret-dev";

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw criarErro(401, "Token de autenticação não fornecido.");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw criarErro(401, "Formato de token inválido. Use: Bearer <token>");
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.usuario = {
        id: decoded.id,
        email: decoded.email,
        nome: decoded.nome,
        role: decoded.role
      };
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw criarErro(401, "Token expirado. Faça login novamente.");
      }
      throw criarErro(401, "Token inválido.");
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { authMiddleware, JWT_SECRET };
