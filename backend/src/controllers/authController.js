// Controlador de autenticação: login, registro, informações do usuário

const authService = require("../services/authService");
const { ROLES } = require("../config/constants");

// POST /api/auth/login — Realiza login e retorna JWT
async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    const resultado = await authService.login(email, senha);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/register — Cria novo usuário (apenas coordenador)
async function register(req, res, next) {
  try {
    const { nome, email, senha, role } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, email e senha são obrigatórios." });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
    }

    const roleFinal = role === ROLES.COORDENADOR ? ROLES.COORDENADOR : ROLES.PROFESSOR;

    const usuario = await authService.criarUsuario(nome, email, senha, roleFinal);
    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me — Retorna dados do usuário logado
async function me(req, res, next) {
  try {
    const usuario = await authService.buscarUsuarioPorId(req.usuario.id);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/usuarios — Lista todos os usuários (apenas coordenador)
async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await authService.listarUsuarios();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/auth/usuarios/:id — Exclui um usuário (apenas coordenador)
async function deletar(req, res, next) {
  try {
    const { id } = req.params;
    const resultado = await authService.deletarUsuario(id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register, me, listarUsuarios, deletar };
