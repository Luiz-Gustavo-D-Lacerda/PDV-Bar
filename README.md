# PDV Bar

Sistema de ponto de venda completo para bar e restaurante com roteamento automático de pedidos por terminais de preparo.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Socket.io Client
- **Backend:** Node.js + Express + Socket.io
- **Banco:** PostgreSQL + Prisma ORM
- **Auth:** JWT

## Estrutura

```
pdv-bar/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── prisma/          # Schema e seed
│   ├── schema.prisma
│   └── seed.js
├── .env.example
└── package.json     # Workspace raiz
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm 8+

## Instalação

### 1. Clone e instale dependências

```bash
git clone <repo>
cd pdv-bar

# Instala dependências de cada pacote
npm install              # root (prisma CLI, concurrently, seed)
npm install --prefix server
npm install --prefix client
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/pdv_bar"
JWT_SECRET="uma_chave_secreta_longa_e_aleatoria_aqui"
PORT=3001
PUBLIC_URL="http://localhost:5173"
```

### 3. Crie o banco de dados

```bash
# Crie o banco no PostgreSQL
psql -U postgres -c "CREATE DATABASE pdv_bar;"
```

### 4. Execute as migrations

```bash
npm run db:migrate
```

> Na primeira vez, aceite nomear a migration como `init`

### 5. Execute o seed (dados iniciais)

```bash
npm run db:seed
```

Isso cria:
- Admin: `admin@bar.com` / `admin123`
- Garçom: `garcom@bar.com` / `garcom123`
- 3 terminais (Bar, Cozinha 1, Cozinha 2)
- 4 categorias + 10 produtos
- 10 mesas

### 6. Inicie o projeto

```bash
# Inicia servidor e cliente em paralelo
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Prisma Studio:** `npm run db:studio`

## URLs de acesso

| Rota | Descrição | Auth |
|------|-----------|------|
| `/login` | Login de usuários | — |
| `/mesa/:id` | Cardápio para o cliente | — |
| `/mesa/:id/comanda` | Acompanhamento de pedido | — |
| `/terminal/:id` | Tela do terminal (cozinha/bar) | — |
| `/garcom` | Mapa de mesas do garçom | Garçom+ |
| `/admin` | Dashboard | Admin/Gerente |
| `/admin/terminais` | CRUD de terminais | Admin/Gerente |
| `/admin/cardapio` | CRUD de produtos | Admin/Gerente |
| `/admin/mesas` | CRUD de mesas + QR Code | Admin/Gerente |
| `/admin/estoque` | Controle de estoque | Admin/Gerente |

## Fluxo de pedido

```
Cliente escaneia QR → Cardápio → Adiciona itens → Envia pedido
                                                          ↓
Backend agrupa por terminal → cria SubPedido por terminal
                                                          ↓
Terminal recebe via Socket.io → Inicia preparo → Marca pronto
                                                          ↓
Garçom é notificado → Entrega → Estoque decrementado
                                                          ↓
Todos entregues → Comanda fecha → Pagar
```

## Eventos Socket.io

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `novo_subpedido` | Server → Terminal | Novo sub-pedido chegou |
| `status_subpedido` | Server → Todos | Status de sub-pedido mudou |
| `pedido_pronto` | Server → Garçom | Todos sub-pedidos prontos |
| `comanda_atualizada` | Server → Mesa | Pedido confirmado na mesa |

## Comandos úteis

```bash
npm run db:migrate    # Criar/aplicar migrations
npm run db:seed       # Popular banco com dados de exemplo
npm run db:studio     # Abrir Prisma Studio
npm run db:reset      # Resetar banco (APAGA TUDO)
npm run server        # Apenas o backend
npm run client        # Apenas o frontend
```
