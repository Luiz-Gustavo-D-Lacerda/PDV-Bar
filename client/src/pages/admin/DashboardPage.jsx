import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, Users, TrendingUp, ShoppingBag, AlertTriangle,
  Loader2, RefreshCw, CheckCircle, Clock, CreditCard,
} from 'lucide-react';
import api from '../../lib/api';

const PERIODOS = [
  { key: 'hoje',   label: 'Hoje'    },
  { key: 'semana', label: '7 dias'  },
  { key: 'mes',    label: 'Este mês' },
];

const SETOR_LABEL = { BAR: 'Bar', COZINHA: 'Cozinha', GERAL: 'Geral' };

function fmt(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ icon: Icon, label, value, sub, color = 'bg-green-500' }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [periodo, setPeriodo] = useState('hoje');

  const load = useCallback(async (p = periodo, showRefresh = false) => {
    if (showRefresh) setRefresh(true);
    try {
      const r = await api.get(`/dashboard?periodo=${p}`);
      setData(r.data);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, [periodo]);

  useEffect(() => { setLoading(true); load(periodo); }, [periodo]);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const id = setInterval(() => load(periodo), 60_000);
    return () => clearInterval(id);
  }, [periodo, load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-green-600" size={32} />
    </div>
  );

  const { mesas = {}, porFormaPagamento = {}, maisVendidos = [], alertasEstoque = [] } = data || {};
  const totalAlertas = alertasEstoque.length;

  const faturamentoTotal = (porFormaPagamento.PIX?.total || 0)
    + (porFormaPagamento.CARTAO?.total || 0)
    + (porFormaPagamento.DINHEIRO?.total || 0);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de período */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {PERIODOS.map(({ key, label }) => (
              <button key={key} onClick={() => setPeriodo(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodo === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => load(periodo, true)} disabled={refresh}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Atualizar">
            <RefreshCw size={16} className={refresh ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="Faturamento" color="bg-green-500"
          value={fmt(data?.faturamento)}
          sub={`${data?.totalComandas || 0} comanda${data?.totalComandas !== 1 ? 's' : ''} paga${data?.totalComandas !== 1 ? 's' : ''}`} />
        <StatCard icon={TrendingUp}    label="Ticket médio" color="bg-blue-500"
          value={fmt(data?.ticketMedio)}
          sub="por comanda" />
        <StatCard icon={ShoppingBag}   label="Pedidos em aberto" color="bg-purple-500"
          value={data?.pedidosAbertos ?? 0}
          sub="aguardando preparo/entrega" />
        <StatCard icon={AlertTriangle} label="Alertas de estoque" color={totalAlertas > 0 ? 'bg-orange-500' : 'bg-gray-400'}
          value={totalAlertas}
          sub={totalAlertas > 0 ? 'itens abaixo do mínimo' : 'tudo ok'} />
      </div>

      {/* Status das mesas */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          Status das mesas
          <span className="text-sm font-normal text-gray-400 ml-1">({mesas.total || 0} ativas)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'livres',    label: 'Livres',           cor: 'bg-green-50 text-green-700 border-green-200',   valor: mesas.livres    || 0 },
            { key: 'ocupadas',  label: 'Ocupadas',          cor: 'bg-yellow-50 text-yellow-700 border-yellow-200', valor: mesas.ocupadas  || 0 },
            { key: 'prontas',   label: 'Prontas p/ entrega',cor: 'bg-blue-50 text-blue-700 border-blue-200',      valor: mesas.prontas   || 0 },
            { key: 'aguardando',label: 'Aguard. pagamento', cor: 'bg-purple-50 text-purple-700 border-purple-200',valor: mesas.aguardando|| 0 },
          ].map(({ key, label, cor, valor }) => (
            <div key={key} className={`border rounded-xl p-4 text-center ${cor}`}>
              <p className="text-3xl font-black">{valor}</p>
              <p className="text-xs font-medium mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Formas de pagamento */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-gray-500" />
            Formas de pagamento
          </h2>
          {faturamentoTotal > 0 ? (
            <div className="space-y-3">
              {[
                { key: 'PIX',      label: 'PIX',      emoji: '📱', cor: 'bg-blue-500'   },
                { key: 'CARTAO',   label: 'Cartão',   emoji: '💳', cor: 'bg-purple-500' },
                { key: 'DINHEIRO', label: 'Dinheiro', emoji: '💵', cor: 'bg-green-500'  },
              ].map(({ key, label, emoji, cor }) => {
                const item  = porFormaPagamento[key] || { count: 0, total: 0 };
                const pct   = faturamentoTotal > 0 ? (item.total / faturamentoTotal) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        {emoji} {label}
                        {item.count > 0 && (
                          <span className="text-xs text-gray-400">({item.count}x)</span>
                        )}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{fmt(item.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cor} rounded-full transition-all`}
                        style={{ width: `${pct.toFixed(1)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhum pagamento registrado</p>
          )}
        </div>

        {/* Mais vendidos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Mais vendidos
          </h2>
          {maisVendidos.length > 0 ? (
            <div className="space-y-3">
              {maisVendidos.map((p, i) => {
                const maxQtd = maisVendidos[0]?.quantidade || 1;
                const pct    = (p.quantidade / maxQtd) * 100;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-800 flex items-center gap-1.5">
                        <span>{medals[i] || `${i + 1}.`}</span>
                        {p.nome}
                      </span>
                      <span className="text-sm font-bold text-green-600">{p.quantidade} un</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma venda no período</p>
          )}
        </div>
      </div>

      {/* Alertas de estoque (produtos + insumos) */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          Alertas de estoque
          {totalAlertas > 0 && (
            <span className="ml-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalAlertas}
            </span>
          )}
        </h2>
        {totalAlertas > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alertasEstoque.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <AlertTriangle size={15} className="text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.nome}</p>
                  <p className="text-xs text-orange-600">
                    {Number(a.quantidade)} / mín {Number(a.minimo)}
                    {a.tipo === 'insumo' && a.setor && (
                      <span className="ml-1 opacity-70">· {SETOR_LABEL[a.setor] || a.setor}</span>
                    )}
                  </p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  a.tipo === 'insumo' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {a.tipo === 'insumo' ? 'Insumo' : 'Produto'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Todos os estoques estão ok
          </p>
        )}
      </div>

      {/* Rodapé: atualização */}
      <p className="text-center text-xs text-gray-300 flex items-center justify-center gap-1">
        <Clock size={11} />
        Atualizado automaticamente a cada 60s
      </p>
    </div>
  );
}
