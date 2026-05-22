import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Plus, Loader2, ArrowUp, ArrowDown, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function MovModal({ estoque, onClose, onSuccess }) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!quantidade) return;
    setSaving(true);
    try {
      await api.post(`/estoque/${estoque.produtoId}/movimentacao`, {
        tipo, quantidade: Number(quantidade), motivo,
      });
      toast.success('Movimentação registrada');
      onSuccess();
    } catch { toast.error('Erro ao registrar'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg">Movimentação — {estoque.produto.nome}</h2>
        <div>
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <div className="flex gap-2 mt-2">
            {['ENTRADA', 'SAIDA', 'AJUSTE'].map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipo === t ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'ENTRADA' ? 'Entrada' : t === 'SAIDA' ? 'Saída' : 'Ajuste'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            {tipo === 'AJUSTE' ? 'Nova quantidade' : 'Quantidade'}
          </label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Motivo (opcional)</label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ex: reposição semanal"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border py-2 rounded-xl text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EstoquePage() {
  const [estoques, setEstoques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movModal, setMovModal] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  async function load() {
    try {
      const { data } = await api.get('/estoque');
      setEstoques(data);
    } catch {
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtrados = estoques.filter((e) => {
    if (filtro === 'alerta') return e.quantidade <= e.minimo;
    return true;
  });

  const alertas = estoques.filter((e) => e.quantidade <= e.minimo).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500 text-sm">Controle de estoque dos produtos</p>
        </div>
        {alertas > 0 && (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-xl text-sm font-medium">
            <AlertTriangle size={16} />
            {alertas} alerta{alertas > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {['todos', 'alerta'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'todos' ? 'Todos' : `Alertas (${alertas})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Produto</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Terminal</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Qtd</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Mínimo</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => {
              const alerta = e.quantidade <= e.minimo;
              return (
                <tr key={e.id} className={`border-b last:border-0 hover:bg-gray-50 ${alerta ? 'bg-orange-50' : ''}`}>
                  <td className="p-4">
                    <p className="font-medium text-gray-900 text-sm">{e.produto.nome}</p>
                    <p className="text-xs text-gray-400">{e.produto.categoria?.nome}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: e.produto.terminal?.cor }} />
                      <span className="text-sm text-gray-600">{e.produto.terminal?.nome}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold text-lg ${alerta ? 'text-orange-600' : 'text-gray-900'}`}>
                      {e.quantidade}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-gray-500">{e.minimo}</td>
                  <td className="p-4 text-center">
                    {alerta ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                        <AlertTriangle size={11} />
                        Baixo
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">OK</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setMovModal(e)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mx-auto"
                      title="Registrar movimentação"
                    >
                      <Sliders size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {movModal && (
        <MovModal
          estoque={movModal}
          onClose={() => setMovModal(null)}
          onSuccess={() => { setMovModal(null); load(); }}
        />
      )}
    </div>
  );
}
