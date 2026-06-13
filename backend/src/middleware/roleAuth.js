// Middleware de autorização por perfil (role)
// Deve ser usado APÓS o middleware de autenticação

const { criarErro } = require("./errorHandler");

function roleAuth(...rolesPermitidas) {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        throw criarErro(401, "Usuário não autenticado.");
      }

      if (!rolesPermitidas.includes(req.usuario.role)) {
        throw criarErro(403, "Acesso negado. Você não tem permissão para esta ação.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { roleAuth };
