const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const comandasPagas = await prisma.comanda.findMany({
      where: { status: 'PAGA', fechadoEm: { gte: hoje, lt: amanha } },
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
    const porFormaPagamento = { PIX: 0, CARTAO: 0, DINHEIRO: 0 };

    for (const comanda of comandasPagas) {
      if (comanda.formaPagamento) {
        porFormaPagamento[comanda.formaPagamento] = (porFormaPagamento[comanda.formaPagamento] || 0) + 1;
      }
      for (const pedido of comanda.pedidos) {
        for (const sub of pedido.subPedidos) {
          for (const item of sub.itens) {
            faturamento += Number(item.precoUnitario) * item.quantidade;
            produtosContagem[item.produtoId] = (produtosContagem[item.produtoId] || 0) + item.quantidade;
          }
        }
      }
    }

    const ticketMedio = comandasPagas.length > 0 ? faturamento / comandasPagas.length : 0;

    const topProdutosIds = Object.entries(produtosContagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topProdutos = await prisma.produto.findMany({
      where: { id: { in: topProdutosIds } },
      select: { id: true, nome: true },
    });

    const maisVendidos = topProdutos
      .map((p) => ({ ...p, quantidade: produtosContagem[p.id] || 0 }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const alertas = await prisma.$queryRaw`
      SELECT e.id, e.quantidade, e.minimo, p.nome as "produtoNome", p.id as "produtoId"
      FROM "Estoque" e
      JOIN "Produto" p ON p.id = e."produtoId"
      WHERE e.quantidade <= e.minimo AND p.ativo = true
    `;

    const pedidosAbertos = await prisma.pedido.count({
      where: { status: { notIn: ['ENTREGUE', 'CANCELADO'] } },
    });

    const mesasAbertas = await prisma.comanda.count({
      where: { status: { in: ['ABERTA', 'AGUARDANDO_PAGAMENTO'] } },
    });

    res.json({
      faturamento,
      ticketMedio,
      totalComandas: comandasPagas.length,
      maisVendidos,
      alertasEstoque: alertas,
      pedidosAbertos,
      mesasAbertas,
      porFormaPagamento,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
