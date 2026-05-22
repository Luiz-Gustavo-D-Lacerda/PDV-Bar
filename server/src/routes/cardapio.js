const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (_req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      include: {
        produtos: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          include: { terminal: true, estoque: true },
        },
      },
    });
    res.json(categorias);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
