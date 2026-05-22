import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Monitor, ExternalLink, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const ICONES = ['ChefHat', 'GlassWater', 'Flame', 'Coffee', 'Pizza', 'Cake', 'Beer', 'UtensilsCrossed'];
const CORES = ['#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#22C55E'];

function TerminalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { nome: '', cor: '#3B82F6', icone: 'ChefHat', ordem: 0 });

  return (
    <div className="bg-gray-50 border rounded-xl p-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Nome</label>
        <input
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ex: Bar, Cozinha 1..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Cor</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, cor: c })}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${form.cor === c ? 'scale-125 border-gray-800' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Ordem</label>
        <input
          type="number"
          value={form.ordem}
          onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
          className="mt-1 w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Salvar</button>
      </div>
    </div>
  );
}

export default function TerminaisPage() {
  const [terminais, setTerminais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/terminais');
      setTerminais(data);
    } catch {
      toast.error('Erro ao carregar terminais');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function criar(form) {
    try {
      await api.post('/terminais', form);
      toast.success('Terminal criado');
      setCriando(false);
      load();
    } catch { toast.error('Erro ao criar terminal'); }
  }

  async function editar(id, form) {
    try {
      await api.put(`/terminais/${id}`, form);
      toast.success('Terminal atualizado');
      setEditando(null);
      load();
    } catch { toast.error('Erro ao atualizar terminal'); }
  }

  async function desativar(id) {
    if (!confirm('Desativar este terminal?')) return;
    try {
      await api.delete(`/terminais/${id}`);
      toast.success('Terminal desativado');
      load();
    } catch { toast.error('Erro'); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminais</h1>
          <p className="text-gray-500 text-sm">Gerencie os terminais de preparo</p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} />
          Novo terminal
        </button>
      </div>

      {criando && <TerminalForm onSave={criar} onCancel={() => setCriando(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {terminais.map((t) => (
          <div key={t.id}>
            {editando === t.id ? (
              <TerminalForm initial={t} onSave={(f) => editar(t.id, f)} onCancel={() => setEditando(null)} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* Faixa colorida do terminal */}
                <div className="h-2" style={{ background: t.cor }} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: t.cor + '18' }}
                    >
                      <ChefHat size={22} style={{ color: t.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{t.nome}</p>
                        {!t.ativo && (
                          <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Inativo</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: t.cor }} />
                        <span className="text-xs text-gray-400">Ordem: {t.ordem}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 mt-4">
                    {/* Abrir terminal */}
                    <Link
                      to={`/terminal/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ background: t.cor }}
                    >
                      <Monitor size={15} />
                      Abrir terminal
                      <ExternalLink size={12} className="opacity-70" />
                    </Link>

                    {/* Editar */}
                    <button
                      onClick={() => setEditando(t.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Desativar */}
                    <button
                      onClick={() => desativar(t.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      title="Desativar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
