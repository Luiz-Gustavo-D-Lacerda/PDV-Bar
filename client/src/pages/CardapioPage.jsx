import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X, ChevronRight, Loader2, ArrowLeft, ClipboardList, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const CAT_EMOJI = {
  'Bebidas': '🍺',
  'Petiscos': '🍟',
  'Pratos Principais': '🍽️',
  'Sobremesas': '🍰',
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
        const [cardRes, mesaRes] = await Promise.all([
          api.get('/cardapio'),
          api.get(`/mesas/${mesaId}`),
        ]);
        setCategorias(cardRes.data);
        if (cardRes.data.length) setCatAtiva(cardRes.data[0].id);
        setMesa(mesaRes.data);
      } catch {
        toast.error('Erro ao carregar cardápio');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mesaId]);

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

  // Filtra produtos pela busca
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🍺</span>
        </div>
        <p className="text-gray-400 text-sm">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white">
        {/* Voltar ao painel (staff) */}
        {token && (
          <Link
            to={user?.role === 'ADMIN' || user?.role === 'GERENTE' ? '/admin' : '/garcom'}
            className="absolute top-3 left-4 flex items-center gap-1 text-green-200 text-xs hover:text-white"
          >
            <ArrowLeft size={13} /> Painel
          </Link>
        )}

        {/* Ver comanda */}
        <Link
          to={`/mesa/${mesaId}/comanda/${comandaId}`}
          className="absolute top-3 right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm transition"
        >
          <ClipboardList size={13} />
          Ver comanda
        </Link>

        <div className="px-5 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
              🍺
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight">PDV Bar</h1>
              {mesa && (
                <p className="text-green-200 text-sm">Mesa {mesa.numero}</p>
              )}
            </div>
          </div>
          <p className="text-green-100 text-xs mt-3 opacity-80">
            Escolha os itens e confirme seu pedido
          </p>
        </div>

        {/* Barra de busca */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      {!busca && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
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
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  catAtiva === cat.id
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{CAT_EMOJI[cat.nome] || '🍴'}</span>
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Produtos ── */}
      <div className="pb-32">
        {categoriasFiltradas.length === 0 && (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <Search size={40} className="mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
          </div>
        )}

        {categoriasFiltradas.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => (catRefs.current[cat.id] = el)}
            className="scroll-mt-14"
          >
            {/* Título da categoria */}
            <div className="px-4 pt-5 pb-2 flex items-center gap-2">
              <span className="text-xl">{CAT_EMOJI[cat.nome] || '🍴'}</span>
              <h2 className="font-bold text-gray-800 text-base">{cat.nome}</h2>
              <span className="text-xs text-gray-400">({cat.produtos.length})</span>
            </div>

            <div className="px-3 space-y-2">
              {cat.produtos.map((prod) => {
                const qty = qtdItem(prod.id);
                const esgotado = prod.estoque != null && prod.estoque.quantidade <= 0;

                return (
                  <div
                    key={prod.id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all ${
                      esgotado ? 'opacity-55' : 'active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Imagem */}
                      <div className="flex-shrink-0">
                        {prod.imagemUrl ? (
                          <img
                            src={prod.imagemUrl}
                            alt={prod.nome}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-3xl">
                            {CAT_EMOJI[cat.nome] || '🍴'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-900 text-sm leading-tight">{prod.nome}</p>
                            {esgotado && (
                              <span className="flex-shrink-0 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
                                Esgotado
                              </span>
                            )}
                          </div>
                          {prod.descricao && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                              {prod.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-green-600 font-bold text-base">
                            R$ {fmt(prod.preco)}
                          </p>

                          {/* Controles de quantidade */}
                          {!esgotado && (
                            qty > 0 ? (
                              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-1 py-1">
                                <button
                                  onClick={() => removeItem(prod.id)}
                                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-green-700 hover:bg-green-100 transition"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-5 text-center font-bold text-green-700 text-sm">{qty}</span>
                                <button
                                  onClick={() => addItem(prod)}
                                  className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition shadow-sm"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addItem(prod)}
                                className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition shadow-sm active:scale-95"
                              >
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
          </section>
        ))}
      </div>

      {/* ── Carrinho FAB ── */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all"
          >
            <div className="relative">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItens}
              </span>
            </div>
            <span className="font-semibold flex-1 text-left">Ver meu pedido</span>
            <span className="bg-green-800/60 px-3 py-1 rounded-xl font-bold text-sm">
              R$ {fmt(totalValor)}
            </span>
          </button>
        </div>
      )}

      {/* ── Carrinho Drawer ── */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCarrinhoAberto(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Meu pedido</h2>
                <p className="text-gray-400 text-xs">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
              </div>
              <button
                onClick={() => setCarrinhoAberto(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Itens */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {carrinho.map((item) => (
                <div key={item.produtoId} className="flex gap-3 items-start">
                  {/* Thumb */}
                  {item.imagemUrl ? (
                    <img src={item.imagemUrl} alt={item.nome} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-xl">🍴</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900 text-sm">{item.nome}</p>
                      <p className="text-green-600 font-bold text-sm ml-2 flex-shrink-0">
                        R$ {fmt(Number(item.preco) * item.quantidade)}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs">R$ {fmt(item.preco)} un</p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-1">
                        <button
                          onClick={() => removeItem(item.produtoId)}
                          className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 transition"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-5 text-center font-bold text-gray-700 text-sm">{item.quantidade}</span>
                        <button
                          onClick={() => addItem({ id: item.produtoId, nome: item.nome, preco: item.preco, imagemUrl: item.imagemUrl })}
                          className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition shadow-sm"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    <input
                      value={obs[item.produtoId] || ''}
                      onChange={(e) => setObs((o) => ({ ...o, [item.produtoId]: e.target.value }))}
                      placeholder="Alguma observação? (sem cebola...)"
                      className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 text-gray-700 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">R$ {fmt(totalValor)}</span>
              </div>
              <button
                onClick={enviarPedido}
                disabled={enviando}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg"
              >
                {enviando
                  ? <Loader2 size={18} className="animate-spin" />
                  : <ChevronRight size={18} />
                }
                {enviando ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
