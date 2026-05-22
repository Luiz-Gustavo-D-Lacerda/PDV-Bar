const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Listar insumos (ADMIN/GERENTE veem tudo; GARCOM/CAIXA veem só o setor deles via query)
router.get('/', auth(['ADMIN', 'GERENTE', 'GARCOM']), async (req, res) => {
  try {
    const { setor } = req.query;
    const where = { ativo: true };
    if (setor) where.setor = setor;

    const insumos = await prisma.insumo.findMany({
      where,
      include: { movimentacoes: { orderBy: { criadoEm: 'desc' }, take: 5 } },
      orderBy: [{ setor: 'asc' }, { nome: 'asc' }],
    });
    res.json(insumos);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Lista de compras — itens com quantidade <= minimo
router.get('/lista-compras', auth(['ADMIN', 'GERENTE', 'GARCOM']), async (req, res) => {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { ativo: true },
      orderBy: [{ setor: 'asc' }, { nome: 'asc' }],
    });

    const lista = insumos
      .filter((i) => i.quantidade <= i.minimo)
      .map((i) => ({
        id: i.id,
        nome: i.nome,
        unidade: i.unidade,
        setor: i.setor,
        quantidade: i.quantidade,
        minimo: i.minimo,
        precisaComprar: Math.max(0, i.minimo - i.quantidade + i.minimo),
      }))
      .sort((a, b) => {
        const deficitA = a.minimo - a.quantidade;
        const deficitB = b.minimo - b.quantidade;
        return deficitB - deficitA;
      });

    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Criar insumo
router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, unidade = 'un', quantidade = 0, minimo = 0, setor = 'GERAL' } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
    const insumo = await prisma.insumo.create({
      data: { nome, unidade, quantidade, minimo, setor },
      include: { movimentacoes: true },
    });
    res.status(201).json(insumo);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Atualizar insumo
router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, unidade, minimo, setor } = req.body;
    const insumo = await prisma.insumo.update({
      where: { id: req.params.id },
      data: { nome, unidade, minimo, setor },
      include: { movimentacoes: { orderBy: { criadoEm: 'desc' }, take: 5 } },
    });
    res.json(insumo);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Desativar insumo
router.delete('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    await prisma.insumo.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Registrar movimentação de estoque (entrada/saída/ajuste)
router.post('/:id/movimentacao', auth(['ADMIN', 'GERENTE', 'GARCOM']), async (req, res) => {
  try {
    const { tipo, quantidade, motivo } = req.body;
    if (!tipo || !quantidade) return res.status(400).json({ erro: 'tipo e quantidade são obrigatórios' });

    const insumo = await prisma.insumo.findUnique({ where: { id: req.params.id } });
    if (!insumo) return res.status(404).json({ erro: 'Insumo não encontrado' });

    let novaQtd = insumo.quantidade;
    if (tipo === 'ENTRADA') novaQtd += Number(quantidade);
    else if (tipo === 'SAIDA') novaQtd -= Number(quantidade);
    else novaQtd = Number(quantidade);

    const [mov, insumoAtualizado] = await prisma.$transaction([
      prisma.movimentacaoInsumo.create({
        data: { insumoId: insumo.id, tipo, quantidade: Number(quantidade), motivo: motivo || null },
      }),
      prisma.insumo.update({
        where: { id: insumo.id },
        data: { quantidade: novaQtd },
        include: { movimentacoes: { orderBy: { criadoEm: 'desc' }, take: 5 } },
      }),
    ]);

    res.status(201).json({ movimentacao: mov, insumo: insumoAtualizado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
