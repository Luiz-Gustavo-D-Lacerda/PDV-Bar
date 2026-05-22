import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChefHat, ArrowLeft, XCircle, AlertTriangle, Receipt, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const STATUS_LABEL = {
  RECEBIDO:   'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO:     'Pronto para entregar',
  ENTREGUE:   'Entregue',
  CANCELADO:  'Cancelado',
};

const STATUS_ICON = {
  RECEBIDO:   '🕐',
  EM_PREPARO: '🔥',
  PRONTO:     '✅',
  ENTREGUE:   '🙌',
  CANCELADO:  '✕',
};

const STATUS_COLOR = {
  RECEBIDO:   'bg-gray-100 text-gray-600',
  EM_PREPARO: 'bg-amber-100 text-amber-700',
  PRONTO:     'bg-green-100 text-green-700',
  ENTREGUE:   'bg-blue-100 text-blue-700',
  CANCELADO:  'bg-red-100 text-red-500',
};

const FORMA_OPCOES = [
  { key: 'PIX',     label: 'PIX',     icon: '📱', desc: 'Pagamento instantâneo' },
  { key: 'CARTAO',  label: 'Cartão',  icon: '💳', desc: 'Débito ou crédito' },
  { key: 'DINHEIRO',label: 'Dinheiro',icon: '💵', desc: 'Pagamento em espécie' },
];

