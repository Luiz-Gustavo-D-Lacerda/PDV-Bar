export const CFG_DEFAULTS = {
  nomeBar: 'PDV Bar',
  logoUrl: '',
  accentColor: '#16a34a',
  boasVindas: '',
  headerBgTipo: 'gradient',
  headerBgCor1: '#166534',
  headerBgCor2: '#059669',
  headerBgImagem: '',
  especialTitulo: 'Especial do Dia',
  especialSubtitulo: 'Novidade',
  especialBgTipo: 'gradient',
  especialBgCor1: '#f59e0b',
  especialBgCor2: '#f97316',
  especialBgImagem: '',
  bannerAtivo: false,
  bannerTexto: '',
  bannerCor: '#1d4ed8',
  mensagemAgradecimento: 'Obrigado pela visita. Volte sempre! 🙌',
  wifiNome: '',
  wifiSenha: '',
  instagram: '',
  whatsapp: '',
  horario: '',
  modoDark: false,
  layoutProdutos: 'lista',
  fonte: 'padrao',
  couvertTexto: '',
  estoqueAlerta: true,
  textoEsgotado: 'Esgotado',
  ocultarPrecos: false,
};

export function headerStyle(cfg) {
  const c = { ...CFG_DEFAULTS, ...cfg };
  if (c.headerBgTipo === 'imagem' && c.headerBgImagem)
    return { backgroundImage: `url(${c.headerBgImagem})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  if (c.headerBgTipo === 'cor')
    return { background: c.headerBgCor1 };
  return { background: `linear-gradient(135deg, ${c.headerBgCor1} 0%, ${c.headerBgCor2} 100%)` };
}

export function especialStyle(cfg) {
  const c = { ...CFG_DEFAULTS, ...cfg };
  if (c.especialBgTipo === 'imagem' && c.especialBgImagem)
    return { backgroundImage: `url(${c.especialBgImagem})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  if (c.especialBgTipo === 'cor')
    return { background: c.especialBgCor1 };
  return { background: `linear-gradient(135deg, ${c.especialBgCor1} 0%, ${c.especialBgCor2} 100%)` };
}

export const accentBg  = (cfg) => ({ backgroundColor: cfg?.accentColor || CFG_DEFAULTS.accentColor });
export const accentText = (cfg) => ({ color: cfg?.accentColor || CFG_DEFAULTS.accentColor });
export const accentBorder = (cfg) => ({ borderColor: cfg?.accentColor || CFG_DEFAULTS.accentColor });
