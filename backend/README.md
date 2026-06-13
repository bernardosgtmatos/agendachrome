# 📱 Sistema de Agendamento de Chromebooks Escolares

Sistema fullstack para gerenciamento de agendamentos de chromebooks em ambiente escolar. Permite que professores reservem chromebooks para suas aulas e coordenadores gerenciem todo o sistema.

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML + Tailwind CSS + JavaScript (SPA) |
| **Backend** | Node.js + Express |
| **ORM** | Prisma |
| **Banco (dev)** | SQLite |
| **Banco (prod)** | PostgreSQL (Neon) |
| **Auth** | JWT + bcryptjs |

## 📋 Funcionalidades

- ✅ Login com dois perfis: **Professor** e **Coordenador**
- ✅ Visualização de disponibilidade por data/horário
- ✅ Criação de agendamentos (professor vinculado automaticamente)
- ✅ Cancelamento de agendamentos
- ✅ CRUD de turmas (apenas coordenador)
- ✅ Exportação de agendamentos para CSV (apenas coordenador)
- ✅ Professor vê apenas seus agendamentos; coordenador vê todos
- ✅ 7 horários de aula, limite de 36 chromebooks por horário

## 🛠️ Setup Local

### Pré-requisitos
- Node.js 18+
- NPM

### Passo a passo

```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Instalar dependências
npm install

# 3. Configurar banco de dados (SQLite para desenvolvimento)
# O arquivo .env já está configurado com SQLite:
# DATABASE_URL="file:./dev.db"

# 4. Rodar migration para criar as tabelas
npx prisma migrate dev --name init

# 5. Popular banco com dados iniciais
npm run seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

O servidor iniciará em **http://localhost:3000** 🎉

### Usuários de teste (criados pelo seed)

| Perfil | Email | Senha |
|--------|-------|-------|
| **Coordenador** | coordenador@escola.com | admin123 |
| **Professor** | professor@escola.com | prof123 |

## 🌐 Deploy em Produção (Render + Neon)

### 1. Configurar Neon (PostgreSQL grátis)
1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um projeto, copie a `connection string`

### 2. Ajustar schema para PostgreSQL
No arquivo `prisma/schema.prisma`, altere:
```prisma
datasource db {
  provider = "postgresql"  // altere de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Deploy no Render
1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um **Web Service** com:
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run seed`
   - **Start Command:** `node server.js`
4. Adicione as variáveis de ambiente:
   - `DATABASE_URL`: connection string do Neon
   - `JWT_SECRET`: uma string segura (o Render pode gerar automaticamente)
   - `NODE_ENV`: `production`

> 💡 O arquivo `render.yaml` pode ser usado para deploy automatizado (Render Blueprint).

## 📁 Estrutura do Projeto

```
backend/
├── prisma/
│   └── schema.prisma          # Definição dos modelos do banco
├── src/
│   ├── config/
│   │   └── constants.js       # Horários, limite de chromebooks
│   ├── controllers/
│   │   ├── authController.js  # Login, registro
│   │   ├── turmaController.js # CRUD turmas
│   │   └── agendamentoController.js # CRUD agendamentos
│   ├── middleware/
│   │   ├── auth.js            # Verificação JWT
│   │   ├── roleAuth.js        # Controle de perfil
│   │   └── errorHandler.js    # Tratamento de erros
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   ├── turmas.js          # Rotas de turmas
│   │   ├── agendamentos.js    # Rotas de agendamentos
│   │   └── disponibilidade.js # Rota de disponibilidade
│   ├── services/
│   │   ├── authService.js     # Lógica de autenticação
│   │   └── disponibilidadeService.js # Cálculo de disponibilidade
│   └── seed.js                # Dados iniciais
├── server.js                  # Entry point
├── .env                       # Variáveis de ambiente (dev)
├── .env.example               # Template para produção
├── render.yaml                # Config de deploy Render
└── package.json

index.html                     # Frontend SPA (na raiz do projeto)
```

## 🔌 API Endpoints

### Autenticação
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | Login (retorna JWT) |
| POST | `/api/auth/register` | Coordenador | Criar usuário |
| GET | `/api/auth/me` | Autenticado | Dados do usuário logado |
| GET | `/api/auth/usuarios` | Coordenador | Listar usuários |

### Turmas
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/turmas` | Autenticado | Listar turmas |
| POST | `/api/turmas` | Coordenador | Criar turma |
| PUT | `/api/turmas/:id` | Coordenador | Atualizar turma |
| DELETE | `/api/turmas/:id` | Coordenador | Remover turma |

### Agendamentos
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/agendamentos` | Autenticado | Listar (professor vê próprios) |
| POST | `/api/agendamentos` | Autenticado | Criar agendamento |
| PUT | `/api/agendamentos/:id/cancelar` | Dono/Coord. | Cancelar |
| GET | `/api/agendamentos/export` | Coordenador | Exportar CSV |

### Disponibilidade
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/disponibilidade?data=YYYY-MM-DD` | Autenticado | Disponibilidade por horário |

### Health Check
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Status do servidor |

## 📝 Licença

Projeto acadêmico — TCC.
