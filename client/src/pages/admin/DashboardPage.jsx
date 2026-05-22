import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Package, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../lib/api';

function StatCard({ icon: Icon, label, value, color = 'bg-green-500' }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-green-600" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Resumo do dia</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Faturamento hoje"
          value={`R$ ${(data?.faturamento || 0).toFixed(2).replace('.', ',')}`}
          color="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket médio"
          value={`R$ ${(data?.ticketMedio || 0).toFixed(2).replace('.', ',')}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Mesas abertas"
          value={data?.mesasAbertas || 0}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Package}
          label="Pedidos em aberto"
          value={data?.pedidosAbertos || 0}
          color="bg-purple-500"
        />
      </div>

      {/* Formas de pagamento */}
      {(data?.porFormaPagamento?.PIX > 0 || data?.porFormaPagamento?.CARTAO > 0 || data?.porFormaPagamento?.DINHEIRO > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Formas de pagamento hoje</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'PIX',     label: 'PIX',     icon: '📱', color: 'bg-blue-50 text-blue-700' },
              { key: 'CARTAO',  label: 'Cartão',  icon: '💳', color: 'bg-purple-50 text-purple-700' },
              { key: 'DINHEIRO',label: 'Dinheiro',icon: '💵', color: 'bg-green-50 text-green-700' },
            ].map(({ key, label, icon, color }) => (
              <div key={key} className={`${color} rounded-xl p-4 text-center`}>
                <p className="text-2xl">{icon}</p>
                <p className="text-2xl font-black mt-1">{data.porFormaPagamento[key] || 0}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Mais vendidos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Mais vendidos hoje
          </h2>
          {data?.maisVendidos?.length ? (
            <div className="space-y-3">
              {data.maisVendidos.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full text-xs font-bold flex items-center justify-center text-gray-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-gray-800 text-sm">{p.nome}</span>
                  <span className="text-green-600 font-semibold text-sm">{p.quantidade} un</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma venda hoje</p>
          )}
        </div>

        {/* Alertas de estoque */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Alertas de estoque
          </h2>
          {data?.alertasEstoque?.length ? (
            <div className="space-y-3">
              {data.alertasEstoque.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                  <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.produtoNome}</p>
                    <p className="text-xs text-orange-600">{Number(a.quantidade)} un (mín: {Number(a.minimo)})</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <span className="text-green-500">✓</span> Todos os estoques ok
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
