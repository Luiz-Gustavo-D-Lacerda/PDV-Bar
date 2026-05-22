const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const DEFAULTS = {
  // Identidade
  nomeBar: 'PDV Bar',
  logoUrl: '',
  accentColor: '#16a34a',
  boasVindas: '',
  // Header
  headerBgTipo: 'gradient',
  headerBgCor1: '#166534',
  headerBgCor2: '#059669',
  headerBgImagem: '',
  // Especial do Dia
  especialTitulo: 'Especial do Dia',
  especialSubtitulo: 'Novidade',
  especialBgTipo: 'gradient',
  especialBgCor1: '#f59e0b',
  especialBgCor2: '#f97316',
  especialBgImagem: '',
  // Banner do dia
  bannerAtivo: false,
  bannerTexto: '',
  bannerCor: '#1d4ed8',
  // Textos
  mensagemAgradecimento: 'Obrigado pela visita. Volte sempre! 🙌',
  // Informações
  wifiNome: '',
  wifiSenha: '',
  instagram: '',
  whatsapp: '',
  horario: '',
  // Visual do cardápio
  modoDark: false,
  layoutProdutos: 'lista',
  fonte: 'padrao',
  couvertTexto: '',
  estoqueAlerta: true,
  textoEsgotado: 'Esgotado',
  ocultarPrecos: false,
};

router.get('/', async (_req, res) => {
  try {
    const cfg = await prisma.configuracoes.findUnique({ where: { id: 'singleton' } });
    res.json({ ...DEFAULTS, ...(cfg?.dados || {}) });
  } catch {
    res.json(DEFAULTS);
  }
});

router.put('/', auth(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const dados = req.body;
    const cfg = await prisma.configuracoes.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', dados },
      update: { dados },
    });
    res.json({ ...DEFAULTS, ...(cfg.dados || {}) });
  } catch {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
