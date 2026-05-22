const router = require('express').Router();
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const mesas = await prisma.mesa.findMany({
      orderBy: { numero: 'asc' },
      include: {
        comandas: {
          where: { status: { in: ['ABERTA', 'AGUARDANDO_PAGAMENTO'] } },
          include: { pedidos: { include: { subPedidos: true } } },
        },
      },
    });
    res.json(mesas);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { numero } = req.body;
    if (!numero) return res.status(400).json({ erro: 'Número da mesa é obrigatório' });
    const mesa = await prisma.mesa.create({ data: { numero: Number(numero) } });
    res.status(201).json(mesa);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ erro: 'Já existe uma mesa com esse número' });
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { numero, ativa } = req.body;
    const mesa = await prisma.mesa.update({ where: { id: req.params.id }, data: { numero, ativa } });
    res.json(mesa);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mesa = await prisma.mesa.findUnique({ where: { id: req.params.id } });
    if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada' });
    res.json(mesa);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id/qrcode', async (req, res) => {
  try {
    const mesa = await prisma.mesa.findUnique({ where: { id: req.params.id } });
    if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada' });
    const url = `${process.env.PUBLIC_URL}/mesa/${mesa.id}`;
    const png = await QRCode.toBuffer(url, { type: 'png', width: 300, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Todas as comandas ativas de uma mesa
router.get('/:id/comandas', async (req, res) => {
  try {
    const comandas = await prisma.comanda.findMany({
      where: { mesaId: req.params.id, status: { in: ['ABERTA', 'AGUARDANDO_PAGAMENTO'] } },
      include: {
        pedidos: {
          include: {
            subPedidos: {
              where: { status: { not: 'CANCELADO' } },
              include: { itens: true },
            },
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });
    res.json(comandas);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Abrir nova comanda (sempre cria uma nova, independente de existirem outras)
router.post('/:id/comanda/abrir', async (req, res) => {
  try {
    const { nome } = req.body;
    const comanda = await prisma.comanda.create({
      data: { mesaId: req.params.id, nome: nome?.trim() || null },
    });
    req.io.to('garcom').emit('comanda_atualizada', { mesaId: req.params.id });
    req.io.to(`mesa:${req.params.id}`).emit('comanda_atualizada', { mesaId: req.params.id });
    res.status(201).json(comanda);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
