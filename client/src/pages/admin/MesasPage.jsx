import { useEffect, useState } from 'react';
import { Plus, QrCode, Power, Loader2, Pencil, Trash2, Check, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const STATUS_MESA = {
  livre:      { label: 'Livre',           dot: 'bg-green-400',  ring: 'border-gray-100',    bg: 'bg-white',       badge: 'bg-green-100 text-green-700'   },
  ocupada:    { label: 'Ocupada',          dot: 'bg-yellow-400', ring: 'border-yellow-300',  bg: 'bg-white',       badge: 'bg-yellow-100 text-yellow-700'  },
  pronto:     { label: 'Pronto!',          dot: 'bg-blue-500',   ring: 'border-blue-400',    bg: 'bg-blue-50',     badge: 'bg-blue-100 text-blue-700'      },
  aguardando: { label: 'Aguard. pgto',    dot: 'bg-purple-400', ring: 'border-purple-300',  bg: 'bg-purple-50',   badge: 'bg-purple-100 text-purple-700'  },
};

function getMesaStatus(mesa) {
  const comandas = mesa.comandas || [];
  if (comandas.length === 0) return 'livre';
  if (comandas.some((c) => c.status === 'AGUARDANDO_PAGAMENTO')) return 'aguardando';
  if (comandas.some((c) => c.pedidos?.some((p) => p.status === 'PRONTO'))) return 'pronto';
  return 'ocupada';
}

function QRModal({ mesa, onClose }) {
  const qrUrl = `${import.meta.env.VITE_API_URL || ''}/api/mesas/${mesa.id}/qrcode`;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
        <h2 className="font-bold text-xl">Mesa {mesa.numero}</h2>
        <p className="text-gray-500 text-sm">QR Code para o cliente escanear</p>
        <img
          src={qrUrl}
          alt={`QR Mesa ${mesa.numero}`}
          className="mx-auto w-52 h-52 border rounded-xl"
        />
        <p className="text-xs text-gray-400 break-all">
          {window.location.origin}/mesa/{mesa.id}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-xl text-sm hover:bg-gray-50"
          >
            Fechar
          </button>
          <a
            href={qrUrl}
            download={`mesa-${mesa.numero}-qrcode.png`}
            className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 flex items-center justify-center gap-1"
          >
            <Download size={14} />
            Baixar
          </a>
        </div>
      </div>
    </div>
  );
}

