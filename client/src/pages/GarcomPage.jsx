import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, Coffee, Users, Loader2, Volume2 } from 'lucide-react';
import useAudioNotificacao from '../hooks/useAudioNotificacao';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const STATUS_MESA = {
  livre: { label: 'Livre', color: 'bg-green-50 border-green-200 text-green-700' },
  ocupada: { label: 'Ocupada', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  pronto: { label: 'Pronto!', color: 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-400 ring-offset-1' },
  aguardando: { label: 'Aguardando pgto', color: 'bg-purple-50 border-purple-200 text-purple-700' },
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Coffee size={22} />
          <div>
            <h1 className="font-bold">Garçom</h1>
            <p className="text-green-200 text-xs">{user?.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!somAtivo && (
            <button
              onClick={ativarSom}
              className="flex items-center gap-1 text-green-300 text-xs hover:text-white"
              title="Ativar notificações sonoras"
            >
              <Volume2 size={15} /> Som
            </button>
          )}
          {notificacoes.length > 0 && (
            <div className="relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {notificacoes.length}
              </span>
            </div>
          )}
          <button onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Notificações */}
      {notificacoes.length > 0 && (
        <div className="p-3 space-y-2">
          {notificacoes.slice(0, 3).map((n, i) => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <CheckCircle size={18} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-blue-800">Mesa {n.mesaNumero}</span>
                <span className="text-blue-600"> — pedido pronto para entregar!</span>
              </div>
              <button onClick={() => setNotificacoes((prev) => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-600">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Mapa de mesas */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 text-lg">Mesas</h2>
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Livre</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Ocupada</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Pronto</span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {mesas.filter((m) => m.ativa).map((mesa) => {
            const status = getMesaStatus(mesa);
            const { label, color } = STATUS_MESA[status];
            return (
              <Link
                key={mesa.id}
                to={`/mesa/${mesa.id}`}
                className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:shadow-md ${color}`}
              >
                <Users size={20} />
                <span className="font-bold text-lg">{mesa.numero}</span>
                <span className="text-xs font-medium">{label}</span>
                {mesa.comandas?.length > 0 && (
                  <span className="text-xs opacity-70">{mesa.comandas.length} comanda{mesa.comandas.length > 1 ? 's' : ''}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
