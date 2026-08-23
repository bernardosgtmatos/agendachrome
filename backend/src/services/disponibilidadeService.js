// Serviço de cálculo de disponibilidade de chromebooks por data/horário

const prisma = require("../lib/prisma");
const { HORARIOS } = require("../config/constants");
const { getLimiteChromebooks } = require("./configService");

// Converte "YYYY-MM-DD" para Date no horário local (evita deslocamento de fuso)
function parseLocalDate(str) {
  const [ano, mes, dia] = str.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// Calcula a disponibilidade de chromebooks para cada horário em uma data
async function calcularDisponibilidade(data) {
  const dataInicio = parseLocalDate(data);
  dataInicio.setHours(0, 0, 0, 0);

  const dataFim = parseLocalDate(data);
  dataFim.setHours(23, 59, 59, 999);

  // Busca todos os agendamentos ativos para a data
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      data: { gte: dataInicio, lte: dataFim },
      status: "ativo"
    }
  });

  const limite = await getLimiteChromebooks();

  // Calcula a disponibilidade por horário
  const disponibilidade = {};
  HORARIOS.forEach(horario => {
    disponibilidade[horario.nome] = limite;
  });

  agendamentos.forEach(ag => {
    if (disponibilidade[ag.horarioRetirada] !== undefined) {
      disponibilidade[ag.horarioRetirada] -= ag.quantidade;
    }
    if (ag.horarioDevolucao !== ag.horarioRetirada && disponibilidade[ag.horarioDevolucao] !== undefined) {
      disponibilidade[ag.horarioDevolucao] -= ag.quantidade;
    }
  });

  return disponibilidade;
}

// Verifica se há disponibilidade suficiente para um agendamento
async function verificarDisponibilidade(data, horarioRetirada, horarioDevolucao, quantidade) {
  const disponibilidade = await calcularDisponibilidade(data);

  const faltas = [];

  const dispRetirada = disponibilidade[horarioRetirada];
  if (dispRetirada === undefined) {
    throw Object.assign(new Error(`Horário de retirada "${horarioRetirada}" inválido.`), { status: 400 });
  }
  if (dispRetirada < quantidade) {
    faltas.push(`${horarioRetirada} (disponível: ${dispRetirada}/${quantidade})`);
  }

  if (horarioDevolucao !== horarioRetirada) {
    const dispDevolucao = disponibilidade[horarioDevolucao];
    if (dispDevolucao === undefined) {
      throw Object.assign(new Error(`Horário de devolução "${horarioDevolucao}" inválido.`), { status: 400 });
    }
    if (dispDevolucao < quantidade) {
      faltas.push(`${horarioDevolucao} (disponível: ${dispDevolucao}/${quantidade})`);
    }
  }

  return {
    disponivel: faltas.length === 0,
    disponibilidade,
    mensagem: faltas.length === 0
      ? "Disponível"
      : `Capacidade insuficiente em: ${faltas.join(", ")}`
  };
}

module.exports = { calcularDisponibilidade, verificarDisponibilidade };
