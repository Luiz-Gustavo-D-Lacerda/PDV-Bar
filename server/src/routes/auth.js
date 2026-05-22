const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

router.post('/login', async (req, res) => {
  try {
    const { email, senha, garcomId } = req.body;
    if (!senha) return res.status(400).json({ erro: 'Senha obrigatória' });

    let user;
    if (garcomId) {
      user = await prisma.user.findUnique({ where: { id: garcomId } });
    } else {
      if (!email) return res.status(400).json({ erro: 'Email obrigatório' });
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user || !user.ativo) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ erro: 'Senha incorreta' });

    const permissoes = user.permissoes || {};

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role, permissoes },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role, permissoes },
    });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