function EditNumeroInline({ mesa, onSave, onCancel }) {
  const [valor, setValor] = useState(String(mesa.numero));

  function handleSave() {
    const n = Number(valor);
    if (!n || n < 1) return toast.error('Número inválido');
    onSave(n);
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="number"
        min="1"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
        className="w-16 text-center border rounded-lg text-sm py-1 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
      />
      <button onClick={handleSave} className="p-1 rounded-lg text-green-600 hover:bg-green-50">
        <Check size={14} />
      </button>
      <button onClick={onCancel} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function MesasPage() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [editando, setEditando] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/mesas');
      setMesas(data);
    } catch {
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function criar() {
    if (!novoNumero) return;
    try {
      await api.post('/mesas', { numero: Number(novoNumero) });
      toast.success('Mesa criada');
      setCriando(false);
      setNovoNumero('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao criar mesa');
    }
  }

  async function toggleAtiva(mesa) {
    try {
      await api.put(`/mesas/${mesa.id}`, { ativa: !mesa.ativa });
      toast.success(mesa.ativa ? 'Mesa desativada' : 'Mesa ativada');
      load();
    } catch { toast.error('Erro'); }
  }

  async function salvarNumero(mesa, numero) {
    try {
      await api.put(`/mesas/${mesa.id}`, { numero });
      toast.success('Número atualizado');
      setEditando(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao atualizar');
    }
  }

  async function excluir(mesa) {
    if (!confirm(`Excluir mesa ${mesa.numero}? Isso é irreversível.`)) return;
    try {
      await api.delete(`/mesas/${mesa.id}`);
      toast.success('Mesa excluída');
      load();
    } catch (e) {
      toast.error(e.response?.data?.erro || 'Erro ao excluir');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  const ativas   = mesas.filter((m) => m.ativa);
  const inativas = mesas.filter((m) => !m.ativa);

  const ocupadas   = ativas.filter((m) => getMesaStatus(m) !== 'livre').length;
  const prontas    = ativas.filter((m) => getMesaStatus(m) === 'pronto').length;
  const aguardando = ativas.filter((m) => getMesaStatus(m) === 'aguardando').length;

  return (
    <div className="p-6 space-y-6">
      {qrModal && <QRModal mesa={qrModal} onClose={() => setQrModal(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500 text-sm">Gerencie as mesas e gere QR Codes</p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} />
          Nova mesa
        </button>
      </div>

      {criando && (
        <div className="bg-gray-50 border rounded-xl p-4 flex items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Número da mesa</label>
            <input
              type="number"
              value={novoNumero}
              onChange={(e) => setNovoNumero(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && criar()}
              className="mt-1 w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 11"
              autoFocus
            />
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => { setCriando(false); setNovoNumero(''); }} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
            <button onClick={criar} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Criar</button>
          </div>
        </div>
      )}

      {/* Resumo */}
      {ativas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ativas',    valor: ativas.length,  cor: 'bg-gray-100 text-gray-700'       },
            { label: 'Ocupadas',  valor: ocupadas,        cor: 'bg-yellow-100 text-yellow-700'   },
            { label: 'Prontas',   valor: prontas,         cor: prontas   > 0 ? 'bg-blue-100 text-blue-700'   : 'bg-gray-100 text-gray-400' },
            { label: 'Pgto',      valor: aguardando,      cor: aguardando > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400' },
          ].map(({ label, valor, cor }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${cor}`}>
              <p className="text-2xl font-black">{valor}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mesas ativas */}
      {ativas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mesas ativas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {ativas.map((mesa) => {
              const status = getMesaStatus(mesa);
              const { label, dot, ring, bg, badge } = STATUS_MESA[status];
              const nComandas = mesa.comandas?.length || 0;
              return (
                <div
                  key={mesa.id}
                  className={`${bg} rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 border-2 ${ring} transition-all`}
                >
                  {/* Número */}
                  <div className="relative w-full flex justify-center">
                    {editando === mesa.id ? (
                      <EditNumeroInline
                        mesa={mesa}
                        onSave={(n) => salvarNumero(mesa, n)}
                        onCancel={() => setEditando(null)}
                      />
                    ) : (
                      <div className="relative">
                        <span className="text-3xl font-black text-gray-800">{mesa.numero}</span>
                        <span className={`absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full ${dot}`} />
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  {editando !== mesa.id && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                      {label}
                    </span>
                  )}

                  {/* Contagem de comandas */}
                  {nComandas > 0 && editando !== mesa.id && (
                    <span className="text-xs text-gray-400">
                      {nComandas} comanda{nComandas > 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Ações */}
                  {editando !== mesa.id && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => setQrModal(mesa)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Ver QR Code"
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        onClick={() => setEditando(mesa.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Editar número"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleAtiva(mesa)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                        title="Desativar mesa"
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mesas inativas */}
      {inativas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Mesas inativas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {inativas.map((mesa) => (
              <div
                key={mesa.id}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 border-2 border-gray-100 opacity-50"
              >
                <span className="text-3xl font-black text-gray-400">{mesa.numero}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativa</span>
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => setQrModal(mesa)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                    title="Ver QR Code"
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    onClick={() => toggleAtiva(mesa)}
                    className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600"
                    title="Reativar mesa"
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => excluir(mesa)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    title="Excluir mesa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mesas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <QrCode size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma mesa cadastrada</p>
          <p className="text-xs mt-1">Crie a primeira mesa para começar</p>
        </div>
      )}

      {/* Legenda */}
      {ativas.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          {Object.entries(STATUS_MESA).map(([key, { label, dot }]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
