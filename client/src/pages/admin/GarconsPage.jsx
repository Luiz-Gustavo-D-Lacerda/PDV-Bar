import { useEffect, useState } from 'react';
import {
  Users, Plus, Pencil, Trash2, Loader2, Trophy,
  ShoppingBag, DollarSign, LayoutGrid, Eye, EyeOff,
  TrendingUp, Medal
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const ROLE_LABEL = { GARCOM: 'Garçom' };
const ROLE_COLOR = { GARCOM: 'bg-blue-100 text-blue-700' };

function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

function MedalIcon({ pos }) {
  if (pos === 0) return <Trophy size={18} className="text-yellow-500" />;
  if (pos === 1) return <Medal size={18} className="text-gray-400" />;
  if (pos === 2) return <Medal size={18} className="text-amber-600" />;
  return <span className="text-gray-400 font-bold text-sm w-4 text-center">{pos + 1}</span>;
}

const PERMISSOES_CONFIG = [
  {
    key: 'cancelarItens',
    label: 'Cancelar pedidos',
    desc: 'Pode cancelar itens de uma comanda diretamente pelo app',
  },
  {
    key: 'receberDinheiro',
    label: 'Receber pagamento em dinheiro',
    desc: 'Pode fechar contas com a opção "Dinheiro" ao cobrar o cliente',
  },
];

function GarcomForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { nome: '', email: '', senha: '', role: 'GARCOM', permissoes: {} }
  );
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErros((e) => ({ ...e, [field]: undefined }));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!initial && !form.senha) e.senha = 'Senha é obrigatória';
    return e;
  }

  async function handleSalvar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    setSalvando(true);
    const erroServidor = await onSave(form);
    setSalvando(false);
    if (erroServidor) setErros({ geral: erroServidor });
  }

  const inputClass = (campo) =>
    `mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
      erros[campo] ? 'border-red-400 bg-red-50' : ''
    }`;

  return (
    <div className="bg-gray-50 border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">{initial ? 'Editar' : 'Novo'} garçom</h3>

      {erros.geral && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
          {erros.geral}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-gray-600">Nome</label>
          <input value={form.nome} onChange={(e) => set('nome', e.target.value)}
            className={inputClass('nome')} />
          {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-gray-600">Email <span className="text-gray-400">(opcional)</span></label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            className={inputClass('email')} placeholder="garcom@email.com" />
          {erros.email && <p className="text-xs text-red-500 mt-1">{erros.email}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-gray-600">
            {initial ? 'Nova senha (deixe vazio para não alterar)' : 'Senha'}
          </label>
          <div className="relative mt-1">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={form.senha}
              onChange={(e) => set('senha', e.target.value)}
              className={`w-full px-3 py-2 pr-9 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${erros.senha ? 'border-red-400 bg-red-50' : ''}`}
              placeholder={initial ? '••••••' : ''}
            />
            <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {erros.senha && <p className="text-xs text-red-500 mt-1">{erros.senha}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-gray-600">Função</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="GARCOM">Garçom</option>
          </select>
        </div>
      </div>

      {/* Permissões */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permissões</p>
        <div className="space-y-2">
          {PERMISSOES_CONFIG.map(({ key, label, desc }) => {
            const ativo = !!(form.permissoes?.[key]);
            return (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input type="checkbox" checked={ativo}
                    onChange={() => set('permissoes', { ...form.permissoes, [key]: !ativo })}
                    className="sr-only" />
                  <div className={`w-10 h-5 rounded-full transition-colors ${ativo ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} disabled={salvando} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
        <button onClick={handleSalvar} disabled={salvando}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
          {salvando && <Loader2 size={14} className="animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function GarconsPage() {
  const [garcons, setGarcons] = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aba, setAba] = useState('relatorio'); // 'relatorio' | 'equipe'
  const [periodo, setPeriodo] = useState('hoje');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Ranking por produto
  const [produtos, setProdutos] = useState([]);
  const [produtoFiltro, setProdutoFiltro] = useState('');
  const [rankingProduto, setRankingProduto] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const periodos = {
    hoje: (() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); })(),
    semana: (() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); })(),
    mes: (() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); })(),
  };

  async function load() {
    try {
      const [gRes, rRes] = await Promise.all([
        api.get('/garcons'),
        api.get(`/garcons/relatorio?de=${periodos[periodo]}`),
      ]);
      setGarcons(gRes.data);
      setRelatorio(rRes.data);
    } catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [periodo]);

  useEffect(() => {
    api.get('/cardapio').then(({ data }) => {
      setProdutos(data.flatMap((cat) =>
        cat.produtos.map((p) => ({ id: p.id, nome: p.nome, catNome: cat.nome }))
      ));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!produtoFiltro) { setRankingProduto([]); return; }
    setLoadingRanking(true);
    api.get(`/garcons/ranking-produto?produtoId=${produtoFiltro}&de=${periodos[periodo]}`)
      .then(({ data }) => setRankingProduto(data))
      .catch(() => toast.error('Erro ao carregar ranking'))
      .finally(() => setLoadingRanking(false));
  }, [produtoFiltro, periodo]);

  async function criar(form) {
    try {
      await api.post('/garcons', form);
      toast.success('Garçom criado!');
      setCriando(false);
      load();
      return null;
    } catch (e) {
      const msg = e.response?.data?.erro || 'Erro ao criar garçom';
      toast.error(msg);
      return msg;
    }
  }

  async function editar(id, form) {
    try {
      await api.put(`/garcons/${id}`, form);
      toast.success('Atualizado!');
      setEditando(null);
      load();
      return null;
    } catch (e) {
      const msg = e.response?.data?.erro || 'Erro ao atualizar';
      toast.error(msg);
      return msg;
    }
  }

  async function reativar(id) {
    try {
      await api.patch(`/garcons/${id}/ativar`);
      toast.success('Garçom reativado!');
      load();
    } catch { toast.error('Erro ao reativar'); }
  }

  async function desativar(id) {
    if (!confirm('Desativar este garçom?')) return;
    try {
      await api.delete(`/garcons/${id}`);
      toast.success('Garçom desativado');
      load();
    } catch { toast.error('Erro'); }
  }

  const totalGeral = relatorio.reduce((s, r) => s + r.totalVendido, 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garçons</h1>
          <p className="text-gray-500 text-sm">Equipe e desempenho de vendas</p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} /> Novo garçom
        </button>
      </div>

      {criando && <GarcomForm onSave={criar} onCancel={() => setCriando(false)} />}

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'relatorio', label: 'Desempenho', icon: TrendingUp },
          { id: 'equipe',    label: 'Equipe',     icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── ABA: DESEMPENHO ── */}
      {aba === 'relatorio' && (
        <div className="space-y-5">
          {/* Filtro de período */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Período:</span>
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: 'semana', label: 'Últimos 7 dias' },
              { id: 'mes', label: 'Este mês' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setPeriodo(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodo === id ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Totalizador */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400">Faturamento total da equipe</p>
              <p className="text-2xl font-black text-gray-900 mt-1">R$ {fmt(totalGeral)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400">Total de pedidos</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {relatorio.reduce((s, r) => s + r.totalPedidos, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400">Garçons ativos no período</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {relatorio.filter((r) => r.totalPedidos > 0).length}
              </p>
            </div>
          </div>

          {/* Ranking */}
          {relatorio.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum dado no período selecionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relatorio.map((r, idx) => {
                const pct = totalGeral > 0 ? (r.totalVendido / totalGeral) * 100 : 0;
                return (
                  <div key={r.garcom.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    idx === 0 && r.totalPedidos > 0 ? 'border-yellow-200' : 'border-gray-100'
                  }`}>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Posição */}
                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                          <MedalIcon pos={idx} />
                        </div>

                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          idx === 0 && r.totalPedidos > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.garcom.nome.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{r.garcom.nome}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[r.garcom.role] || 'bg-gray-100 text-gray-600'}`}>
                              {ROLE_LABEL[r.garcom.role] || r.garcom.role}
                            </span>
                            {!r.garcom.ativo && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-500">Inativo</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{r.garcom.email}</p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-right">
                          <div>
                            <p className="text-xs text-gray-400">Pedidos</p>
                            <p className="font-bold text-gray-900">{r.totalPedidos}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Mesas</p>
                            <p className="font-bold text-gray-900">{r.mesasAtendidas}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Ticket médio</p>
                            <p className="font-bold text-gray-900">R$ {fmt(r.ticketMedio)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Total vendido</p>
                            <p className="font-bold text-green-600 text-lg">R$ {fmt(r.totalVendido)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats mobile */}
                      <div className="sm:hidden flex gap-4 mt-3 ml-11 text-sm">
                        <div><span className="text-gray-400">Pedidos: </span><span className="font-semibold">{r.totalPedidos}</span></div>
                        <div><span className="text-gray-400">Total: </span><span className="font-semibold text-green-600">R$ {fmt(r.totalVendido)}</span></div>
                      </div>

                      {/* Barra de progresso */}
                      {r.totalPedidos > 0 && (
                        <div className="mt-3 ml-11">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{pct.toFixed(1)}% do total da equipe</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${idx === 0 ? 'bg-yellow-400' : 'bg-green-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {r.totalPedidos === 0 && (
                        <p className="text-xs text-gray-400 mt-2 ml-11">Sem pedidos no período</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Ranking por produto ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Trophy size={17} className="text-purple-500" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Ranking por produto / combo</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Quem mais vendeu um item específico no período — ideal para promoções</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Produto ou combo</label>
                <select value={produtoFiltro} onChange={(e) => setProdutoFiltro(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">— Selecione um produto —</option>
                  {Object.entries(
                    produtos.reduce((acc, p) => {
                      if (!acc[p.catNome]) acc[p.catNome] = [];
                      acc[p.catNome].push(p);
                      return acc;
                    }, {})
                  ).map(([catNome, prods]) => (
                    <optgroup key={catNome} label={catNome}>
                      {prods.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {!produtoFiltro && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <ShoppingBag size={28} className="mx-auto mb-2 opacity-25" />
                  Selecione um produto para ver quem mais vendeu
                </div>
              )}

              {produtoFiltro && loadingRanking && (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-green-600" size={24} />
                </div>
              )}

              {produtoFiltro && !loadingRanking && (() => {
                const comVendas = rankingProduto.filter((r) => r.quantidade > 0);
                const semVendas = rankingProduto.filter((r) => r.quantidade === 0);
                if (comVendas.length === 0) return (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-25" />
                    <p className="text-sm">Nenhuma venda deste produto no período</p>
                  </div>
                );
                return (
                  <div className="space-y-2">
                    {comVendas.map((r, idx) => (
                      <div key={r.garcom.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? 'bg-yellow-50 border border-yellow-200' : idx === 1 ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50'}`}>
                        <div className="w-7 flex items-center justify-center flex-shrink-0">
                          <MedalIcon pos={idx} />
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white shadow-sm text-gray-600'}`}>
                          {r.garcom.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{r.garcom.nome}</p>
                            {!r.garcom.ativo && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-500">Inativo</span>}
                          </div>
                          <p className="text-xs text-gray-400">{ROLE_LABEL[r.garcom.role] || r.garcom.role}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-xl ${idx === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{r.quantidade}</p>
                          <p className="text-xs text-gray-400">{r.quantidade === 1 ? 'unidade' : 'unidades'}</p>
                        </div>
                        <div className="text-right hidden sm:block min-w-[72px]">
                          <p className="font-bold text-green-600 text-sm">R$ {fmt(r.total)}</p>
                          <p className="text-xs text-gray-400">total</p>
                        </div>
                      </div>
                    ))}
                    {semVendas.length > 0 && (
                      <p className="text-xs text-gray-400 text-center pt-1">
                        {semVendas.length} garçom{semVendas.length > 1 ? 'ns' : ''} sem venda deste produto no período
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* ── ABA: EQUIPE ── */}
      {aba === 'equipe' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {garcons.filter((g) => g.ativo).length} ativo{garcons.filter((g) => g.ativo).length !== 1 ? 's' : ''}
              {garcons.filter((g) => !g.ativo).length > 0 && (
                <span className="text-gray-400"> · {garcons.filter((g) => !g.ativo).length} inativo{garcons.filter((g) => !g.ativo).length !== 1 ? 's' : ''}</span>
              )}
            </p>
            {garcons.some((g) => !g.ativo) && (
              <button onClick={() => setMostrarInativos((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${mostrarInativos ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {mostrarInativos ? 'Ocultar inativos' : 'Mostrar inativos'}
              </button>
            )}
          </div>

          {garcons.filter((g) => g.ativo || mostrarInativos).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum garçom cadastrado</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {garcons.filter((g) => g.ativo || mostrarInativos).map((g) => (
              <div key={g.id}>
                {editando === g.id ? (
                  <GarcomForm
                    initial={{ ...g, senha: '', permissoes: g.permissoes || {} }}
                    onSave={(f) => editar(g.id, f)}
                    onCancel={() => setEditando(null)}
                  />
                ) : (
                  <div className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 ${!g.ativo ? 'opacity-50' : ''}`}>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
                      {g.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{g.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[g.role] || 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABEL[g.role] || g.role}
                        </span>
                        {!g.ativo && <span className="text-xs text-red-500">Inativo</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{g.email}</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      {g.ativo ? (
                        <>
                          <button onClick={() => setEditando(g.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => desativar(g.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => reativar(g.id)}
                          className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition-colors">
                          Reativar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
