import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useAudioNotificacao from '../hooks/useAudioNotificacao';
import { Loader2, Clock, ChefHat, CheckCircle2, Flame, Bell, Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';

const STATUS_NEXT = {
  RECEBIDO: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO',
  PRONTO: 'ENTREGUE',
};

const STATUS_LABEL = {
  RECEBIDO: 'Novo',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
};

const BTN_LABEL = {
  RECEBIDO: 'Iniciar preparo',
  EM_PREPARO: 'Marcar como pronto',
  PRONTO: 'Marcar entregue',
};

function useAgora() {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

function tempo(criadoEm, agora) {
  return Math.floor((agora - new Date(criadoEm)) / 60000);
}

function TimerBadge({ criadoEm, agora }) {
  const min = tempo(criadoEm, agora);
  const urgente = min >= 15;
  const atencao = min >= 8;
  return (
    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
      urgente ? 'bg-red-500 text-white animate-pulse' :
      atencao  ? 'bg-yellow-400 text-gray-900' :
                 'bg-gray-700 text-gray-300'
    }`}>
      <Timer size={11} />
      {min}min
    </div>
  );
}

function StatusDot({ status }) {
  const cores = {
    RECEBIDO:   'bg-blue-400',
    EM_PREPARO: 'bg-yellow-400',
    PRONTO:     'bg-green-400',
    ENTREGUE:   'bg-gray-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${cores[status]}`} />;
}

function Card({ sub, agora, onAvancar, loading }) {
  const mesaNum = sub.pedido?.comanda?.mesa?.numero;
  const min = tempo(sub.criadoEm, agora);
  const proximo = STATUS_NEXT[sub.status];

  const estilos = {
    RECEBIDO:   { border: 'border-blue-500',  bg: 'bg-gray-800',   titulo: 'text-blue-400'   },
    EM_PREPARO: { border: 'border-yellow-400', bg: 'bg-gray-800',   titulo: 'text-yellow-400' },
    PRONTO:     { border: 'border-green-400',  bg: 'bg-gray-800',   titulo: 'text-green-400'  },
    ENTREGUE:   { border: 'border-gray-600',   bg: 'bg-gray-900',   titulo: 'text-gray-500'   },
    CANCELADO:  { border: 'border-red-900',    bg: 'bg-gray-900',   titulo: 'text-red-700'    },
  };

  const btnEstilo = {
    RECEBIDO:   'bg-blue-500   hover:bg-blue-400   active:scale-95',
    EM_PREPARO: 'bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-gray-900',
    PRONTO:     'bg-green-500  hover:bg-green-400  active:scale-95',
  };

  const { border, bg, titulo } = estilos[sub.status] || estilos.RECEBIDO;

  return (
    <div className={`rounded-2xl border-2 ${border} ${bg} flex flex-col overflow-hidden transition-all duration-300 ${
      sub.status === 'ENTREGUE' || sub.status === 'CANCELADO' ? 'opacity-40' : ''
    }`}>
      {/* Cabeçalho do card */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <StatusDot status={sub.status} />
          <span className={`font-black text-2xl tracking-tight ${titulo}`}>
            Mesa {mesaNum}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TimerBadge criadoEm={sub.criadoEm} agora={agora} />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            sub.status === 'RECEBIDO'   ? 'bg-blue-500/20 text-blue-300' :
            sub.status === 'EM_PREPARO' ? 'bg-yellow-500/20 text-yellow-300' :
            sub.status === 'PRONTO'     ? 'bg-green-500/20 text-green-300' :
                                          'bg-gray-700 text-gray-400'
          }`}>
            {STATUS_LABEL[sub.status]}
          </span>
        </div>
      </div>

      {/* Itens */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {sub.itens.map((item) => (
          <div key={item.id}>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black ${titulo}`}>{item.quantidade}×</span>
              <span className="text-white font-semibold text-sm">{item.produto.nome}</span>
            </div>
            {item.observacao && (
              <p className="ml-7 text-xs text-yellow-300 mt-0.5 italic">
                ⚠ {item.observacao}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Botão de ação */}
      {proximo && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onAvancar(sub.id, sub.status)}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnEstilo[sub.status]}`}
          >
            {loading ? '...' : BTN_LABEL[sub.status]}
          </button>
        </div>
      )}

      {sub.status === 'ENTREGUE' && (
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-4">
          <CheckCircle2 size={16} />
          Entregue
        </div>
      )}
      {sub.status === 'CANCELADO' && (
        <div className="flex items-center justify-center gap-2 text-red-800 text-sm py-4">
          <span>✕</span>
          Cancelado{sub.motivoCancelamento ? ` — ${sub.motivoCancelamento}` : ''}
        </div>
      )}
    </div>
  );
}

export default function TerminalPage() {
  const { terminalId } = useParams();
  const [terminal, setTerminal]   = useState(null);
  const [subPedidos, setSubPedidos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState('ativo');
  const [novoPing, setNovoPing]   = useState(false);
  const [avancando, setAvancando] = useState(new Set());
  const agora = useAgora();

  const { ativo: somAtivo, ativar: ativarSom, beepTerminal } = useAudioNotificacao();
  const [horaAtual, setHoraAtual] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    return () => clearInterval(id);
  }, []);

  const loadSubPedidos = useCallback(async () => {
    try {
      const { data } = await api.get(`/terminais/${terminalId}/subpedidos`);
      setSubPedidos(data);
    } catch {
      toast.error('Erro ao carregar pedidos');
    }
  }, [terminalId]);

  useEffect(() => {
    async function init() {
      try {
        const { data: terminais } = await api.get('/terminais');
        setTerminal(terminais.find((t) => t.id === terminalId) || null);
      } catch {}
      await loadSubPedidos();
      setLoading(false);
    }
    init();

    socket.connect();
    socket.emit('entrar_terminal', terminalId);

    socket.on('novo_subpedido', (sub) => {
      if (sub.terminalId !== terminalId) return;
      setSubPedidos((prev) => [sub, ...prev]);
      setNovoPing(true);
      setTimeout(() => setNovoPing(false), 2000);
      beepTerminal();
      toast(`🍽️ Novo pedido — Mesa ${sub.pedido?.comanda?.mesa?.numero || '?'}`, {
        duration: 5000,
        style: { background: '#1f2937', color: '#fff', fontWeight: 'bold' },
      });
    });

    socket.on('status_subpedido', (sub) => {
      if (sub.terminalId === terminalId) {
        setSubPedidos((prev) => prev.map((s) => s.id === sub.id ? sub : s));
      }
    });

    return () => {
      socket.off('novo_subpedido');
      socket.off('status_subpedido');
      socket.disconnect();
    };
  }, [terminalId]);

  async function avancarStatus(subId, statusAtual) {
    if (avancando.has(subId)) return;
    setAvancando((prev) => new Set(prev).add(subId));
    try {
      await api.put(`/subpedidos/${subId}/status`, { status: STATUS_NEXT[statusAtual] });
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setAvancando((prev) => { const s = new Set(prev); s.delete(subId); return s; });
    }
  }

  const ativos    = subPedidos.filter((s) => ['RECEBIDO', 'EM_PREPARO', 'PRONTO'].includes(s.status));
  const recebidos = subPedidos.filter((s) => s.status === 'RECEBIDO');
  const emPreparo = subPedidos.filter((s) => s.status === 'EM_PREPARO');
  const prontos   = subPedidos.filter((s) => s.status === 'PRONTO');
  const entregues = subPedidos.filter((s) => s.status === 'ENTREGUE');

  const filtrados = filtro === 'ativo' ? ativos : subPedidos;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
      <Loader2 className="animate-spin text-white" size={36} />
      <p className="text-gray-500 text-sm">Conectando ao terminal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ── */}
      <header
        className="flex items-center gap-4 px-5 py-4 border-b-2"
        style={{ borderColor: terminal?.cor || '#22c55e' }}
      >
        {/* Ícone + nome */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: (terminal?.cor || '#22c55e') + '25' }}
        >
          <ChefHat size={22} style={{ color: terminal?.cor || '#22c55e' }} />
        </div>
        <div>
          <h1 className="font-black text-lg leading-none" style={{ color: terminal?.cor || '#22c55e' }}>
            {terminal?.nome || 'Terminal'}
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Pedidos em tempo real</p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 ml-6">
          <StatPill label="Novos"     count={recebidos.length} cor="bg-blue-500/20  text-blue-300"   />
          <StatPill label="Preparo"   count={emPreparo.length} cor="bg-yellow-500/20 text-yellow-300" />
          <StatPill label="Prontos"   count={prontos.length}   cor="bg-green-500/20 text-green-300"  />
          <StatPill label="Entregues" count={entregues.length} cor="bg-gray-700     text-gray-400"   />
        </div>

        {/* Relógio + filtro */}
        <div className="ml-auto flex items-center gap-3">
          {!somAtivo && (
            <button
              onClick={ativarSom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
            >
              <Bell size={13} /> Ativar som
            </button>
          )}
          {novoPing && (
            <Bell size={18} className="text-yellow-400 animate-bounce" />
          )}
          <span className="text-gray-400 text-sm font-mono hidden sm:block">{horaAtual}</span>

          <div className="flex bg-gray-800 rounded-xl overflow-hidden text-sm">
            <button
              onClick={() => setFiltro('ativo')}
              className={`px-3 py-1.5 font-medium transition-colors ${filtro === 'ativo' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              style={filtro === 'ativo' ? { background: terminal?.cor || '#22c55e' } : {}}
            >
              Ativos ({ativos.length})
            </button>
            <button
              onClick={() => setFiltro('todos')}
              className={`px-3 py-1.5 font-medium transition-colors ${filtro === 'todos' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              style={filtro === 'todos' ? { background: terminal?.cor || '#22c55e' } : {}}
            >
              Todos
            </button>
          </div>
        </div>
      </header>

      {/* ── Colunas de status (se ativo) ── */}
      {filtro === 'ativo' && ativos.length > 0 && (
        <div className="flex gap-1 px-5 py-2 border-b border-gray-800 text-xs overflow-x-auto">
          {[
            { label: '🔵 Novos',    itens: recebidos },
            { label: '🟡 Em preparo', itens: emPreparo },
            { label: '🟢 Prontos',  itens: prontos },
          ].map(({ label, itens }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full flex-shrink-0">
              <span className="text-gray-300">{label}</span>
              <span className="font-bold text-white">{itens.length}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Grade de pedidos ── */}
      <main className="flex-1 p-4 overflow-auto">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-gray-600">
            <Flame size={56} className="mb-4 opacity-20" />
            <p className="text-xl font-semibold opacity-50">Tudo em dia por aqui</p>
            <p className="text-sm opacity-30 mt-1">Aguardando novos pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {filtrados
              .sort((a, b) => {
                const ordem = { RECEBIDO: 0, EM_PREPARO: 1, PRONTO: 2, ENTREGUE: 3 };
                if (ordem[a.status] !== ordem[b.status]) return ordem[a.status] - ordem[b.status];
                return new Date(a.criadoEm) - new Date(b.criadoEm);
              })
              .map((sub) => (
                <Card key={sub.id} sub={sub} agora={agora} onAvancar={avancarStatus} loading={avancando.has(sub.id)} />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatPill({ label, count, cor }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cor}`}>
      <span>{label}</span>
      <span className="font-black">{count}</span>
    </div>
  );
}
