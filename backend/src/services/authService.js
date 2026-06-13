// Serviço de autenticação: login, criação de usuários, verificação de token

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { JWT_SECRET } = require("../middleware/auth");

const prisma = new PrismaClient();

// Gera um token JWT para o usuário
function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Realiza login: verifica email e senha, retorna token + dados do usuário
async function login(email, senha) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    throw Object.assign(new Error("Email ou senha incorretos."), { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    throw Object.assign(new Error("Email ou senha incorretos."), { status: 401 });
  }

  const token = gerarToken(usuario);

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role
    }
  };
}

// Cria um novo usuário (apenas coordenador pode chamar)
async function criarUsuario(nome, email, senha, role) {
  // Verifica se email já existe
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    throw Object.assign(new Error("Já existe um usuário com este email."), { status: 409 });
  }

  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senha, salt);

  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: senhaHash, role }
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role
  };
}

// Retorna os dados do usuário logado
async function buscarUsuarioPorId(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, role: true, createdAt: true }
  });

  if (!usuario) {
    throw Object.assign(new Error("Usuário não encontrado."), { status: 404 });
  }

  return usuario;
}

// Lista todos os usuários (apenas coordenador)
// Ordenação: coordenadores primeiro, depois professores; ambos em ordem alfabética
async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, createdAt: true }
  });

  // Ordena: coordenador primeiro, depois professor; dentro de cada grupo, por nome
  usuarios.sort((a, b) => {
    const roleOrder = { coordenador: 0, professor: 1 };
    const cmpRole = (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
    if (cmpRole !== 0) return cmpRole;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  return usuarios;
}

// Exclui um usuário (apenas coordenador, não permite excluir outros coordenadores)
async function deletarUsuario(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) },
    include: { agendamentos: { where: { status: "ativo" } } }
  });

  if (!usuario) {
    throw Object.assign(new Error("Usuário não encontrado."), { status: 404 });
  }

  if (usuario.role === "coordenador") {
    throw Object.assign(new Error("Não é possível excluir um coordenador."), { status: 403 });
  }

  if (usuario.agendamentos.length > 0) {
    throw Object.assign(
      new Error(`Usuário possui ${usuario.agendamentos.length} agendamento(s) ativo(s). Cancele-os antes de excluir.`),
      { status: 409 }
    );
  }

  await prisma.usuario.delete({ where: { id: Number(id) } });

  return { mensagem: "Usuário excluído com sucesso." };
}

module.exports = { login, criarUsuario, buscarUsuarioPorId, listarUsuarios, deletarUsuario };
