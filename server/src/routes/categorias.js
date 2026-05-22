const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const cats = await prisma.categoria.findMany({
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { produtos: true } } },
    });
    res.json(cats);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, ordem } = req.body;
    if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
    const cat = await prisma.categoria.create({
      data: { nome: nome.trim(), ordem: Number(ordem) || 0 },
    });
    res.status(201).json(cat);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, ordem, ativo } = req.body;
    const cat = await prisma.categoria.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(ordem !== undefined && { ordem: Number(ordem) }),
        ...(ativo !== undefined && { ativo }),
      },
    });
    res.json(cat);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const count = await prisma.produto.count({ where: { categoriaId: req.params.id, ativo: true } });
    if (count > 0) return res.status(400).json({ erro: `Categoria tem ${count} produto(s) ativo(s). Remova-os primeiro.` });
    await prisma.categoria.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
