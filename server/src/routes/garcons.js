const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Lista pública para tela de login (só id, nome, role — sem dados sensíveis)
router.get('/lista', async (_req, res) => {
  try {
    const garcons = await prisma.user.findMany({
      where: { role: 'GARCOM', ativo: true },
      select: { id: true, nome: true, role: true },
      orderBy: { nome: 'asc' },
    });
    res.json(garcons);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Listar garçons
router.get('/', auth(['ADMIN', 'GERENTE']), async (_req, res) => {
  try {
    const garcons = await prisma.user.findMany({
      where: { role: 'GARCOM' },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, email: true, role: true, ativo: true, permissoes: true, criadoEm: true },
    });
    res.json(garcons);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Relatório individual ou geral
router.get('/relatorio', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { de, ate } = req.query;
    const dataInicio = de   ? new Date(de)  : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const dataFim    = ate  ? new Date(ate) : new Date();

    const garcons = await prisma.user.findMany({
      where: { role: 'GARCOM' },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, email: true, role: true, ativo: true },
    });

    const relatorio = await Promise.all(garcons.map(async (g) => {
      const pedidos = await prisma.pedido.findMany({
        where: {
          garcomId: g.id,
          criadoEm: { gte: dataInicio, lte: dataFim },
          status: { not: 'CANCELADO' },
        },
        include: {
          subPedidos: { include: { itens: true } },
          comanda: { include: { mesa: true } },
        },
      });

      let totalVendido = 0;
      const mesasAtendidas = new Set();

      for (const p of pedidos) {
        mesasAtendidas.add(p.comanda?.mesa?.numero);
        for (const sub of p.subPedidos) {
          for (const item of sub.itens) {
            totalVendido += Number(item.precoUnitario) * item.quantidade;
          }
        }
      }

      const ticketMedio = pedidos.length > 0 ? totalVendido / pedidos.length : 0;

      return {
        garcom: g,
        totalPedidos: pedidos.length,
        totalVendido,
        ticketMedio,
        mesasAtendidas: mesasAtendidas.size,
      };
    }));

    // Ordena por total vendido
    relatorio.sort((a, b) => b.totalVendido - a.totalVendido);

    res.json(relatorio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Ranking de um produto/combo específico (para promoções)
router.get('/ranking-produto', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { produtoId, de, ate } = req.query;
    if (!produtoId) return res.status(400).json({ erro: 'produtoId é obrigatório' });

    const dataInicio = de  ? new Date(de)  : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const dataFim    = ate ? new Date(ate) : new Date();

    const garcons = await prisma.user.findMany({
      where: { role: 'GARCOM' },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, role: true, ativo: true },
    });

    const ranking = await Promise.all(garcons.map(async (g) => {
      const itens = await prisma.itemSubPedido.findMany({
        where: {
          produtoId,
          subPedido: {
            status: { not: 'CANCELADO' },
            pedido: {
              garcomId: g.id,
              status: { not: 'CANCELADO' },
              criadoEm: { gte: dataInicio, lte: dataFim },
            },
          },
        },
      });
      const quantidade = itens.reduce((s, i) => s + i.quantidade, 0);
      const total      = itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0);
      return { garcom: g, quantidade, total };
    }));

    ranking.sort((a, b) => b.quantidade - a.quantidade);
    res.json(ranking);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Criar garçom
router.post('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, email, senha, role = 'GARCOM', permissoes = {} } = req.body;
    if (!nome || !senha) return res.status(400).json({ erro: 'Nome e senha são obrigatórios' });
    const hash = await bcrypt.hash(senha, 10);
    const user = await prisma.user.create({
      data: { nome, email: email || null, senha: hash, role, permissoes },
      select: { id: true, nome: true, email: true, role: true, ativo: true, permissoes: true, criadoEm: true },
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ erro: 'Email já cadastrado' });
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Atualizar garçom
router.put('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { nome, email, senha, role, ativo, permissoes } = req.body;
    const data = { nome, email: email || null, role, ativo };
    if (senha) data.senha = await bcrypt.hash(senha, 10);
    if (permissoes !== undefined) data.permissoes = permissoes;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, nome: true, email: true, role: true, ativo: true, permissoes: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Reativar garçom
router.patch('/:id/ativar', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { ativo: true } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// Desativar garçom
router.delete('/:id', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
