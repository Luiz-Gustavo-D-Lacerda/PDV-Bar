import { useEffect, useState, useRef } from 'react';
import { Loader2, Save, Upload, RotateCcw, Palette, Image, Minus, Wifi, Instagram, MessageCircle, Clock, Megaphone, Heart, Moon, LayoutGrid, AlignJustify, Type, EyeOff, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { CFG_DEFAULTS, headerStyle, especialStyle } from '../../lib/aparencia';

/* ─── Constantes ──────────────────────────────────────────────── */

const GRADIENTES_HEADER = [
  { label: 'Verde (padrão)', cor1: '#166534', cor2: '#059669' },
  { label: 'Azul escuro',    cor1: '#1e3a5f', cor2: '#1d4ed8' },
  { label: 'Roxo',           cor1: '#4c1d95', cor2: '#7c3aed' },
  { label: 'Vermelho',       cor1: '#7f1d1d', cor2: '#dc2626' },
  { label: 'Cinza escuro',   cor1: '#111827', cor2: '#374151' },
  { label: 'Marrom',         cor1: '#451a03', cor2: '#92400e' },
];

const GRADIENTES_ESPECIAL = [
  { label: 'Âmbar (padrão)', cor1: '#f59e0b', cor2: '#f97316' },
  { label: 'Rosa/Vermelho',  cor1: '#db2777', cor2: '#ef4444' },
  { label: 'Azul',           cor1: '#1d4ed8', cor2: '#06b6d4' },
  { label: 'Verde',          cor1: '#059669', cor2: '#10b981' },
  { label: 'Roxo/Rosa',      cor1: '#7c3aed', cor2: '#db2777' },
  { label: 'Preto/Cinza',    cor1: '#1f2937', cor2: '#4b5563' },
];

const ACCENT_PRONTOS = [
  { label: 'Verde',   cor: '#16a34a' },
  { label: 'Azul',    cor: '#2563eb' },
  { label: 'Roxo',    cor: '#7c3aed' },
  { label: 'Laranja', cor: '#ea580c' },
  { label: 'Rosa',    cor: '#db2777' },
  { label: 'Âmbar',   cor: '#d97706' },
];

const BANNER_CORES = [
  { label: 'Azul',    cor: '#1d4ed8' },
  { label: 'Verde',   cor: '#15803d' },
  { label: 'Roxo',    cor: '#7c3aed' },
  { label: 'Vermelho',cor: '#dc2626' },
  { label: 'Âmbar',   cor: '#d97706' },
  { label: 'Preto',   cor: '#1f2937' },
];

const FONTES = [
  { key: 'padrao',      label: 'Padrão',          css: '',                    desc: 'Fonte do sistema' },
  { key: 'nunito',      label: 'Nunito',           css: 'Nunito',              desc: 'Arredondada e amigável' },
  { key: 'roboto-slab', label: 'Roboto Slab',      css: 'Roboto Slab',         desc: 'Serifada moderna' },
  { key: 'playfair',    label: 'Playfair Display', css: 'Playfair Display',    desc: 'Elegante e sofisticada' },
];

const FONT_URLS = {
  'nunito':      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap',
  'roboto-slab': 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700;900&display=swap',
  'playfair':    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&display=swap',
};

/* ─── Componentes auxiliares ──────────────────────────────────── */

function ImageUploadBtn({ value, onChange, label = 'Upload de imagem', preview = true }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('imagem', file);
      const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
      toast.success('Imagem carregada');
    } catch {
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Enviando...' : label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
            Remover
          </button>
        )}
      </div>
      {preview && value && <img src={value} alt="" className="h-16 rounded-lg object-cover border border-gray-200" />}
      <input value={value || ''} onChange={(e) => onChange(e.target.value)}
        placeholder="Ou cole a URL da imagem..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-300" />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function GradientePicker({ cor1Key, cor2Key, cfg, onChange, opcoes }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Gradientes prontos</p>
        <div className="grid grid-cols-6 gap-2">
          {opcoes.map(({ label, cor1, cor2 }) => (
            <button key={label} onClick={() => { onChange(cor1Key, cor1); onChange(cor2Key, cor2); }}
              className={`h-8 rounded-lg border-2 transition-all ${cfg[cor1Key] === cor1 && cfg[cor2Key] === cor2 ? 'border-white ring-2 ring-green-500' : 'border-transparent hover:border-white/50'}`}
              style={{ background: `linear-gradient(135deg,${cor1},${cor2})` }} title={label} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[['Cor inicial', cor1Key], ['Cor final', cor2Key]].map(([lbl, key]) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600">{lbl}</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={cfg[key] || '#000000'} onChange={(e) => onChange(key, e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0" />
              <input value={cfg[key] || ''} onChange={(e) => onChange(key, e.target.value)}
                className="flex-1 px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BgPicker({ tipoKey, cor1Key, cor2Key, imagemKey, cfg, onChange, opcoes }) {
  const tipo = cfg[tipoKey] || 'gradient';
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{ key: 'gradient', icon: Palette, label: 'Gradiente' }, { key: 'cor', icon: Minus, label: 'Cor sólida' }, { key: 'imagem', icon: Image, label: 'Imagem' }].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => onChange(tipoKey, key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${tipo === key ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      {tipo === 'gradient' && <GradientePicker cor1Key={cor1Key} cor2Key={cor2Key} cfg={cfg} onChange={onChange} opcoes={opcoes} />}
      {tipo === 'cor' && (
        <div>
          <label className="text-xs font-medium text-gray-600">Cor</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={cfg[cor1Key] || '#166534'} onChange={(e) => onChange(cor1Key, e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0" />
            <input value={cfg[cor1Key] || ''} onChange={(e) => onChange(cor1Key, e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
      )}
      {tipo === 'imagem' && (
        <ImageUploadBtn value={cfg[imagemKey] || ''} onChange={(url) => onChange(imagemKey, url)} label="Upload de imagem de fundo" />
      )}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );
}

/* ─── Preview ─────────────────────────────────────────────────── */

function Preview({ cfg }) {
  const accent = cfg.accentColor || '#16a34a';
  const dark = !!cfg.modoDark;
  const fontName = FONTES.find((f) => f.key === cfg.fonte && f.css)?.css;
  const fontStyle = fontName ? { fontFamily: `'${fontName}', sans-serif` } : {};

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pré-visualização</p>
        <p className="text-xs text-gray-400">Tempo real</p>
      </div>
      <div className="overflow-hidden" style={{ fontSize: '0.6rem', ...(dark ? { background: '#111827' } : {}), ...fontStyle }}>

        {/* Banner */}
        {cfg.bannerAtivo && cfg.bannerTexto && (
          <div style={{ background: cfg.bannerCor || '#1d4ed8', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>📢</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.65rem' }}>{cfg.bannerTexto}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ ...headerStyle(cfg), padding: '16px 14px 12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {cfg.logoUrl
                ? <img src={cfg.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 14 }}>🍺</span>}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.8rem' }}>{cfg.nomeBar || 'PDV Bar'}</div>
              {cfg.boasVindas && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.55rem', marginTop: 1 }}>{cfg.boasVindas}</div>}
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.55rem' }}>Mesa 1</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '4px 8px', opacity: 0.9 }}>
            <span style={{ color: '#9ca3af', fontSize: '0.6rem' }}>🔍 Buscar no cardápio...</span>
          </div>
        </div>

        {/* Especial */}
        <div style={{ ...especialStyle(cfg), padding: '10px 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>🌟</span>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>{cfg.especialSubtitulo || 'Novidade'}</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>{cfg.especialTitulo || 'Especial do Dia'}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🍽️</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.65rem' }}>Prato Especial</div>
              {!cfg.ocultarPrecos && <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 900, fontSize: '0.7rem', marginTop: 2 }}>R$ 35,00</div>}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <div style={{ background: 'white', color: accent, fontWeight: 700, fontSize: '0.6rem', padding: '3px 8px', borderRadius: 8 }}>+ Pedir</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: dark ? '#1f2937' : 'white', padding: '6px 10px', display: 'flex', gap: 5, borderBottom: `1px solid ${dark ? '#374151' : '#f3f4f6'}` }}>
          {['Bebidas', 'Petiscos', 'Pratos'].map((t, i) => (
            <div key={t} style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.6rem', fontWeight: 600, background: i === 0 ? accent : (dark ? '#374151' : '#f3f4f6'), color: i === 0 ? 'white' : (dark ? '#d1d5db' : '#6b7280') }}>{t}</div>
          ))}
        </div>

        {/* Produto (layout grade/lista) */}
        <div style={{ background: dark ? '#111827' : '#f9fafb', padding: '8px 10px' }}>
          {cfg.layoutProdutos === 'grade' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Cerveja Gelada', 'Caipirinha'].map((nome) => (
                <div key={nome} style={{ background: dark ? '#1f2937' : 'white', borderRadius: 10, border: `1px solid ${dark ? '#374151' : '#f3f4f6'}`, overflow: 'hidden' }}>
                  <div style={{ height: 40, background: dark ? '#374151' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍺</div>
                  <div style={{ padding: '5px 6px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: dark ? '#f9fafb' : '#111', lineHeight: 1.2 }}>{nome}</div>
                    {!cfg.ocultarPrecos && <div style={{ fontSize: '0.62rem', fontWeight: 700, color: accent, marginTop: 2 }}>R$ 12,00</div>}
                    <div style={{ background: accent, color: 'white', fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6, marginTop: 4, textAlign: 'center' }}>+ Pedir</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: dark ? '#1f2937' : 'white', borderRadius: 10, padding: '8px', display: 'flex', gap: 8, border: `1px solid ${dark ? '#374151' : '#f3f4f6'}` }}>
              <div style={{ width: 36, height: 36, background: dark ? '#374151' : '#e5e7eb', borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: dark ? '#f9fafb' : '#111' }}>Cerveja Gelada</div>
                <div style={{ fontSize: '0.55rem', color: '#9ca3af', marginTop: 1 }}>600ml bem gelada</div>
                {!cfg.ocultarPrecos && <div style={{ fontSize: '0.68rem', fontWeight: 700, color: accent, marginTop: 3 }}>R$ 12,00</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ background: accent, color: 'white', width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>+</div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé informações */}
        {(cfg.wifiNome || cfg.instagram || cfg.whatsapp || cfg.horario) && (
          <div style={{ background: dark ? '#1f2937' : '#f9fafb', borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`, padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cfg.wifiNome && <div style={{ fontSize: '0.55rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>📶 {cfg.wifiNome}{cfg.wifiSenha ? ` · ${cfg.wifiSenha}` : ''}</div>}
            {cfg.instagram && <div style={{ fontSize: '0.55rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>📸 {cfg.instagram}</div>}
            {cfg.whatsapp && <div style={{ fontSize: '0.55rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>💬 {cfg.whatsapp}</div>}
            {cfg.horario && <div style={{ fontSize: '0.55rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>🕐 {cfg.horario}</div>}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Página principal ────────────────────────────────────────── */

export default function AparenciaPage() {
  const [cfg, setCfg] = useState(CFG_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get('/configuracoes')
      .then(({ data }) => setCfg({ ...CFG_DEFAULTS, ...data }))
      .catch(() => toast.error('Erro ao carregar configurações — usando valores padrão'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fonte = cfg.fonte;
    if (!fonte || fonte === 'padrao') return;
    const url = FONT_URLS[fonte];
    if (!url) return;
    let link = document.getElementById('preview-custom-font');
    if (!link) {
      link = document.createElement('link');
      link.id = 'preview-custom-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [cfg.fonte]);

  function set(key, value) { setCfg((prev) => ({ ...prev, [key]: value })); }

  async function salvar() {
    setSalvando(true);
    try {
      await api.put('/configuracoes', cfg);
      toast.success('Aparência salva!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  function resetar() {
    if (!confirm('Restaurar configurações padrão?')) return;
    setCfg(CFG_DEFAULTS);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6">
      {/* Topo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aparência</h1>
          <p className="text-gray-500 text-sm">Personalize o cardápio do jeito que quiser</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetar} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RotateCcw size={14} /> Padrão
          </button>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Configurações ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 1. Identidade */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Identidade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-gray-600">Nome do bar / estabelecimento</label>
                <input value={cfg.nomeBar || ''} onChange={(e) => set('nomeBar', e.target.value)}
                  placeholder="Ex: Bar do João"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-gray-600">Mensagem de boas-vindas</label>
                <input value={cfg.boasVindas || ''} onChange={(e) => set('boasVindas', e.target.value)}
                  placeholder="Ex: Bem-vindo! Boa diversão 🍻"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Logo do bar</label>
              <ImageUploadBtn value={cfg.logoUrl || ''} onChange={(url) => set('logoUrl', url)} label="Upload do logo" />
              <p className="text-xs text-gray-400 mt-1">Substitui o 🍺 no cabeçalho. Use imagem quadrada ou com fundo transparente (PNG).</p>
            </div>
          </div>

          {/* 2. Cor de destaque */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Cor de destaque</h3>
              <p className="text-xs text-gray-400 mt-0.5">Aplicada em preços, botões e abas do cardápio</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Cores prontas</p>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_PRONTOS.map(({ label, cor }) => (
                  <button key={cor} onClick={() => set('accentColor', cor)} title={label}
                    className={`w-9 h-9 rounded-xl border-4 transition-all ${cfg.accentColor === cor ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'}`}
                    style={{ background: cor }} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Cor personalizada</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={cfg.accentColor || '#16a34a'} onChange={(e) => set('accentColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0" />
                <input value={cfg.accentColor || ''} onChange={(e) => set('accentColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* 3. Banner do dia */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Megaphone size={16} className="text-blue-500" /> Banner do dia</h3>
                <p className="text-xs text-gray-400 mt-0.5">Faixa de aviso no topo do cardápio — happy hour, promoções, avisos</p>
              </div>
              <Toggle checked={cfg.bannerAtivo} onChange={(v) => set('bannerAtivo', v)} />
            </div>
            {cfg.bannerAtivo && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600">Texto do banner</label>
                  <input value={cfg.bannerTexto || ''} onChange={(e) => set('bannerTexto', e.target.value)}
                    placeholder="Ex: 🍺 Happy Hour das 18h às 20h — 50% off em todas as cervejas!"
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Cor do banner</p>
                  <div className="flex gap-2 flex-wrap">
                    {BANNER_CORES.map(({ label, cor }) => (
                      <button key={cor} onClick={() => set('bannerCor', cor)} title={label}
                        className={`w-8 h-8 rounded-lg border-4 transition-all ${cfg.bannerCor === cor ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'}`}
                        style={{ background: cor }} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 4. Cabeçalho */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Cabeçalho do Cardápio</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fundo da barra superior com o nome do bar</p>
            </div>
            <BgPicker tipoKey="headerBgTipo" cor1Key="headerBgCor1" cor2Key="headerBgCor2" imagemKey="headerBgImagem"
              cfg={cfg} onChange={set} opcoes={GRADIENTES_HEADER} />
          </div>

          {/* 5. Especial do dia */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Seção "Especial do Dia"</h3>
              <p className="text-xs text-gray-400 mt-0.5">Bloco colorido antes das categorias</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Título</label>
                <input value={cfg.especialTitulo || ''} onChange={(e) => set('especialTitulo', e.target.value)}
                  placeholder="Especial do Dia"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Subtítulo</label>
                <input value={cfg.especialSubtitulo || ''} onChange={(e) => set('especialSubtitulo', e.target.value)}
                  placeholder="Novidade"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <BgPicker tipoKey="especialBgTipo" cor1Key="especialBgCor1" cor2Key="especialBgCor2" imagemKey="especialBgImagem"
              cfg={cfg} onChange={set} opcoes={GRADIENTES_ESPECIAL} />
          </div>

          {/* 6. Textos */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Heart size={16} className="text-red-400" /> Textos personalizados</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Mensagem de agradecimento (após pagamento)</label>
              <input value={cfg.mensagemAgradecimento || ''} onChange={(e) => set('mensagemAgradecimento', e.target.value)}
                placeholder="Obrigado pela visita. Volte sempre! 🙌"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="text-xs text-gray-400 mt-1">Aparece na comanda quando o pagamento é confirmado.</p>
            </div>
          </div>

          {/* 7. Informações do bar */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Informações do bar</h3>
              <p className="text-xs text-gray-400 mt-0.5">Exibidas no rodapé do cardápio</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Wifi size={11} /> Nome da rede Wi-Fi</label>
                <input value={cfg.wifiNome || ''} onChange={(e) => set('wifiNome', e.target.value)}
                  placeholder="Ex: BarDoJoao_WiFi"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Senha do Wi-Fi</label>
                <input value={cfg.wifiSenha || ''} onChange={(e) => set('wifiSenha', e.target.value)}
                  placeholder="Ex: cerveja123"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Instagram size={11} /> Instagram</label>
                <input value={cfg.instagram || ''} onChange={(e) => set('instagram', e.target.value)}
                  placeholder="@bardojoo"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><MessageCircle size={11} /> WhatsApp</label>
                <input value={cfg.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1"><Clock size={11} /> Horário de funcionamento</label>
                <input value={cfg.horario || ''} onChange={(e) => set('horario', e.target.value)}
                  placeholder="Ex: Seg a Sex: 17h–00h · Sáb e Dom: 12h–02h"
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* 8. Visual do Cardápio */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900">Visual do Cardápio</h3>
              <p className="text-xs text-gray-400 mt-0.5">Experiência de navegação para o cliente</p>
            </div>

            {/* Modo escuro */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Moon size={16} className="text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Modo escuro</p>
                  <p className="text-xs text-gray-400">Fundo escuro para o cardápio</p>
                </div>
              </div>
              <Toggle checked={cfg.modoDark} onChange={(v) => set('modoDark', v)} />
            </div>

            {/* Layout dos produtos */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-2">
                <LayoutGrid size={13} /> Layout dos produtos
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'lista', icon: AlignJustify, label: 'Lista', desc: 'Imagem à esquerda' },
                  { key: 'grade', icon: LayoutGrid, label: 'Grade', desc: '2 colunas' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <button key={key} onClick={() => set('layoutProdutos', key)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${cfg.layoutProdutos === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Icon size={20} />
                    <span>{label}</span>
                    <span className="text-xs font-normal opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fonte */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-2">
                <Type size={13} /> Fonte
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FONTES.map(({ key, label, css, desc }) => (
                  <button key={key} onClick={() => set('fonte', key)}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${cfg.fonte === key ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm font-semibold text-gray-800" style={css ? { fontFamily: `'${css}', sans-serif` } : {}}>{label}</span>
                    <span className="text-xs text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso de couvert */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1">
                🍽️ Aviso de couvert / taxa de serviço
              </label>
              <input value={cfg.couvertTexto || ''} onChange={(e) => set('couvertTexto', e.target.value)}
                placeholder="Ex: Couvert artístico: R$ 10,00 por pessoa"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="text-xs text-gray-400 mt-1">Aparece abaixo das abas de categoria. Deixe em branco para ocultar.</p>
            </div>

            {/* Aviso de estoque baixo */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Aviso "Últimas unidades!"</p>
                  <p className="text-xs text-gray-400">Exibe alerta quando estoque estiver baixo</p>
                </div>
              </div>
              <Toggle checked={cfg.estoqueAlerta} onChange={(v) => set('estoqueAlerta', v)} />
            </div>

            {/* Texto esgotado */}
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1">
                Texto do item esgotado
              </label>
              <input value={cfg.textoEsgotado || ''} onChange={(e) => set('textoEsgotado', e.target.value)}
                placeholder="Esgotado"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="text-xs text-gray-400 mt-1">Exibido no lugar do botão de pedir quando o produto está sem estoque.</p>
            </div>

            {/* Ocultar preços */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <EyeOff size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Ocultar preços</p>
                  <p className="text-xs text-gray-400">Esconde valores no cardápio público</p>
                </div>
              </div>
              <Toggle checked={cfg.ocultarPrecos} onChange={(v) => set('ocultarPrecos', v)} />
            </div>
          </div>

        </div>

        {/* ── Preview ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Preview cfg={cfg} />
            <p className="text-xs text-gray-400 text-center mt-2">Atualiza em tempo real</p>
            <button onClick={salvar} disabled={salvando}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar aparência
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
