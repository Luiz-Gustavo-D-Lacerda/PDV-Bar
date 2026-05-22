const jwt = require('jsonwebtoken');

function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ erro: 'Sem permissão' });
      }
      next();
    } catch {
      res.status(401).json({ erro: 'Token inválido' });
    }
  };
}

module.exports = auth;
