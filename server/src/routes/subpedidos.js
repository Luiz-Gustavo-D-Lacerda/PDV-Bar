const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Listar sub-pedidos de um terminal
const terminaisRouter = require('express').Router({ mergeParams: true });

terminaisRouter.get('/:id/subpedidos', async (req, res) => {
  try {
    const { status } = req.query;
    const where = { terminalId: req.params.id };
    if (status) where.status = status;

    const subPedidos = await prisma.subPedido.findMany({
      where,
      include: {
        itens: { include: { produto: true } },
        terminal: true,
        pedido: { include: { comanda: { include: { mesa: true } } } },
      },
      orderBy: { criadoEm: 'asc' },
    });
    res.json(subPedidos);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Atualizar status de um sub-pedido (terminais)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const STATUS_VALIDOS = ['RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];
    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }
    const subPedido = await prisma.subPedido.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        itens: { include: { produto: true } },
        terminal: true,
        pedido: { include: { comanda: { include: { mesa: true } }, subPedidos: true } },
      },
    });

    const io = req.io;
    const mesaId = subPedido.pedido.comanda.mesaId;
    io.to(`terminal:${subPedido.terminalId}`).emit('status_subpedido', subPedido);
    io.to(`mesa:${mesaId}`).emit('status_subpedido', subPedido);

    // Desconta estoque ao marcar como ENTREGUE
    if (status === 'ENTREGUE') {
      for (const item of subPedido.itens) {
        const estoque = await prisma.estoque.findUnique({ where: { produtoId: item.produtoId } });
        if (estoque) {
          await prisma.$transaction([
            prisma.estoque.update({
              where: { id: estoque.id },
              data: { quantidade: { decrement: item.quantidade } },
            }),
            prisma.movimentacaoEstoque.create({
              data: { estoqueId: estoque.id, tipo: 'SAIDA', quantidade: item.quantidade, motivo: 'Venda automática' },
            }),
          ]);
        }
      }
    }

    // Atualiza status do pedido pai conforme sub-pedidos
    const todosSubPedidos = subPedido.pedido.subPedidos;
    const todosStatus = todosSubPedidos.map((s) =>
      s.id === subPedido.id ? status : s.status
    );

    let novoStatusPedido = null;
    if (todosStatus.every((s) => s === 'CANCELADO')) novoStatusPedido = 'CANCELADO';
    else if (todosStatus.every((s) => s === 'ENTREGUE' || s === 'CANCELADO')) novoStatusPedido = 'ENTREGUE';
    else if (todosStatus.every((s) => s === 'PRONTO' || s === 'CANCELADO')) novoStatusPedido = 'PRONTO';
    else if (todosStatus.some((s) => s === 'EM_PREPARO' || s === 'PRONTO')) novoStatusPedido = 'EM_PREPARO';

    if (novoStatusPedido) {
      await prisma.pedido.update({
        where: { id: subPedido.pedidoId },
        data: { status: novoStatusPedido },
      });

      if (novoStatusPedido === 'PRONTO') {
        io.to('garcom').emit('pedido_pronto', {
          pedidoId: subPedido.pedidoId,
          mesaNumero: subPedido.pedido.comanda.mesa.numero,
          mesaId,
        });
      }
    }

    res.json(subPedido);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Cancelar sub-pedido (garçom com permissão)
router.post('/:id/cancelar', auth(['ADMIN', 'GERENTE', 'GARCOM']), async (req, res) => {
  try {
    const { motivo } = req.body;

    // GARCOM precisa ter permissão explícita
    if (req.user.role === 'GARCOM') {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      const perms = dbUser?.permissoes || {};
      if (!perms.cancelarItens) {
        return res.status(403).json({ erro: 'Você não tem permissão para cancelar pedidos' });
      }
    }

    const subPedido = await prisma.subPedido.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELADO',
        motivoCancelamento: motivo?.trim() || null,
      },
      include: {
        itens: { include: { produto: true } },
        terminal: true,
        pedido: { include: { comanda: { include: { mesa: true } }, subPedidos: true } },
      },
    });

    const io = req.io;
    const mesaId = subPedido.pedido.comanda.mesaId;
    io.to(`terminal:${subPedido.terminalId}`).emit('status_subpedido', subPedido);
    io.to(`terminal:${subPedido.terminalId}`).emit('subpedido_cancelado', subPedido);
    io.to(`mesa:${mesaId}`).emit('status_subpedido', subPedido);

    // Atualiza status do pedido pai se todos cancelados
    const todosStatus = subPedido.pedido.subPedidos.map((s) =>
      s.id === subPedido.id ? 'CANCELADO' : s.status
    );
    if (todosStatus.every((s) => s === 'CANCELADO')) {
      await prisma.pedido.update({
        where: { id: subPedido.pedidoId },
        data: { status: 'CANCELADO' },
      });
    }

    res.json(subPedido);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
module.exports.terminaisRouter = terminaisRouter;
