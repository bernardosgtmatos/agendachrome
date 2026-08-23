# Chromebook Scheduling System — Guia para Agentes de IA

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + Tailwind CSS + Vanilla JS (SPA, sem build step) |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco (todos ambientes) | PostgreSQL (Supabase — pooler 6543 / direct 5432) |
| Deploy | Vercel (CDN p/ estáticos + serverless function p/ `/api/*`) |
| Auth | JWT + bcryptjs |

## Começando

1. Preencha `backend/.env` com as connection strings do Supabase (`DATABASE_URL` = pooler porta 6543 com `?pgbouncer=true&connection_limit=1`; `DIRECT_URL` = direct porta 5432). O `.env` é gitignored.

```bash
cd backend
npm install
npx prisma migrate deploy   # aplica migrations no Postgres
npm run seed                # cria usuários/turmas/config iniciais
npm run dev                 # nodemon — http://localhost:3000
```

### Credenciais padrão (seed)

| Perfil | Email | Senha |
|--------|-------|-------|
| Coordenador | `coordenador@escola.com` | `admin123` |
| Professor | `professor@escola.com` | `prof123` |

## Arquitetura

```
api/index.js                          # Função serverless do Vercel (exporta o app do Express)
vercel.json                           # Rewrite: /api/(.*) → /api/index
index.html                            # SPA completa (~2000 linhas)
backend/
├── server.js                         # Só dev: express.static + listen (usa src/app.js)
├── src/
│   ├── app.js                        # App Express: CORS, JSON, rotas, health, errorHandler
│   ├── config/constants.js           # HORARIOS (7 slots), LIMITE_TOTAL (36), ROLES
│   ├── controllers/                  # Handlers: auth, agendamento, turma, config
│   ├── middleware/                   # auth (JWT), roleAuth, errorHandler
│   ├── routes/                       # Mapping HTTP → controllers
│   ├── services/                     # authService, disponibilidadeService, configService
│   ├── lib/prisma.js                 # PrismaClient único (cacheado em globalThis)
│   └── seed.js                       # Dados iniciais
├── prisma/schema.prisma              # 4 models: Usuario, Turma, Configuracao, Agendamento
└── render.yaml                       # ❌ Legado (Render) — não usar mais
```

### Fluxo de requisição

Desenvolvimento (`server.js`):

```
Request → CORS → JSON → Static → authMiddleware → roleAuth → Controller → Response
                                                                     ↓
                                                              errorHandler (se erro)
```

Produção (Vercel): estáticos servidos pela CDN do Vercel; `/api/*` é reescrito (vercel.json) para `api/index.js` → mesmo fluxo, sem camada Static.

## Convenções

### Código
- Funções/variáveis: **inglês camelCase** (ex: `calcularDisponibilidade`)
- Respostas da API: **português** (`{erro, mensagem, data}`)
- Middleware encadeamento: `authMiddleware, roleAuth(ROLES.COORDENADOR), controller`
- Controllers: `try/catch` com `next(error)` — nunca `res.status().json()` direto no catch
- Erro customizado: `const err = new Error("msg"); err.status = 400; throw err`
- **PrismaClient: sempre via `require("../lib/prisma")`** — nunca `new PrismaClient()` (evita esgotar conexões no serverless)

### Banco
- Soft-delete em agendamentos: `status = "cancelado"` + `dataCancelamento`
- Hard-delete em turmas (com verificação de conflito — 409 se há agendamentos ativos)
- Índices em: `(data, status)`, `professorId`, `turmaId`
- PostgreSQL em todos os ambientes (Supabase). Migrations são específicas do provider.

### Regras de negócio críticas
- Máximo **36 chromebooks** por horário (configurável via `/api/config`)
- Conflito verificado **tanto na retirada quanto na devolução**
- Professores e coordenadores autenticados **veem todos** os agendamentos (decisão da escola); filtro opcional por `?professor=` na listagem
- Professor só **cancela** os seus próprios agendamentos; coordenador cancela qualquer
- CSV export: UTF-8 BOM, aspas escapadas, data pt-BR

## Armadilhas comuns

1. **Supabase usa pooler**: `DATABASE_URL` deve ser a do **transaction pooler (6543)** com `?pgbouncer=true&connection_limit=1`. Migrations/seed usam `DIRECT_URL` (porta 5432). Nunca use a URL direta na aplicação.
2. **Serverless é stateless**: sem `app.listen` no Vercel — `api/index.js` exporta o app. Alterações de rota vão para `src/app.js`, não para `server.js`.
3. **Disponibilidade**: ambos os horários (retirada E devolução) consomem capacidade — não apenas o de retirada.
4. **Seed contém upsert**: pode ser re-executado sem duplicar dados. Configuracao é singleton (id 1).
5. **JWT sem refresh**: token expira em 30 dias. Frontend só verifica expiração no carregamento.
6. **Frontend monolithic**: toda a UI está em `index.html` (~2000 linhas). Não há bundler nem framework JS.
7. **Vercel build não aplica migration automaticamente**: o Build Command deve rodar `npx prisma migrate deploy`.

## Comandos úteis

```bash
npm run dev              # desenvolvimento (nodemon) — localhost:3000
npm start                # execução standalone
npm run seed             # popular banco (usa DIRECT_URL)
npx prisma migrate dev   # criar/alterar migration (dev)
npx prisma migrate deploy # aplicar migrations (prod)
npx prisma studio        # UI do banco
```

## Deploy (Vercel + Supabase)

- **Vercel**: Framework Preset *Other*, Root Directory `/`, Install Command `cd backend && npm install`, Build Command `cd backend && npx prisma generate && npx prisma migrate deploy`.
- **Env vars (Produção)**: `DATABASE_URL` (pooler 6543), `DIRECT_URL` (direct 5432), `JWT_SECRET` (trocar do default!).
- Os estáticos (`index.html`, `assets/`) são servidos pela CDN; `/api/*` cai na função `api/index.js`.
- CORS não é necessário entre frontend e API na mesma origem Vercel (`FRONTEND_URL` opcional).

## Endpoints da API

| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/register` | Coordenador | Criar usuário |
| GET | `/api/auth/me` | Qualquer | Perfil atual |
| GET | `/api/auth/usuarios` | Coordenador | Listar usuários |
| DELETE | `/api/auth/usuarios/:id` | Coordenador | Excluir usuário (nunca coordenador) |
| GET | `/api/agendamentos` | Qualquer | Listar (filtros: `data`, `status`, `professor`) |
| POST | `/api/agendamentos` | Qualquer | Criar agendamento |
| PUT | `/api/agendamentos/:id/cancelar` | Qualquer | Cancelar |
| GET | `/api/agendamentos/export` | Coordenador | CSV |
| GET | `/api/turmas` | Qualquer | Listar turmas |
| POST | `/api/turmas` | Coordenador | Criar turma |
| PUT | `/api/turmas/:id` | Coordenador | Atualizar turma |
| DELETE | `/api/turmas/:id` | Coordenador | Remover turma |
| GET | `/api/disponibilidade?data=YYYY-MM-DD` | Qualquer | Disponibilidade por horário |
| GET | `/api/config` | Qualquer | Ler limite de chromebooks |
| PUT | `/api/config` | Coordenador | Alterar limite (1–999) |
| GET | `/api/health` | — | Health check |
