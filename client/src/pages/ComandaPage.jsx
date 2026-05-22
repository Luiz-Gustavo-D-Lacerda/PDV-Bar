import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChefHat, ArrowLeft, XCircle, AlertTriangle, Receipt, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../lib/socket';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_COLOR = {
  RECEBIDO: 'bg-gray-100 text-gray-600',
  EM_PREPARO: 'bg-yellow-100 text-yellow-700',
  PRONTO: 'bg-green-100 text-green-700',
  ENTREGUE: 'bg-blue-100 text-blue-700',
  CANCELADO: 'bg-red-100 text-red-600',
};

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
  const [loadingPagar, setLoadingPagar] = useState(false);

  const isStaff = !!token;
  const isCaixa = ['ADMIN', 'GERENTE', 'CAIXA'].includes(user?.role);
  const isGarcom = isStaff;

  const podeCancelar =
    token &&
    (user?.role === 'ADMIN' ||
      user?.role === 'GERENTE' ||
      user?.permissoes?.cancelarItens);

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

  async function pedirConta() {
    try {
      setLoadingPagar(true);
      await api.post(`/comandas/${comanda.id}/fechar`);
      toast.success('Conta solicitada!');
      loadComanda();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao solicitar conta');
    } finally {
      setLoadingPagar(false);
    }
  }

  async function confirmarPagamento() {
    try {
      setLoadingPagar(true);
      await api.post(`/comandas/${comanda.id}/pagar`);
      toast.success('Pagamento confirmado!');
      loadComanda();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao confirmar pagamento');
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

      {/* Header */}
      <div className="bg-green-700 text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <Link to={`/mesa/${mesaId}`} className="flex items-center gap-1 text-green-200 text-sm hover:text-white">
            <ArrowLeft size={14} /> Mesa
          </Link>
          {token && (
            <Link
              to={user?.role === 'ADMIN' || user?.role === 'GERENTE' ? '/admin' : '/garcom'}
              className="flex items-center gap-1 text-green-200 text-xs hover:text-white"
            >
              Painel <ArrowLeft size={12} className="rotate-180" />
            </Link>
          )}
        </div>
        <h1 className="font-bold text-xl">Mesa {comanda.mesa.numero}</h1>
        <p className="text-green-200 text-sm">Acompanhe seu pedido</p>
      </div>

      {/* Banner comanda paga */}
      {paga && (
        <div className="m-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800">Pagamento confirmado!</p>
            <p className="text-sm text-green-600">Obrigado pela visita. Volte sempre!</p>
          </div>
        </div>
      )}

      {/* Banner aguardando pagamento */}
      {aguardando && (
        <div className="m-4 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={24} className="text-purple-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-purple-800">Aguardando pagamento</p>
            <p className="text-sm text-purple-600">O caixa irá confirmar em breve.</p>
          </div>
        </div>
      )}

      {/* Pedidos */}
      <div className="p-4 space-y-4">
        {comanda.pedidos.map((pedido, idx) => (
          <div key={pedido.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <span className="font-semibold text-gray-700">Pedido #{idx + 1}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[pedido.status]}`}>
                {STATUS_LABEL[pedido.status]}
              </span>
            </div>
            {pedido.subPedidos.map((sub) => {
              const cancelavel = podeCancelar && !['CANCELADO', 'ENTREGUE'].includes(sub.status);
              return (
                <div key={sub.id} className={`p-4 border-b last:border-0 ${sub.status === 'CANCELADO' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: sub.terminal.cor }} />
                      <span className="text-sm font-medium text-gray-600">{sub.terminal.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[sub.status]}`}>
                        {STATUS_LABEL[sub.status]}
                      </span>
                      {cancelavel && (
                        <button onClick={() => setCancelando(sub)}
                          className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Cancelar este pedido">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {sub.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5 ml-4">
                      <span className={`text-gray-700 ${sub.status === 'CANCELADO' ? 'line-through' : ''}`}>
                        {item.quantidade}x {item.produto.nome}
                      </span>
                      <span className="text-gray-500">
                        R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                  {sub.status === 'CANCELADO' && sub.motivoCancelamento && (
                    <p className="mt-1.5 ml-4 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle size={11} /> {sub.motivoCancelamento}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Rodapé fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl p-4 space-y-3">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total da comanda</span>
          <span className="text-xl font-bold text-green-600">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Ações conforme status */}
        {aberta && (
          <>
            <Link to={`/mesa/${mesaId}/cardapio/${comandaId}`}
              className="block text-center bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors">
              Adicionar mais itens
            </Link>

            {/* Pedir a conta — garçom autenticado */}
            {isGarcom && (
              <button onClick={pedirConta} disabled={loadingPagar}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loadingPagar ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                Pedir a conta
              </button>
            )}

            {/* Mensagem para cliente não autenticado */}
            {!isStaff && (
              <p className="text-center text-sm text-gray-500 py-1">
                Para pagar, chame o garçom ou vá ao caixa.
              </p>
            )}
          </>
        )}

        {aguardando && (
          <>
            {isCaixa ? (
              <button onClick={confirmarPagamento} disabled={loadingPagar}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                {loadingPagar ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmar pagamento
              </button>
            ) : (
              <div className="text-center text-sm text-purple-600 font-medium py-1">
                Conta solicitada — aguardando o caixa
              </div>
            )}
          </>
        )}

        {paga && (
          <div className="text-center text-green-600 font-semibold py-1">
            Comanda encerrada ✓
          </div>
        )}
      </div>
    </div>
  );
}
