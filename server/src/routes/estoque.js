const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        categoria: true,
        terminal: true,
        estoque: {
          include: { movimentacoes: { orderBy: { criadoEm: 'desc' }, take: 5 } },
        },
      },
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map((p) => ({
      id: p.estoque?.id ?? null,
      produtoId: p.id,
      quantidade: p.estoque?.quantidade ?? null,
      minimo: p.estoque?.minimo ?? 0,
      movimentacoes: p.estoque?.movimentacoes ?? [],
      produto: { nome: p.nome, categoria: p.categoria, terminal: p.terminal },
      semControle: !p.estoque,
    }));

    res.json(resultado);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Ativar controle de estoque para um produto sem registro
router.post('/:produtoId/ativar', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const estoque = await prisma.estoque.create({
      data: { produtoId: req.params.produtoId, quantidade: 0, minimo: 0 },
      include: {
        produto: { include: { categoria: true, terminal: true } },
      },
    });
    res.status(201).json({
      id: estoque.id,
      produtoId: estoque.produtoId,
      quantidade: estoque.quantidade,
      minimo: estoque.minimo,
      movimentacoes: [],
      produto: { nome: estoque.produto.nome, categoria: estoque.produto.categoria, terminal: estoque.produto.terminal },
      semControle: false,
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ erro: 'Estoque já existe' });
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Remover controle de estoque (apaga registro e histórico)
router.delete('/:produtoId', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const estoque = await prisma.estoque.findUnique({ where: { produtoId: req.params.produtoId } });
    if (!estoque) return res.status(404).json({ erro: 'Estoque não encontrado' });
    await prisma.movimentacaoEstoque.deleteMany({ where: { estoqueId: estoque.id } });
    await prisma.estoque.delete({ where: { id: estoque.id } });
    res.json({ ok: true });
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
