// Controlador de agendamentos: CRUD com regras de negócio

const prisma = require("../lib/prisma");

// Converte "YYYY-MM-DD" para Date no horário local (evita deslocamento de fuso)
function parseLocalDate(str) {
  const [ano, mes, dia] = str.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// GET /api/agendamentos — Lista agendamentos com filtros
// Todos os usuários veem todos os agendamentos
async function listar(req, res, next) {
  try {
    const { data, professor, status } = req.query;
    const filtros = {};

    // Filtro por data (opcional)
    if (data) {
      const dataInicio = parseLocalDate(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = parseLocalDate(data);
      dataFim.setHours(23, 59, 59, 999);
      filtros.data = { gte: dataInicio, lte: dataFim };
    }
    // Se nenhuma data for informada, mostra todos (passados e futuros)

    // Filtro por status (padrão: ativo)
    filtros.status = status || "ativo";

    // Busca agendamentos com dados relacionados
    const agendamentos = await prisma.agendamento.findMany({
      where: filtros,
      include: {
        professor: { select: { id: true, nome: true, email: true } },
        turma: { select: { id: true, nome: true } }
      },
      orderBy: [{ data: "asc" }, { horarioRetirada: "asc" }]
    });

    res.json(agendamentos);
  } catch (error) {
    next(error);
  }
}

// GET /api/agendamentos/export — Exporta agendamentos como CSV
async function exportarCSV(req, res, next) {
  try {
    const { data, professor } = req.query;
    const filtros = { status: "ativo" };

    if (data) {
      const dataInicio = parseLocalDate(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = parseLocalDate(data);
      dataFim.setHours(23, 59, 59, 999);
      filtros.data = { gte: dataInicio, lte: dataFim };
    }
    // Se nenhuma data for informada, exporta todos (passados e futuros)

    const agendamentos = await prisma.agendamento.findMany({
      where: filtros,
      include: {
        professor: { select: { nome: true } },
        turma: { select: { nome: true } }
      },
      orderBy: [{ data: "asc" }, { horarioRetirada: "asc" }]
    });

    if (agendamentos.length === 0) {
      return res.status(404).json({ erro: "Nenhum agendamento encontrado para exportar." });
    }

    // Gera CSV
    let csv = "\uFEFFData,Professor,Turma,Quantidade,Horário Retirada,Horário Devolução,Observações\n";

    agendamentos.forEach(ag => {
      const dataStr = ag.data.toLocaleDateString("pt-BR");
      const professorStr = `"${(ag.professor.nome || "").replace(/"/g, '""')}"`;
      const turmaStr = `"${(ag.turma.nome || "").replace(/"/g, '""')}"`;
      const quantidadeStr = ag.quantidade;
      const horarioRetiradaStr = `"${(ag.horarioRetirada || "").replace(/"/g, '""')}"`;
      const horarioDevolucaoStr = `"${(ag.horarioDevolucao || "").replace(/"/g, '""')}"`;
      const observacoesStr = `"${(ag.observacoes || "").replace(/"/g, '""')}"`;

      csv += `${dataStr},${professorStr},${turmaStr},${quantidadeStr},${horarioRetiradaStr},${horarioDevolucaoStr},${observacoesStr}\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=agendamentos_${data || "todos"}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// POST /api/agendamentos — Cria um novo agendamento
async function criar(req, res, next) {
  try {
    const { turmaId, quantidade, data, horarioRetirada, horarioDevolucao, observacoes } = req.body;

    // Validações básicas
    if (!turmaId || !quantidade || !data || !horarioRetirada || !horarioDevolucao) {
      return res.status(400).json({
        erro: "Campos obrigatórios: turmaId, quantidade, data, horarioRetirada, horarioDevolucao."
      });
    }

    const limite = await getLimiteChromebooks();
    if (quantidade < 1 || quantidade > limite) {
      return res.status(400).json({ erro: `A quantidade deve estar entre 1 e ${limite}.` });
    }

    // Valida data não passada
    const dataAg = parseLocalDate(data);
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    if (dataAg < hoje) {
      return res.status(400).json({ erro: "Não é possível agendar para uma data passada." });
    }

    // Verifica disponibilidade
    const disponibilidade = await verificarDisponibilidade(data, horarioRetirada, horarioDevolucao, quantidade);
    if (!disponibilidade.disponivel) {
      return res.status(409).json({
        erro: "Capacidade insuficiente",
        mensagem: disponibilidade.mensagem,
        disponibilidade: disponibilidade.disponibilidade
      });
    }

    // Verifica se a turma existe
    const turma = await prisma.turma.findUnique({ where: { id: Number(turmaId) } });
    if (!turma) {
      return res.status(404).json({ erro: "Turma não encontrada." });
    }

    // Cria o agendamento vinculado ao usuário logado
    const agendamento = await prisma.agendamento.create({
      data: {
        professorId: req.usuario.id,
        turmaId: Number(turmaId),
        quantidade: Number(quantidade),
        data: dataAg,
        horarioRetirada,
        horarioDevolucao,
        observacoes: observacoes || null,
        status: "ativo",
        dataCriacao: new Date()
      },
      include: {
        professor: { select: { id: true, nome: true } },
        turma: { select: { id: true, nome: true } }
      }
    });

    res.status(201).json(agendamento);
  } catch (error) {
    next(error);
  }
}

// PUT /api/agendamentos/:id/cancelar — Cancela um agendamento
async function cancelar(req, res, next) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id: Number(id) }
    });

    if (!agendamento) {
      return res.status(404).json({ erro: "Agendamento não encontrado." });
    }

    if (agendamento.status === "cancelado") {
      return res.status(400).json({ erro: "Este agendamento já foi cancelado." });
    }

    // Professor só pode cancelar seus próprios agendamentos
    if (req.usuario.role === ROLES.PROFESSOR && agendamento.professorId !== req.usuario.id) {
      return res.status(403).json({ erro: "Você não tem permissão para cancelar este agendamento." });
    }

    const atualizado = await prisma.agendamento.update({
      where: { id: Number(id) },
      data: {
        status: "cancelado",
        dataCancelamento: new Date()
      },
      include: {
        professor: { select: { id: true, nome: true } },
        turma: { select: { id: true, nome: true } }
      }
    });

    res.json(atualizado);
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, criar, cancelar, exportarCSV };
