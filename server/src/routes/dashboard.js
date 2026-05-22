const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;

    const agora = new Date();
    let inicio, fim;

    if (periodo === 'hoje') {
      inicio = new Date(agora); inicio.setHours(0, 0, 0, 0);
      fim    = new Date(agora); fim.setHours(23, 59, 59, 999);
    } else if (periodo === 'semana') {
      inicio = new Date(agora); inicio.setDate(agora.getDate() - 6); inicio.setHours(0, 0, 0, 0);
      fim    = new Date(agora); fim.setHours(23, 59, 59, 999);
    } else {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      fim    = new Date(agora); fim.setHours(23, 59, 59, 999);
    }

    // ── Comandas pagas no período ─────────────────────────────────────────────
    const comandasPagas = await prisma.comanda.findMany({
      where: { status: 'PAGA', fechadoEm: { gte: inicio, lte: fim } },
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
    });

    let faturamento = 0;
    const produtosContagem = {};
    const porFormaPagamento = {
      PIX:      { count: 0, total: 0 },
      CARTAO:   { count: 0, total: 0 },
      DINHEIRO: { count: 0, total: 0 },
    };

    for (const comanda of comandasPagas) {
      let totalComanda = 0;
      for (const pedido of comanda.pedidos) {
        for (const sub of pedido.subPedidos) {
          for (const item of sub.itens) {
            const valor = Number(item.precoUnitario) * item.quantidade;
            totalComanda += valor;
            faturamento  += valor;
            produtosContagem[item.produtoId] = (produtosContagem[item.produtoId] || 0) + item.quantidade;
          }
        }
      }
      if (comanda.formaPagamento && porFormaPagamento[comanda.formaPagamento]) {
        porFormaPagamento[comanda.formaPagamento].count++;
        porFormaPagamento[comanda.formaPagamento].total += totalComanda;
      }
    }

    const ticketMedio = comandasPagas.length > 0 ? faturamento / comandasPagas.length : 0;

    // ── Top 5 mais vendidos ───────────────────────────────────────────────────
    const topIds = Object.entries(produtosContagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topProdutos = await prisma.produto.findMany({
      where: { id: { in: topIds } },
      select: { id: true, nome: true },
    });

    const maisVendidos = topProdutos
      .map((p) => ({ ...p, quantidade: produtosContagem[p.id] || 0 }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // ── Pedidos em aberto (tempo real) ────────────────────────────────────────
    const pedidosAbertos = await prisma.pedido.count({
      where: { status: { notIn: ['ENTREGUE', 'CANCELADO'] } },
    });

    // ── Status das mesas (tempo real) ─────────────────────────────────────────
    const mesas = await prisma.mesa.findMany({
      where: { ativa: true },
      include: {
        comandas: {
          where: { status: { in: ['ABERTA', 'AGUARDANDO_PAGAMENTO'] } },
          include: { pedidos: { select: { status: true } } },
        },
      },
    });

    let mesasLivres = 0, mesasOcupadas = 0, mesasAguardando = 0, mesasProntas = 0;
    for (const mesa of mesas) {
      if (mesa.comandas.length === 0) {
        mesasLivres++;
      } else if (mesa.comandas.some((c) => c.status === 'AGUARDANDO_PAGAMENTO')) {
        mesasAguardando++;
      } else if (mesa.comandas.some((c) => c.pedidos.some((p) => p.status === 'PRONTO'))) {
        mesasProntas++;
      } else {
        mesasOcupadas++;
      }
    }

    // ── Alertas de estoque (produtos + insumos) ───────────────────────────────
    const estoques = await prisma.estoque.findMany({
      include: { produto: { select: { nome: true, ativo: true } } },
    });
    const alertasProdutos = estoques
      .filter((e) => e.quantidade <= e.minimo && e.produto.ativo)
      .map((e) => ({ id: e.id, nome: e.produto.nome, quantidade: e.quantidade, minimo: e.minimo, tipo: 'produto' }));

    const insumos = await prisma.insumo.findMany({ where: { ativo: true } });
    const alertasInsumos = insumos
      .filter((i) => i.quantidade <= i.minimo)
      .map((i) => ({ id: i.id, nome: i.nome, quantidade: i.quantidade, minimo: i.minimo, tipo: 'insumo', setor: i.setor }));

    res.json({
      periodo,
      faturamento,
      ticketMedio,
      totalComandas: comandasPagas.length,
      maisVendidos,
      alertasEstoque: [...alertasProdutos, ...alertasInsumos],
      pedidosAbertos,
      mesas: {
        total: mesas.length,
        livres: mesasLivres,
        ocupadas: mesasOcupadas,
        aguardando: mesasAguardando,
        prontas: mesasProntas,
      },
      porFormaPagamento,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
