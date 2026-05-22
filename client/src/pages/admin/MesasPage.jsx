import { useEffect, useState } from 'react';
import { Plus, QrCode, Power, Loader2, Grid2X2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function MesasPage() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');
  const [qrModal, setQrModal] = useState(null);

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
      await api.put(`/mesas/${mesa.id}`, { numero: mesa.numero, ativa: !mesa.ativa });
      load();
    } catch { toast.error('Erro'); }
  }

  function openQR(mesa) {
    setQrModal(mesa);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6 space-y-6">
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
              className="mt-1 w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 11"
              autoFocus
            />
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setCriando(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
            <button onClick={criar} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Criar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesas.map((mesa) => {
          const ocupada = mesa.ativa && mesa.comandas?.length > 0;
          return (
            <div
              key={mesa.id}
              className={`bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-3 border-2 transition-all ${
                !mesa.ativa ? 'opacity-50 border-gray-200' :
                ocupada ? 'border-yellow-300' : 'border-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                !mesa.ativa ? 'bg-gray-100 text-gray-400' :
                ocupada ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {mesa.numero}
              </div>
              <span className={`text-xs font-medium ${ocupada ? 'text-yellow-600' : 'text-green-600'}`}>
                {!mesa.ativa ? 'Inativa' : ocupada ? `${mesa.comandas.length} comanda${mesa.comandas.length > 1 ? 's' : ''}` : 'Livre'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => openQR(mesa)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                  title="Ver QR Code"
                >
                  <QrCode size={14} />
                </button>
                <button
                  onClick={() => toggleAtiva(mesa)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                  title={mesa.ativa ? 'Desativar mesa' : 'Ativar mesa'}
                >
                  <Power size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <h2 className="font-bold text-xl">Mesa {qrModal.numero}</h2>
            <p className="text-gray-500 text-sm">QR Code para o cliente escanear</p>
            <img
              src={`/api/mesas/${qrModal.id}/qrcode`}
              alt={`QR Mesa ${qrModal.numero}`}
              className="mx-auto w-52 h-52 border rounded-xl"
            />
            <p className="text-xs text-gray-400 break-all">
              {window.location.origin}/mesa/{qrModal.id}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 border py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                Fechar
              </button>
              <a
                href={`/api/mesas/${qrModal.id}/qrcode`}
                download={`mesa-${qrModal.numero}-qrcode.png`}
                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 flex items-center justify-center gap-1"
              >
                <QrCode size={14} />
                Baixar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
