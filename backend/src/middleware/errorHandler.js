// Middleware global de tratamento de erros

function errorHandler(err, req, res, next) {
  console.error("Erro não tratado:", err);

  // Erro de validação do Prisma
  if (err.code === "P2002") {
    return res.status(409).json({
      erro: "Registro duplicado",
      mensagem: "Já existe um registro com este valor único."
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      erro: "Não encontrado",
      mensagem: "O registro solicitado não existe."
    });
  }

  // Erro genérico do servidor
  res.status(err.status || 500).json({
    erro: err.name || "Erro interno",
    mensagem: err.message || "Ocorreu um erro inesperado no servidor."
  });
}

// Cria um erro com status personalizado
function criarErro(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

module.exports = { errorHandler, criarErro };
