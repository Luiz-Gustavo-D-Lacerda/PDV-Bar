import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X, ChevronRight, Loader2, ArrowLeft, ClipboardList, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/auth';
import { CFG_DEFAULTS, headerStyle, especialStyle, accentBg, accentText } from '../lib/aparencia';

const CAT_EMOJI = {
  'Bebidas': '🍺',
  'Petiscos': '🍟',
  'Pratos Principais': '🍽️',
  'Sobremesas': '🍰',
};

const FONT_NAMES = {
  'roboto-slab': 'Roboto Slab',
  'playfair': 'Playfair Display',
  'nunito': 'Nunito',
};

const FONT_URLS = {
  'roboto-slab': 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700;900&display=swap',
  'playfair': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&display=swap',
  'nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap',
};

function fmt(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}

export default function CardapioPage() {
  const { mesaId, comandaId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [categorias, setCategorias] = useState([]);
  const [mesa, setMesa] = useState(null);
  const [cfg, setCfg] = useState(CFG_DEFAULTS);
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [obs, setObs] = useState({});
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [catAtiva, setCatAtiva] = useState(null);
  const catRefs = useRef({});
  const tabsRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [cardRes, mesaRes, cfgRes] = await Promise.all([
          api.get('/cardapio'),
          api.get(`/mesas/${mesaId}`),
          api.get('/configuracoes'),
        ]);
        setCategorias(cardRes.data);
        if (cardRes.data.length) setCatAtiva(cardRes.data[0].id);
        setMesa(mesaRes.data);
        setCfg({ ...CFG_DEFAULTS, ...cfgRes.data });
      } catch {
        toast.error('Erro ao carregar cardápio');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mesaId]);

  useEffect(() => {
    const fonte = cfg.fonte;
    if (!fonte || fonte === 'padrao') {
      document.getElementById('pdv-custom-font')?.remove();
      return;
    }
    const url = FONT_URLS[fonte];
    if (!url) return;
    let link = document.getElementById('pdv-custom-font');
    if (!link) {
      link = document.createElement('link');
      link.id = 'pdv-custom-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [cfg.fonte]);

  function addItem(produto) {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.produtoId === produto.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + 1 };
        return next;
      }
      return [...prev, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        imagemUrl: produto.imagemUrl,
        quantidade: 1,
      }];
    });
  }

  function removeItem(produtoId) {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.produtoId === produtoId);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].quantidade > 1) {
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade - 1 };
        return next;
      }
      return prev.filter((i) => i.produtoId !== produtoId);
    });
  }

  function qtdItem(produtoId) {
    return carrinho.find((i) => i.produtoId === produtoId)?.quantidade || 0;
  }

  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = carrinho.reduce((s, i) => s + Number(i.preco) * i.quantidade, 0);

  async function enviarPedido() {
    if (carrinho.length === 0) return;
    setEnviando(true);
    try {
      const itens = carrinho.map((i) => ({
        produtoId: i.produtoId,
        quantidade: i.quantidade,
        observacao: obs[i.produtoId] || undefined,
      }));
      await api.post(`/comandas/${comandaId}/pedido`, { itens });
      toast.success('Pedido enviado! 🎉');
      setCarrinho([]);
      setObs({});
      setCarrinhoAberto(false);
      navigate(`/mesa/${mesaId}/comanda/${comandaId}`);
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao enviar pedido');
    } finally {
      setEnviando(false);
    }
  }

  const dark = !!cfg.modoDark;
  const fontFamily = FONT_NAMES[cfg.fonte] ? { fontFamily: `'${FONT_NAMES[cfg.fonte]}', sans-serif` } : {};
  const textoEsgotado = cfg.textoEsgotado || 'Esgotado';

  const d = {
    page:         dark ? { background: '#111827' } : {},
    card:         dark ? { background: '#1f2937', borderColor: '#374151' } : {},
    tabs:         dark ? { background: '#1f2937', borderColor: '#374151' } : {},
    section:      dark ? { background: '#111827' } : {},
    footer:       dark ? { background: '#1f2937', borderColor: '#374151' } : { background: 'white', borderColor: '#f3f4f6' },
    textMain:     dark ? { color: '#f9fafb' } : {},
    textSub:      dark ? { color: '#9ca3af' } : { color: '#9ca3af' },
    inactiveTab:  dark ? { background: '#374151', color: '#d1d5db' } : { background: '#f3f4f6', color: '#4b5563' },
    drawerBg:     dark ? { background: '#1f2937' } : { background: 'white' },
    drawerBorder: dark ? { borderColor: '#374151' } : { borderColor: '#f3f4f6' },
    inputBg:      dark ? { background: '#374151', borderColor: '#4b5563', color: '#f9fafb' } : { borderColor: '#e5e7eb', color: '#374151' },
    imgPlaceholder: dark ? { background: 'linear-gradient(135deg,#374151,#4b5563)' } : { background: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)' },
    couvert:      dark ? { background: '#292524', borderColor: '#57534e', color: '#fde68a' } : { background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' },
  };

  const produtosDestaque = categorias.flatMap((cat) =>
    cat.produtos.filter((p) => p.destaque).map((p) => ({ ...p, _catNome: cat.nome }))
  );

  const categoriasFiltradas = busca.trim()
    ? categorias.map((cat) => ({
        ...cat,
        produtos: cat.produtos.filter((p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          (p.descricao || '').toLowerCase().includes(busca.toLowerCase())
        ),
      })).filter((cat) => cat.produtos.length > 0)
    : categorias;

  function scrollTabIntoView(catId) {
    const tab = tabsRef.current?.querySelector(`[data-cat="${catId}"]`);
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={d.page}>
        <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🍺</span>
        </div>
        <p className="text-sm text-gray-400">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...d.page, ...fontFamily }}>

      {/* ── Banner do dia ── */}
      {cfg.bannerAtivo && cfg.bannerTexto && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium" style={{ background: cfg.bannerCor || '#1d4ed8' }}>
          <span>📢</span>
          <span className="flex-1">{cfg.bannerTexto}</span>
        </div>
      )}

      {/* ── Hero Header ── */}
      <div className="relative text-white" style={headerStyle(cfg)}>
        {token && (
          <Link to={user?.role === 'ADMIN' || user?.role === 'GERENTE' ? '/admin' : '/garcom'}
            className="absolute top-3 left-4 flex items-center gap-1 text-white/70 text-xs hover:text-white">
            <ArrowLeft size={13} /> Painel
          </Link>
        )}
        <Link to={`/mesa/${mesaId}/comanda/${comandaId}`}
          className="absolute top-3 right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm transition">
          <ClipboardList size={13} /> Ver comanda
        </Link>

        <div className="px-5 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm overflow-hidden flex-shrink-0">
              {cfg.logoUrl
                ? <img src={cfg.logoUrl} alt="logo" className="w-full h-full object-cover" />
                : <span>🍺</span>}
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight">{cfg.nomeBar || 'PDV Bar'}</h1>
              {cfg.boasVindas && <p className="text-white/75 text-xs mt-0.5">{cfg.boasVindas}</p>}
              {mesa && <p className="text-white/60 text-xs">Mesa {mesa.numero}</p>}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm" />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Especial do Dia ── */}
      {!busca && produtosDestaque.length > 0 && (
        <div className="px-4 pt-5 pb-6" style={especialStyle(cfg)}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🌟</span>
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-none">{cfg.especialSubtitulo || 'Novidade'}</p>
              <h2 className="text-white font-black text-xl leading-tight">{cfg.especialTitulo || 'Especial do Dia'}</h2>
            </div>
          </div>
          <div className="space-y-3">
            {produtosDestaque.map((prod) => {
              const qty = qtdItem(prod.id);
              const esgotado = prod.estoque != null && prod.estoque.quantidade <= 0;
              const estoqueAlerta = cfg.estoqueAlerta && prod.estoque != null && prod.estoque.quantidade > 0 && prod.estoque.quantidade <= prod.estoque.minimo;
              return (
                <div key={prod.id}
                  className={`bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl overflow-hidden transition-all ${esgotado ? 'opacity-50' : 'active:scale-[0.99]'}`}>
                  <div className="flex gap-3 p-3">
                    <div className="flex-shrink-0">
                      {prod.imagemUrl ? (
                        <img src={prod.imagemUrl} alt={prod.nome} className="w-24 h-24 object-cover rounded-xl ring-2 ring-white/40" />
                      ) : (
                        <div className="w-24 h-24 bg-white/20 rounded-xl ring-2 ring-white/30 flex items-center justify-center text-4xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <p className="font-black text-white text-base leading-tight">{prod.nome}</p>
                        {prod.descricao && <p className="text-orange-100 text-xs mt-1 line-clamp-2 leading-relaxed opacity-90">{prod.descricao}</p>}
                        <p className="text-orange-200 text-[10px] mt-0.5 font-medium">{prod._catNome}</p>
                        {estoqueAlerta && (
                          <span className="inline-block mt-1 text-xs bg-yellow-400/30 text-yellow-100 px-2 py-0.5 rounded-full font-medium">⚡ Últimas unidades!</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {!cfg.ocultarPrecos && (
                          <p className="text-white font-black text-xl drop-shadow-sm">R$ {fmt(prod.preco)}</p>
                        )}
                        {esgotado ? (
                          <span className="text-xs bg-black/30 text-white px-2 py-0.5 rounded-full font-medium">{textoEsgotado}</span>
                        ) : qty > 0 ? (
                          <div className="flex items-center gap-2 bg-black/20 rounded-xl px-1 py-1">
                            <button onClick={() => removeItem(prod.id)} className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center font-black text-white text-sm">{qty}</span>
                            <button onClick={() => addItem(prod)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-orange-600 hover:bg-orange-50 transition shadow-sm">
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(prod)}
                            className="flex items-center gap-1.5 bg-white text-orange-600 font-bold text-sm px-3 py-2 rounded-xl hover:bg-orange-50 transition shadow-sm active:scale-95">
                            <Plus size={14} /> Pedir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category Tabs ── */}
      {!busca && (
        <div className="sticky top-0 z-20 border-b shadow-sm" style={d.tabs}>
          <div ref={tabsRef} className="flex overflow-x-auto scrollbar-hide px-3 py-2.5 gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => {
                  setCatAtiva(cat.id);
                  catRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  scrollTabIntoView(cat.id);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={catAtiva === cat.id ? { ...accentBg(cfg), color: 'white' } : d.inactiveTab}
              >
                <span>{CAT_EMOJI[cat.nome] || '🍴'}</span>
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Aviso de Couvert ── */}
      {!busca && cfg.couvertTexto && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium" style={d.couvert}>
          <span>🍽️</span>
          <span>{cfg.couvertTexto}</span>
        </div>
      )}

      {/* ── Produtos ── */}
      <div className="pb-32" style={d.section}>
        {categoriasFiltradas.length === 0 && (
          <div className="flex flex-col items-center py-20" style={d.textSub}>
            <Search size={40} className="mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
          </div>
        )}

        {categoriasFiltradas.map((cat) => (
          <section key={cat.id} ref={(el) => (catRefs.current[cat.id] = el)} className="scroll-mt-14">
            <div className="px-4 pt-5 pb-2 flex items-center gap-2">
              <span className="text-xl">{CAT_EMOJI[cat.nome] || '🍴'}</span>
              <h2 className="font-bold text-base" style={d.textMain}>{cat.nome}</h2>
              <span className="text-xs" style={d.textSub}>({cat.produtos.length})</span>
            </div>

            {cfg.layoutProdutos === 'grade' ? (
              /* ── Grade 2 colunas ── */
              <div className="px-3 grid grid-cols-2 gap-2">
                {cat.produtos.map((prod) => {
                  const qty = qtdItem(prod.id);
                  const esgotado = prod.estoque != null && prod.estoque.quantidade <= 0;
                  const estoqueAlerta = cfg.estoqueAlerta && prod.estoque != null && prod.estoque.quantidade > 0 && prod.estoque.quantidade <= prod.estoque.minimo;
                  return (
                    <div key={prod.id}
                      className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all ${esgotado ? 'opacity-55' : 'active:scale-[0.99]'}`}
                      style={d.card}>
                      {prod.imagemUrl ? (
                        <img src={prod.imagemUrl} alt={prod.nome} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center text-4xl" style={d.imgPlaceholder}>
                          {CAT_EMOJI[cat.nome] || '🍴'}
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="font-semibold text-sm leading-tight line-clamp-2" style={d.textMain}>{prod.nome}</p>
                        {estoqueAlerta && (
                          <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">⚡ Últimas unidades!</span>
                        )}
                        {esgotado ? (
                          <div className="mt-2">
                            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">{textoEsgotado}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            {!cfg.ocultarPrecos && (
                              <p className="font-bold text-sm" style={accentText(cfg)}>R$ {fmt(prod.preco)}</p>
                            )}
                            {qty > 0 ? (
                              <div className="flex items-center gap-1 rounded-xl px-0.5 py-0.5" style={{ background: (cfg.accentColor || '#16a34a') + '20' }}>
                                <button onClick={() => removeItem(prod.id)} className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center" style={accentText(cfg)}>
                                  <Minus size={11} />
                                </button>
                                <span className="w-4 text-center font-bold text-xs" style={accentText(cfg)}>{qty}</span>
                                <button onClick={() => addItem(prod)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm" style={accentBg(cfg)}>
                                  <Plus size={11} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => addItem(prod)}
                                className="flex items-center justify-center gap-1 text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-sm"
                                style={accentBg(cfg)}>
                                <Plus size={12} /> Pedir
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Lista ── */
              <div className="px-3 space-y-2">
                {cat.produtos.map((prod) => {
                  const qty = qtdItem(prod.id);
                  const esgotado = prod.estoque != null && prod.estoque.quantidade <= 0;
                  const estoqueAlerta = cfg.estoqueAlerta && prod.estoque != null && prod.estoque.quantidade > 0 && prod.estoque.quantidade <= prod.estoque.minimo;
                  return (
                    <div key={prod.id}
                      className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all ${esgotado ? 'opacity-55' : 'active:scale-[0.99]'}`}
                      style={d.card}>
                      <div className="flex gap-3 p-3">
                        <div className="flex-shrink-0">
                          {prod.imagemUrl ? (
                            <img src={prod.imagemUrl} alt={prod.nome} className="w-24 h-24 object-cover rounded-xl" />
                          ) : (
                            <div className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl" style={d.imgPlaceholder}>
                              {CAT_EMOJI[cat.nome] || '🍴'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm leading-tight" style={d.textMain}>{prod.nome}</p>
                              {esgotado && (
                                <span className="flex-shrink-0 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
                                  {textoEsgotado}
                                </span>
                              )}
                            </div>
                            {prod.descricao && (
                              <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={d.textSub}>{prod.descricao}</p>
                            )}
                            {estoqueAlerta && (
                              <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">⚡ Últimas unidades!</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            {!cfg.ocultarPrecos && (
                              <p className="font-bold text-base" style={accentText(cfg)}>R$ {fmt(prod.preco)}</p>
                            )}
                            {!esgotado && (
                              qty > 0 ? (
                                <div className="flex items-center gap-2 rounded-xl px-1 py-1" style={{ background: (cfg.accentColor || '#16a34a') + '15' }}>
                                  <button onClick={() => removeItem(prod.id)}
                                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center transition"
                                    style={accentText(cfg)}>
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-sm" style={accentText(cfg)}>{qty}</span>
                                  <button onClick={() => addItem(prod)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition shadow-sm"
                                    style={accentBg(cfg)}>
                                    <Plus size={13} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => addItem(prod)}
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition shadow-sm active:scale-95"
                                  style={accentBg(cfg)}>
                                  <Plus size={16} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ── Rodapé de informações ── */}
      {(cfg.wifiNome || cfg.instagram || cfg.whatsapp || cfg.horario) && (
        <div className="mx-3 mb-4 rounded-2xl border px-4 py-3 flex flex-wrap gap-x-5 gap-y-2" style={d.footer}>
          {cfg.wifiNome && (
            <div className="flex items-center gap-1.5 text-xs" style={d.textSub}>
              <span>📶</span>
              <span className="font-medium">{cfg.wifiNome}</span>
              {cfg.wifiSenha && <span>· senha: <span className="font-mono">{cfg.wifiSenha}</span></span>}
            </div>
          )}
          {cfg.horario && (
            <div className="flex items-center gap-1.5 text-xs" style={d.textSub}>
              <span>🕐</span><span>{cfg.horario}</span>
            </div>
          )}
          {cfg.instagram && (
            <div className="flex items-center gap-1.5 text-xs" style={d.textSub}>
              <span>📸</span><span>{cfg.instagram}</span>
            </div>
          )}
          {cfg.whatsapp && (
            <div className="flex items-center gap-1.5 text-xs" style={d.textSub}>
              <span>💬</span><span>{cfg.whatsapp}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Carrinho FAB ── */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button onClick={() => setCarrinhoAberto(true)}
            className="w-full active:scale-[0.98] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all"
            style={accentBg(cfg)}>
            <div className="relative">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItens}
              </span>
            </div>
            <span className="font-semibold flex-1 text-left">Ver meu pedido</span>
            <span className="bg-black/20 px-3 py-1 rounded-xl font-bold text-sm">
              R$ {fmt(totalValor)}
            </span>
          </button>
        </div>
      )}

      {/* ── Carrinho Drawer ── */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCarrinhoAberto(false)} />
          <div className="relative rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl" style={d.drawerBg}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: dark ? '#4b5563' : '#e5e7eb' }} />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={d.drawerBorder}>
              <div>
                <h2 className="font-bold text-lg" style={d.textMain}>Meu pedido</h2>
                <p className="text-xs" style={d.textSub}>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
              </div>
              <button onClick={() => setCarrinhoAberto(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: dark ? '#374151' : '#f3f4f6', color: dark ? '#d1d5db' : '#374151' }}>
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {carrinho.map((item) => (
                <div key={item.produtoId} className="flex gap-3 items-start">
                  {item.imagemUrl ? (
                    <img src={item.imagemUrl} alt={item.nome} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                      style={{ background: dark ? '#374151' : '#f3f4f6' }}>🍴</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm" style={d.textMain}>{item.nome}</p>
                      <p className="font-bold text-sm ml-2 flex-shrink-0" style={accentText(cfg)}>
                        R$ {fmt(Number(item.preco) * item.quantidade)}
                      </p>
                    </div>
                    <p className="text-xs" style={d.textSub}>R$ {fmt(item.preco)} un</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 rounded-xl px-1 py-1" style={{ background: dark ? '#374151' : '#f3f4f6' }}>
                        <button onClick={() => removeItem(item.produtoId)}
                          className="w-6 h-6 rounded-lg shadow-sm flex items-center justify-center transition"
                          style={{ background: dark ? '#4b5563' : 'white', color: dark ? '#f87171' : '#6b7280' }}>
                          <Minus size={11} />
                        </button>
                        <span className="w-5 text-center font-bold text-sm" style={d.textMain}>{item.quantidade}</span>
                        <button onClick={() => addItem({ id: item.produtoId, nome: item.nome, preco: item.preco, imagemUrl: item.imagemUrl })}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm transition"
                          style={accentBg(cfg)}>
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                    <input
                      value={obs[item.produtoId] || ''}
                      onChange={(e) => setObs((o) => ({ ...o, [item.produtoId]: e.target.value }))}
                      placeholder="Alguma observação? (sem cebola...)"
                      className="mt-2 w-full text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 placeholder:text-gray-400"
                      style={d.inputBg}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t space-y-3" style={d.drawerBorder}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={d.textSub}>Subtotal</span>
                <span className="font-bold text-lg" style={d.textMain}>R$ {fmt(totalValor)}</span>
              </div>
              <button onClick={enviarPedido} disabled={enviando}
                className="w-full text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg"
                style={accentBg(cfg)}>
                {enviando ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                {enviando ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
