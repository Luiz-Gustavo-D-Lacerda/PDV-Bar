import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Loader2, Receipt, ChevronRight, Clock, ArrowLeft, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';
import useAuthStore from '../store/auth';

function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

function calcTotal(comanda) {
  return comanda.pedidos.reduce((s, p) =>
    s + p.subPedidos.reduce((s2, sub) =>
      s2 + sub.itens.reduce((s3, it) => s3 + Number(it.precoUnitario) * it.quantidade, 0), 0), 0);
}

function tempoAberta(criadoEm) {
  const min = Math.floor((Date.now() - new Date(criadoEm)) / 60000);
  if (min < 60) return `${min}min`;
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ''}`;
}

const STATUS_BADGE = {
  ABERTA: { label: 'Aberta', cls: 'bg-green-100 text-green-700' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguard. pagamento', cls: 'bg-purple-100 text-purple-700' },
};

export default function MesaLandingPage() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [mesa, setMesa] = useState(null);
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function load() {
    try {
      const [mesaRes, comandasRes] = await Promise.all([
        api.get(`/mesas/${mesaId}`),
        api.get(`/mesas/${mesaId}/comandas`),
      ]);
      setMesa(mesaRes.data);
      setComandas(comandasRes.data);
    } catch {
      toast.error('Erro ao carregar mesa');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    socket.connect();
    socket.emit('entrar_mesa', mesaId);
    socket.on('comanda_atualizada', load);
    return () => {
      socket.off('comanda_atualizada', load);
      socket.disconnect();
    };
  }, [mesaId]);

  async function abrirComanda() {
    setSalvando(true);
    try {
      const { data } = await api.post(`/mesas/${mesaId}/comanda/abrir`, { nome });
      navigate(`/mesa/${mesaId}/cardapio/${data.id}`);
    } catch {
      toast.error('Erro ao abrir comanda');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-green-600" size={36} />
    </div>
  );

  if (!mesa) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-3xl">⚠️</div>
      <h2 className="text-xl font-bold text-gray-700">Mesa não encontrada</h2>
      <p className="text-gray-500 text-sm">Verifique o QR Code e tente novamente.</p>
    </div>
  );

  if (!mesa.ativa) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">🚫</div>
      <h2 className="text-xl font-bold text-gray-700">Mesa {mesa.numero} indisponível</h2>
      <p className="text-gray-500 text-sm">Esta mesa está desativada no momento.<br />Chame um garçom para ser atendido.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white px-5 pt-10 pb-8">
        {token && (
          <Link
            to={['ADMIN', 'GERENTE'].includes(user?.role) ? '/admin' : '/garcom'}
            className="flex items-center gap-1 text-green-200 text-xs hover:text-white mb-4"
          >
            <ArrowLeft size={13} /> Painel
          </Link>
        )}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black backdrop-blur-sm">
            {mesa?.numero}
          </div>
          <div>
            <p className="text-green-200 text-sm font-medium">Mesa</p>
            <h1 className="text-3xl font-black leading-tight">{mesa?.numero}</h1>
          </div>
        </div>
        <p className="text-green-100 text-sm mt-3 opacity-80">
          {comandas.length === 0
            ? 'Nenhuma comanda aberta nesta mesa'
            : `${comandas.length} comanda${comandas.length > 1 ? 's' : ''} ativa${comandas.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Lista de comandas existentes */}
        {comandas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              Comandas abertas
            </p>
            <div className="space-y-3">
              {comandas.map((c, idx) => {
                const total = calcTotal(c);
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE.ABERTA;
                const nPedidos = c.pedidos.length;
                return (
                  <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Users size={18} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {c.nome || `Comanda ${idx + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={10} /> {tempoAberta(c.criadoEm)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-600 font-bold text-lg">R$ {fmt(total)}</p>
                          <p className="text-xs text-gray-400">{nPedidos} pedido{nPedidos !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Link
                          to={`/mesa/${mesaId}/comanda/${c.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Receipt size={14} />
                          Ver comanda
                        </Link>
                        {c.status === 'ABERTA' && (
                          <Link
                            to={`/mesa/${mesaId}/cardapio/${c.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Pedir mais
                            <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Abrir nova comanda */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {comandas.length === 0 ? 'Começar' : 'Abrir minha comanda'}
          </p>

          {!criando ? (
            <button
              onClick={() => setCriando(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-green-300 text-green-700 font-semibold hover:bg-green-50 transition-colors"
            >
              <Plus size={20} />
              Abrir minha comanda
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-bold text-gray-900">Nova comanda</h3>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Seu nome <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && abrirComanda()}
                  placeholder="Ex: João, Aniversariante, Casal..."
                  className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Facilita identificar sua comanda entre as outras da mesa
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCriando(false); setNome(''); }}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={abrirComanda}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {salvando && <Loader2 size={14} className="animate-spin" />}
                  Abrir e ver cardápio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
