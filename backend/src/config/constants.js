// Constantes do sistema de agendamento de chromebooks

// Horários disponíveis para agendamento
const HORARIOS = [
  { nome: "1º Horário (07:00 - 07:50)", inicio: "07:00", fim: "07:50" },
  { nome: "2º Horário (07:50 - 08:40)", inicio: "07:50", fim: "08:40" },
  { nome: "3º Horário (09:00 - 09:50)", inicio: "09:00", fim: "09:50" },
  { nome: "4º Horário (09:50 - 10:40)", inicio: "09:50", fim: "10:40" },
  { nome: "5º Horário (10:40 - 11:30)", inicio: "10:40", fim: "11:30" },
  { nome: "6º Horário (12:20 - 13:10)", inicio: "12:20", fim: "13:10" },
  { nome: "7º Horário (13:10 - 14:00)", inicio: "13:10", fim: "14:00" }
];

// Limite máximo de chromebooks por horário
const LIMITE_TOTAL = 36;

// Roles do sistema
const ROLES = {
  PROFESSOR: "professor",
  COORDENADOR: "coordenador"
};

module.exports = { HORARIOS, LIMITE_TOTAL, ROLES };
