const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: { categoria: true, terminal: true, estoque: true },
      orderBy: { nome: 'asc' },
    });
    res.json(produtos);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, descricao, preco, imagemUrl, categoriaId, terminalId, estoque, estoqueMin } = req.body;
    const produto = await prisma.produto.create({
      data: {
        nome, descricao, preco, imagemUrl, categoriaId, terminalId,
        estoque: estoque !== undefined
          ? { create: { quantidade: Number(estoque), minimo: estoqueMin !== undefined ? Number(estoqueMin) : 5 } }
          : undefined,
      },
      include: { categoria: true, terminal: true, estoque: true },
    });
    res.status(201).json(produto);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.patch('/:id/ativo', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { ativo } = req.body;
    const produto = await prisma.produto.update({
      where: { id: req.params.id },
      data: { ativo },
      include: { categoria: true, terminal: true, estoque: true },
    });
    res.json(produto);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.patch('/:id/destaque', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({ where: { id: req.params.id } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    const atualizado = await prisma.produto.update({
      where: { id: req.params.id },
      data: { destaque: !produto.destaque },
    });
    res.json(atualizado);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, descricao, preco, imagemUrl, categoriaId, terminalId, ativo, estoqueMin } = req.body;

    const ops = [
      prisma.produto.update({
        where: { id: req.params.id },
        data: { nome, descricao, preco, imagemUrl, categoriaId, terminalId, ativo },
        include: { categoria: true, terminal: true, estoque: true },
      }),
    ];

    if (estoqueMin !== undefined) {
      ops.push(
        prisma.estoque.updateMany({
          where: { produtoId: req.params.id },
          data: { minimo: Number(estoqueMin) },
        })
      );
    }

    const [produto] = await prisma.$transaction(ops);
    res.json(produto);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    await prisma.produto.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
