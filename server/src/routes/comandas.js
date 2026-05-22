const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Buscar comanda
router.get('/:id', async (req, res) => {
  try {
    const comanda = await prisma.comanda.findUnique({
      where: { id: req.params.id },
      include: {
        mesa: true,
        pedidos: {
          include: {
            subPedidos: {
              include: {
                itens: { include: { produto: true } },
                terminal: true,
              },
            },
          },
        },
      },
    });
    if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });
    res.json(comanda);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Criar pedido na comanda (agrupa itens por terminal, cria SubPedidos)
router.post('/:id/pedido', async (req, res) => {
  try {
    const { itens } = req.body;

    // Captura garçom autenticado (opcional — pedidos via QR não têm)
    let garcomId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (['GARCOM', 'CAIXA', 'ADMIN', 'GERENTE'].includes(payload.role)) {
          garcomId = payload.id;
        }
      } catch {}
    }

    const comanda = await prisma.comanda.findUnique({ where: { id: req.params.id } });
    if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });
    if (comanda.status !== 'ABERTA') return res.status(400).json({ erro: 'Comanda não está aberta' });

    // Busca produtos para saber terminalId e preço
    const produtoIds = [...new Set(itens.map((i) => i.produtoId))];
    const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds } } });
    const prodMap = Object.fromEntries(produtos.map((p) => [p.id, p]));

    // Agrupa por terminal
    const porTerminal = {};
    for (const item of itens) {
      const prod = prodMap[item.produtoId];
      if (!prod) continue;
      if (!porTerminal[prod.terminalId]) porTerminal[prod.terminalId] = [];
      porTerminal[prod.terminalId].push({ ...item, preco: prod.preco });
    }

    const pedido = await prisma.pedido.create({
      data: {
        comandaId: req.params.id,
        garcomId,
        subPedidos: {
          create: Object.entries(porTerminal).map(([terminalId, items]) => ({
            terminalId,
            itens: {
              create: items.map((i) => ({
                produtoId: i.produtoId,
                quantidade: i.quantidade,
                observacao: i.observacao,
                precoUnitario: i.preco,
              })),
            },
          })),
        },
      },
      include: {
        subPedidos: {
          include: { itens: { include: { produto: true } }, terminal: true },
        },
      },
    });

    // Emite evento para cada terminal
    const io = req.io;
    for (const sub of pedido.subPedidos) {
      io.to(`terminal:${sub.terminalId}`).emit('novo_subpedido', sub);
    }
    io.to(`mesa:${comanda.mesaId}`).emit('comanda_atualizada', { pedidoId: pedido.id });

    res.status(201).json(pedido);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Fechar comanda (solicitar pagamento)
router.post('/:id/fechar', auth(['ADMIN', 'GERENTE', 'CAIXA', 'GARCOM']), async (req, res) => {
  try {
    const comanda = await prisma.comanda.findUnique({ where: { id: req.params.id } });
    if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });
    if (comanda.status !== 'ABERTA') return res.status(400).json({ erro: 'Comanda não está aberta' });

    const atualizada = await prisma.comanda.update({
      where: { id: req.params.id },
      data: { status: 'AGUARDANDO_PAGAMENTO' },
    });
    req.io.to('garcom').emit('comanda_atualizada', { mesaId: comanda.mesaId });
    req.io.to(`mesa:${comanda.mesaId}`).emit('comanda_atualizada', { mesaId: comanda.mesaId });
    res.json(atualizada);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Pagar comanda
router.post('/:id/pagar', auth(['ADMIN', 'GERENTE', 'CAIXA']), async (req, res) => {
  try {
    const comanda = await prisma.comanda.findUnique({ where: { id: req.params.id } });
    if (!comanda) return res.status(404).json({ erro: 'Comanda não encontrada' });
    if (comanda.status !== 'AGUARDANDO_PAGAMENTO') {
      return res.status(400).json({ erro: 'Comanda não está aguardando pagamento' });
    }

    const atualizada = await prisma.comanda.update({
      where: { id: req.params.id },
      data: { status: 'PAGA', fechadoEm: new Date() },
    });

    req.io.to(`mesa:${comanda.mesaId}`).emit('comanda_atualizada', { status: 'PAGA' });
    req.io.to('garcom').emit('comanda_atualizada', { mesaId: comanda.mesaId });

    res.json(atualizada);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
