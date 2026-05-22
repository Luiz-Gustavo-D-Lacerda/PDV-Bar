import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Monitor, ExternalLink, ChefHat, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const CORES = ['#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#22C55E'];

function TerminalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { nome: '', cor: '#3B82F6', ordem: 0 });
  const [erro, setErro] = useState('');

  function handleSalvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setErro('');
    onSave({ ...form, nome: form.nome.trim() });
  }

  return (
    <div className="bg-gray-50 border rounded-xl p-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Nome</label>
        <input
          autoFocus
          value={form.nome}
          onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErro(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
          className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${erro ? 'border-red-400' : ''}`}
          placeholder="Ex: Bar, Cozinha 1..."
        />
        {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
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
          <input
            type="color"
            value={form.cor}
            onChange={(e) => setForm({ ...form, cor: e.target.value })}
            className="w-8 h-8 rounded-full cursor-pointer border border-gray-200 p-0.5"
            title="Cor personalizada"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Ordem</label>
        <input
          type="number"
          min="0"
          value={form.ordem}
          onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
          className="mt-1 w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
        <button onClick={handleSalvar} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Salvar</button>
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
    if (!confirm('Desativar este terminal? Ele não aparecerá mais no cardápio.')) return;
    try {
      await api.delete(`/terminais/${id}`);
      toast.success('Terminal desativado');
      load();
    } catch { toast.error('Erro'); }
  }

  async function reativar(id) {
    try {
      await api.put(`/terminais/${id}`, { ativo: true });
      toast.success('Terminal reativado');
      load();
    } catch { toast.error('Erro ao reativar'); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  const ativos   = terminais.filter((t) => t.ativo);
  const inativos = terminais.filter((t) => !t.ativo);

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

      {/* Terminais ativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ativos.map((t) => (
          <div key={t.id}>
            {editando === t.id ? (
              <TerminalForm initial={t} onSave={(f) => editar(t.id, f)} onCancel={() => setEditando(null)} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
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
                      <p className="font-semibold text-gray-900">{t.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: t.cor }} />
                        <span className="text-xs text-gray-400">Ordem: {t.ordem}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
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
                    <button
                      onClick={() => setEditando(t.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
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

      {/* Terminais inativos */}
      {inativos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Terminais inativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inativos.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 opacity-50">
                <div className="h-2" style={{ background: t.cor }} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <ChefHat size={22} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-500">{t.nome}</p>
                      <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inativo</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => reativar(t.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <RotateCcw size={14} />
                      Reativar terminal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {terminais.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Monitor size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum terminal cadastrado</p>
          <p className="text-xs mt-1">Crie ao menos um terminal (Ex: Bar, Cozinha)</p>
        </div>
      )}
    </div>
  );
}
