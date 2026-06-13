# Chromebook Scheduling System — Guia para Agentes de IA

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + Tailwind CSS + Vanilla JS (SPA, sem build step) |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco (dev) | SQLite (`file:./dev.db`) |
| Banco (prod) | PostgreSQL (Neon via Render) |
| Auth | JWT + bcryptjs |

## Começando

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed    # cria usuários/turmas iniciais
npm run dev     # nodemon — http://localhost:3000
```

### Credenciais padrão (seed)

| Perfil | Email | Senha |
|--------|-------|-------|
| Coordenador | `coordenador@escola.com` | `admin123` |
| Professor | `professor@escola.com` | `prof123` |

## Arquitetura

```
backend/
├── server.js                         # Express setup, CORS, rotas, health check
├── src/
│   ├── config/constants.js           # HORARIOS (7 slots), LIMITE_TOTAL (36), ROLES
│   ├── controllers/                  # Handlers: auth, agendamento, turma
│   ├── middleware/                   # auth (JWT), roleAuth, errorHandler
│   ├── routes/                       # Mapping HTTP → controllers
│   ├── services/                     # authService, disponibilidadeService
│   └── seed.js                       # Dados iniciais
├── prisma/schema.prisma              # 3 models: Usuario, Turma, Agendamento
└── render.yaml                       # Deploy Render (PostgreSQL)
index.html                            # SPA completa (~1500 linhas)
```

### Fluxo de requisição

```
Request → CORS → JSON → Static → authMiddleware → roleAuth → Controller → Response
                                                                     ↓
                                                              errorHandler (se erro)
```

## Convenções

### Código
- Funções/variáveis: **inglês camelCase** (ex: `calcularDisponibilidade`)
- Respostas da API: **português** (`{erro, mensagem, data}`)
- Middleware encadeamento: `authMiddleware, roleAuth(ROLES.COORDENADOR), controller`
- Controllers: `try/catch` com `next(error)` — nunca `res.status().json()` direto no catch
- Erro customizado: `const err = new Error("msg"); err.status = 400; throw err`

### Banco
- Soft-delete em agendamentos: `status = "cancelado"` + `dataCancelamento`
- Hard-delete em turmas (com verificação de conflito — 409 se há agendamentos ativos)
- Índices em: `(data, status)`, `professorId`, `turmaId`

### Regras de negócio críticas
- Máximo **36 chromebooks** por horário
- Conflito verificado **tanto na retirada quanto na devolução**
- Professor vê **apenas seus** agendamentos; Coordenador vê **todos**
- CSV export: UTF-8 BOM, aspas escapadas, data pt-BR

## Armadilhas comuns

1. **Prisma provider muda entre ambientes**: SQLite (dev) → PostgreSQL (prod). Migrations são específicas do provider.
2. **Disponibilidade**: ambos os horários (retirada E devolução) consomem capacidade — não apenas o de retirada.
3. **Seed contém upsert**: pode ser re-executado sem duplicar dados.
4. **JWT sem refresh**: token expira em 30 dias. Frontend só verifica expiração no carregamento.
5. **Frontend monolithic**: toda a UI está em `index.html` (~1500 linhas). Não há bundler nem framework JS.

## Comandos úteis

```bash
npm run dev              # desenvolvimento (nodemon)
npm start                # produção
npm run seed             # popular banco
npx prisma migrate dev   # criar migration
npx prisma studio        # UI do banco
npx prisma migrate deploy # produção
```

## Endpoints da API

| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/register` | Coordenador | Criar usuário |
| GET | `/api/auth/me` | Qualquer | Perfil atual |
| GET | `/api/auth/usuarios` | Coordenador | Listar usuários |
| GET | `/api/agendamentos` | Qualquer | Listar (filtro por professor p/ coord.) |
| POST | `/api/agendamentos` | Qualquer | Criar agendamento |
| PUT | `/api/agendamentos/:id/cancelar` | Qualquer | Cancelar |
| GET | `/api/agendamentos/export` | Coordenador | CSV |
| GET | `/api/turmas` | Qualquer | Listar turmas |
| POST | `/api/turmas` | Coordenador | Criar turma |
| PUT | `/api/turmas/:id` | Coordenador | Atualizar turma |
| DELETE | `/api/turmas/:id` | Coordenador | Remover turma |
| GET | `/api/disponibilidade?data=YYYY-MM-DD` | Qualquer | Disponibilidade |
| GET | `/api/health` | — | Health check |
