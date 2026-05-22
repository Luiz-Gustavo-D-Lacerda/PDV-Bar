import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Coffee, Users, Loader2, Volume2, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';
import useAuthStore from '../store/auth';
import useAudioNotificacao from '../hooks/useAudioNotificacao';

const STATUS_MESA = {
  livre:      { label: 'Livre',          dot: 'bg-green-400',  card: 'bg-white border-gray-100',                       badge: 'bg-green-100 text-green-700'  },
  ocupada:    { label: 'Ocupada',         dot: 'bg-yellow-400', card: 'bg-white border-yellow-200',                     badge: 'bg-yellow-100 text-yellow-700' },
  pronto:     { label: 'Pronto!',         dot: 'bg-blue-500',   card: 'bg-blue-50 border-blue-300 ring-2 ring-blue-300 ring-offset-1', badge: 'bg-blue-100 text-blue-700'   },
  aguardando: { label: 'Aguard. pgto',   dot: 'bg-purple-400', card: 'bg-purple-50 border-purple-200',                 badge: 'bg-purple-100 text-purple-700' },
};

export default function GarcomPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ativo: somAtivo, ativar: ativarSom, beepPronto } = useAudioNotificacao();

  async function loadMesas() {
    try {
      const { data } = await api.get('/mesas');
      setMesas(data);
    } catch {
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMesas();
    socket.connect();
    socket.emit('entrar_garcom');

    socket.on('pedido_pronto', (data) => {
      setNotificacoes((n) => [data, ...n.slice(0, 9)]);
      toast.success(`Mesa ${data.mesaNumero}: pedido pronto!`, { duration: 5000 });
      beepPronto();
      loadMesas();
    });

    socket.on('comanda_atualizada', () => loadMesas());

    return () => {
      socket.off('pedido_pronto');
      socket.off('comanda_atualizada');
      socket.disconnect();
    };
  }, []);

  function getMesaStatus(mesa) {
    const comandas = mesa.comandas || [];
    if (comandas.length === 0) return 'livre';
    if (comandas.some((c) => c.status === 'AGUARDANDO_PAGAMENTO')) return 'aguardando';
    const temPronto = comandas.some((c) => c.pedidos?.some((p) => p.status === 'PRONTO'));
    if (temPronto) return 'pronto';
    return 'ocupada';
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const mesasAtivas = mesas.filter((m) => m.ativa);
  const ocupadas    = mesasAtivas.filter((m) => getMesaStatus(m) !== 'livre').length;
  const prontas     = mesasAtivas.filter((m) => getMesaStatus(m) === 'pronto').length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="animate-spin text-green-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white px-5 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 -left-4 w-32 h-16 bg-white/5 rounded-full blur-xl" />

        <div className="relative">
          {/* Topo */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Coffee size={20} />
              </div>
              <div>
                <p className="text-green-200 text-xs">Painel do Garçom</p>
                <h1 className="font-black text-lg leading-tight">{user?.nome}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {!somAtivo && (
                <button onClick={ativarSom}
                  className="flex items-center gap-1 text-green-300 text-xs hover:text-white transition-colors"
                  title="Ativar notificações sonoras">
                  <Volume2 size={14} /> Som
                </button>
              )}
              {notificacoes.length > 0 && (
                <div className="relative">
                  <Bell size={19} />
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {notificacoes.length}
                  </span>
                </div>
              )}
              <button onClick={handleLogout} className="text-green-200 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mesas',    value: mesasAtivas.length, sub: 'ativas'    },
              { label: 'Ocupadas', value: ocupadas,           sub: 'com pedido' },
              { label: 'Prontas',  value: prontas,            sub: 'p/ entregar', destaque: prontas > 0 },
            ].map(({ label, value, sub, destaque }) => (
              <div key={label} className={`rounded-2xl px-3 py-2.5 text-center ${destaque ? 'bg-blue-500/30 ring-1 ring-blue-400/50' : 'bg-white/10'}`}>
                <p className={`text-2xl font-black ${destaque ? 'text-blue-200' : 'text-white'}`}>{value}</p>
                <p className={`text-xs font-semibold ${destaque ? 'text-blue-300' : 'text-green-200'}`}>{label}</p>
                <p className={`text-[10px] ${destaque ? 'text-blue-400' : 'text-green-300/70'}`}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Notificações de pedidos prontos */}
      {notificacoes.length > 0 && (
        <div className="p-3 space-y-2">
          {notificacoes.slice(0, 3).map((n, i) => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 text-sm">
                <span className="font-bold text-blue-900">Mesa {n.mesaNumero}</span>
                <span className="text-blue-700"> — pedido pronto para entregar!</span>
              </div>
              <button onClick={() => setNotificacoes((prev) => prev.filter((_, j) => j !== i))}
                className="text-blue-400 hover:text-blue-600 p-1">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Grid de mesas */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Mesas</h2>
          <div className="flex gap-2 text-xs text-gray-500">
            {[
              { cor: 'bg-green-400', label: 'Livre' },
              { cor: 'bg-yellow-400', label: 'Ocupada' },
              { cor: 'bg-blue-500', label: 'Pronto' },
              { cor: 'bg-purple-400', label: 'Pgto' },
            ].map(({ cor, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${cor}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {mesasAtivas.map((mesa) => {
            const status = getMesaStatus(mesa);
            const { label, dot, card, badge } = STATUS_MESA[status];
            const nComandas = mesa.comandas?.length || 0;

            return (
              <Link
                key={mesa.id}
                to={`/mesa/${mesa.id}`}
                className={`border-2 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md active:scale-95 ${card}`}
              >
                {/* Número da mesa */}
                <div className="relative w-full flex justify-center">
                  <span className="text-2xl font-black text-gray-800">{mesa.numero}</span>
                  <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ${dot}`} />
                </div>

                {/* Badge status */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                  {label}
                </span>

                {/* Contagem de comandas */}
                {nComandas > 0 && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Users size={9} /> {nComandas}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {mesasAtivas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mesa ativa</p>
          </div>
        )}
      </div>
    </div>
  );
}