function ModalPagamento({ total, podeDinheiro, onConfirm, onClose, loading }) {
  const [forma, setForma] = useState(null);
  const opcoes = FORMA_OPCOES.filter((o) => o.key !== 'DINHEIRO' || podeDinheiro);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Fechar conta</h3>
          <p className="text-3xl font-black text-green-600 mt-1">R$ {total}</p>
        </div>
        <p className="text-sm text-gray-500">Selecione a forma de pagamento:</p>
        <div className="space-y-2">
          {opcoes.map(({ key, label, icon, desc }) => (
            <button
              key={key}
              onClick={() => setForma(key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                forma === key
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              {forma === key && (
                <span className="ml-auto w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => forma && onConfirm(forma)}
            disabled={!forma || loading}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCancelar({ sub, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(sub.id, motivo);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Cancelar pedido</h3>
            <p className="text-sm text-gray-500">
              {sub.terminal.nome} · {sub.itens.length} {sub.itens.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ex: demorou para chegar, cliente desistiu..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            Voltar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Cancelar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComandaPage() {
  const { mesaId, comandaId } = useParams();
  const { token, user } = useAuthStore();
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(null);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [loadingPagar, setLoadingPagar] = useState(false);

  const isStaff = !!token;
  const isCaixa = ['ADMIN', 'GERENTE', 'CAIXA'].includes(user?.role);
  const isGarcom = isStaff;

  const podeCancelar =
    token &&
    (user?.role === 'ADMIN' ||
      user?.role === 'GERENTE' ||
      user?.permissoes?.cancelarItens);

  const podeDinheiro =
    ['ADMIN', 'GERENTE'].includes(user?.role) ||
    !!user?.permissoes?.receberDinheiro;

  async function loadComanda() {
    try {
      const { data } = await api.get(`/comandas/${comandaId}`);
      setComanda(data);
    } catch {
      setComanda(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComanda();
    socket.connect();
    socket.emit('entrar_mesa', mesaId);
    socket.on('comanda_atualizada', () => loadComanda());
    socket.on('status_subpedido', () => loadComanda());
    return () => {
      socket.off('comanda_atualizada');
      socket.off('status_subpedido');
      socket.disconnect();
    };
  }, [comandaId]);

  async function confirmarCancelamento(subId, motivo) {
    try {
      await api.post(`/subpedidos/${subId}/cancelar`, { motivo });
      toast.success('Pedido cancelado');
      setCancelando(null);
      loadComanda();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao cancelar');
    }
  }

  async function fecharConta(formaPagamento) {
    setLoadingPagar(true);
    try {
      await api.post(`/comandas/${comanda.id}/fechar`, { formaPagamento });
      toast.success('Conta fechada!');
      setModalPagamento(false);
      loadComanda();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao fechar conta');
    } finally {
      setLoadingPagar(false);
    }
  }

  // Total excluindo cancelados
  const total = comanda?.pedidos?.reduce((sum, ped) =>
    sum + ped.subPedidos.reduce((s2, sub) =>
      sub.status === 'CANCELADO' ? s2 :
      s2 + sub.itens.reduce((s3, it) => s3 + Number(it.precoUnitario) * it.quantidade, 0), 0), 0) || 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600" size={40} />
    </div>
  );

  if (!comanda) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <ChefHat size={48} className="text-gray-300" />
      <h2 className="text-xl font-bold text-gray-700">Comanda não encontrada</h2>
      <Link to={`/mesa/${mesaId}`} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium">
        Voltar à mesa
      </Link>
    </div>
  );

  const statusComanda = comanda.status;
  const paga = statusComanda === 'PAGA';
  const aguardando = statusComanda === 'AGUARDANDO_PAGAMENTO';
  const aberta = statusComanda === 'ABERTA';

  return (
    <div className="min-h-screen bg-gray-50 pb-52">
      {cancelando && (
        <ModalCancelar
          sub={cancelando}
          onConfirm={confirmarCancelamento}
          onClose={() => setCancelando(null)}
        />
      )}
      {modalPagamento && (
        <ModalPagamento
          total={total.toFixed(2).replace('.', ',')}
          podeDinheiro={podeDinheiro}
          onConfirm={fecharConta}
          onClose={() => setModalPagamento(false)}
          loading={loadingPagar}
        />
      )}

      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white px-5 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-40 h-20 bg-white/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <Link to={`/mesa/${mesaId}`} className="flex items-center gap-1.5 text-green-200 text-sm hover:text-white transition-colors">
              <ArrowLeft size={14} /> Voltar
            </Link>
            {token && (
              <Link
                to={user?.role === 'ADMIN' || user?.role === 'GERENTE' ? '/admin' : '/garcom'}
                className="text-green-200 text-xs hover:text-white transition-colors"
              >
                Painel →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black backdrop-blur-sm">
              {comanda.mesa.numero}
            </div>
            <div>
              <p className="text-green-200 text-xs font-medium">Mesa</p>
              <h1 className="text-2xl font-black leading-tight">
                {comanda.nome ? comanda.nome : `Mesa ${comanda.mesa.numero}`}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              paga ? 'bg-green-900/50 text-green-200' :
              aguardando ? 'bg-purple-900/50 text-purple-200' :
              'bg-white/20 text-white'
            }`}>
              <span>{paga ? '✓' : aguardando ? '⏳' : '🍽️'}</span>
              {paga ? 'Pago' : aguardando ? 'Aguardando caixa' : 'Pedido em andamento'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner paga */}
      {paga && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} className="text-green-600" />
          </div>
          <div>
            <p className="font-bold text-green-800">Pagamento confirmado!</p>
            <p className="text-sm text-green-600">Obrigado pela visita. Volte sempre! 🙌</p>
          </div>
        </div>
      )}

      {/* Banner aguardando */}
      {aguardando && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-purple-800">Aguardando pagamento</p>
            <p className="text-sm text-purple-600">O caixa irá confirmar em breve.</p>
          </div>
        </div>
      )}

      {/* Pedidos */}
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {comanda.pedidos.map((pedido, idx) => (
          <div key={pedido.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cabeçalho do pedido */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="font-bold text-gray-700 text-sm">Pedido #{idx + 1}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[pedido.status]}`}>
                <span>{STATUS_ICON[pedido.status]}</span>
                {STATUS_LABEL[pedido.status]}
              </span>
            </div>

            {/* Sub-pedidos */}
            {pedido.subPedidos.map((sub) => {
              const cancelavel = podeCancelar && !['CANCELADO', 'ENTREGUE'].includes(sub.status);
              const isCancelado = sub.status === 'CANCELADO';
              return (
                <div key={sub.id} className={`px-4 py-3 border-b last:border-0 transition-opacity ${isCancelado ? 'opacity-50' : ''}`}>
                  {/* Terminal header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sub.terminal.cor }} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sub.terminal.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[sub.status]}`}>
                        {STATUS_ICON[sub.status]} {STATUS_LABEL[sub.status]}
                      </span>
                      {cancelavel && (
                        <button onClick={() => setCancelando(sub)}
                          className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Cancelar">
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="space-y-1.5 pl-4">
                    {sub.itens.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className={`text-sm text-gray-700 ${isCancelado ? 'line-through' : ''}`}>
                          <span className="font-semibold text-gray-900">{item.quantidade}×</span> {item.produto.nome}
                        </span>
                        <span className={`text-sm font-medium ${isCancelado ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                          R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    {isCancelado && sub.motivoCancelamento && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle size={10} /> {sub.motivoCancelamento}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Rodapé fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-2xl px-4 pt-3 pb-5 space-y-3 max-w-lg mx-auto">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Total da comanda</span>
          <span className="text-2xl font-black text-green-600">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {aberta && (
          <div className="flex gap-2">
            <Link
              to={`/mesa/${mesaId}/cardapio/${comandaId}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-green-600 text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              + Adicionar itens
            </Link>
            {isGarcom && (
              <button
                onClick={() => setModalPagamento(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold text-sm hover:from-gray-800 hover:to-gray-700 transition-all shadow-sm"
              >
                <Receipt size={15} /> Fechar conta
              </button>
            )}
          </div>
        )}

        {!isStaff && aberta && (
          <p className="text-center text-xs text-gray-400">
            Para pagar, chame o garçom.
          </p>
        )}

        {aguardando && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-purple-600 font-medium">
            <Clock size={15} /> Conta solicitada — aguardando o caixa
          </div>
        )}

        {paga && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 font-semibold">
            <CheckCircle2 size={15} /> Comanda encerrada
          </div>
        )}
      </div>
    </div>
  );
}
