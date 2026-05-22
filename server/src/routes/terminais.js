const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const terminais = await prisma.terminal.findMany({ orderBy: { ordem: 'asc' } });
    res.json(terminais);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, cor, icone, ordem } = req.body;
    const terminal = await prisma.terminal.create({ data: { nome, cor, icone, ordem: ordem ?? 0 } });
    res.status(201).json(terminal);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, cor, icone, ordem, ativo } = req.body;
    const terminal = await prisma.terminal.update({
      where: { id: req.params.id },
      data: { nome, cor, icone, ordem, ativo },
    });
    res.json(terminal);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    await prisma.terminal.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
