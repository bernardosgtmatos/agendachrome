// Controlador de turmas: CRUD completo

const prisma = require("../lib/prisma");

// GET /api/turmas — Lista todas as turmas ordenadas por nome
async function listar(req, res, next) {
  try {
    const turmas = await prisma.turma.findMany({
      orderBy: { nome: "asc" }
    });
    res.json(turmas);
  } catch (error) {
    next(error);
  }
}

// POST /api/turmas — Cria uma nova turma
async function criar(req, res, next) {
  try {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: "O nome da turma é obrigatório." });
    }

    const turma = await prisma.turma.create({
      data: { nome: nome.trim() }
    });

    res.status(201).json(turma);
  } catch (error) {
    // Erro de duplicata tratado pelo errorHandler (P2002)
    next(error);
  }
}

// PUT /api/turmas/:id — Atualiza o nome de uma turma
async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: "O nome da turma é obrigatório." });
    }

    const turma = await prisma.turma.update({
      where: { id: Number(id) },
      data: { nome: nome.trim() }
    });

    res.json(turma);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/turmas/:id — Remove uma turma
async function remover(req, res, next) {
  try {
    const { id } = req.params;

    // Verifica se existem agendamentos vinculados
    const agendamentos = await prisma.agendamento.count({
      where: {
        turmaId: Number(id),
        status: "ativo"
      }
    });

    if (agendamentos > 0) {
      return res.status(409).json({
        erro: "Conflito",
        mensagem: `Não é possível remover esta turma pois existem ${agendamentos} agendamento(s) ativo(s) vinculados a ela.`
      });
    }

    await prisma.turma.delete({
      where: { id: Number(id) }
    });

    res.json({ mensagem: "Turma removida com sucesso." });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, criar, atualizar, remover };
