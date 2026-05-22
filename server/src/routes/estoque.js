const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const estoques = await prisma.estoque.findMany({
      include: {
        produto: { include: { categoria: true, terminal: true } },
        movimentacoes: { orderBy: { criadoEm: 'desc' }, take: 5 },
      },
      orderBy: { produto: { nome: 'asc' } },
    });
    res.json(estoques);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:produtoId/movimentacao', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { tipo, quantidade, motivo } = req.body;
    const estoque = await prisma.estoque.findUnique({ where: { produtoId: req.params.produtoId } });
    if (!estoque) return res.status(404).json({ erro: 'Estoque não encontrado' });

    let novaQtd = estoque.quantidade;
    if (tipo === 'ENTRADA') novaQtd += quantidade;
    else if (tipo === 'SAIDA') novaQtd -= quantidade;
    else novaQtd = quantidade;

    const [mov, estoqueAtualizado] = await prisma.$transaction([
      prisma.movimentacaoEstoque.create({
        data: { estoqueId: estoque.id, tipo, quantidade, motivo },
      }),
      prisma.estoque.update({
        where: { id: estoque.id },
        data: { quantidade: novaQtd },
        include: { produto: true },
      }),
    ]);

    res.status(201).json({ movimentacao: mov, estoque: estoqueAtualizado });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
