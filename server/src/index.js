require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const terminaisRoutes = require('./routes/terminais');
const cardapioRoutes = require('./routes/cardapio');
const produtosRoutes = require('./routes/produtos');
const mesasRoutes = require('./routes/mesas');
const comandasRoutes = require('./routes/comandas');
const subPedidosRoutes = require('./routes/subpedidos');
const garConsRoutes = require('./routes/garcons');
const { terminaisRouter: terminaisSubPedidosRouter } = require('./routes/subpedidos');
const dashboardRoutes = require('./routes/dashboard');
const estoqueRoutes = require('./routes/estoque');

const { setupSocket } = require('./socket');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

// Injeta io em todas as rotas
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/terminais', terminaisRoutes);
app.use('/api/terminais', terminaisSubPedidosRouter);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/comandas', comandasRoutes);
app.use('/api/subpedidos', subPedidosRoutes);
app.use('/api/garcons', garConsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/estoque', estoqueRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
