import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function ProdutoForm({ initial, categorias, terminais, onSave, onCancel }) {
  const isEditing = !!initial;
  const [form, setForm] = useState(initial || {
    nome: '', descricao: '', preco: '', imagemUrl: '',
    categoriaId: categorias[0]?.id || '',
    terminalId: terminais[0]?.id || '',
    estoqueQtd: '',
    estoqueMin: '5',
  });

  return (
    <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600">Descrição</label>
          <input value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Preço (R$)</label>
          <input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">URL da Imagem</label>
          <input value={form.imagemUrl || ''} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Categoria</label>
          <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Terminal (preparo)</label>
          <select value={form.terminalId} onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {terminais.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Estoque */}
      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estoque</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">
              {isEditing ? 'Quantidade atual' : 'Quantidade inicial'}
            </label>
            <input
              type="number"
              min="0"
              value={form.estoqueQtd}
              onChange={(e) => setForm({ ...form, estoqueQtd: e.target.value })}
              placeholder={isEditing ? 'Sem alteração' : 'Ex: 50'}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {isEditing && (
              <p className="text-xs text-gray-400 mt-0.5">
                Atual: {initial.estoque?.quantidade ?? '—'} un
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Estoque mínimo (alerta)</label>
            <input
              type="number"
              min="0"
              value={form.estoqueMin}
              onChange={(e) => setForm({ ...form, estoqueMin: e.target.value })}
              placeholder="5"
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Salvar</button>
      </div>
    </div>
  );
}

export default function CardapioPage() {
  const [categorias, setCategorias] = useState([]);
  const [terminais, setTerminais] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criandoProduto, setCriandoProduto] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState(null);
  const [expandidas, setExpandidas] = useState({});

  async function load() {
    try {
      const [catRes, termRes, prodRes] = await Promise.all([
        api.get('/cardapio'),
        api.get('/terminais'),
        api.get('/produtos'),
      ]);
      setCategorias(catRes.data);
      setTerminais(termRes.data);
      setProdutos(prodRes.data);
      const exp = {};
      catRes.data.forEach((c) => (exp[c.id] = true));
      setExpandidas(exp);
    } catch {
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function criarProduto(form) {
    try {
      const payload = {
        ...form,
        preco: Number(form.preco),
        estoque: form.estoqueQtd !== '' ? Number(form.estoqueQtd) : undefined,
        estoqueMin: form.estoqueMin !== '' ? Number(form.estoqueMin) : undefined,
      };
      await api.post('/produtos', payload);
      toast.success('Produto criado');
      setCriandoProduto(false);
      load();
    } catch { toast.error('Erro ao criar produto'); }
  }

  async function editarProduto(id, form) {
    try {
      await api.put(`/produtos/${id}`, { ...form, preco: Number(form.preco) });

      // Atualiza estoque se informado
      if (form.estoqueQtd !== '' && form.estoqueQtd !== undefined) {
        const prod = produtos.find((p) => p.id === id);
        if (prod?.estoque) {
          await api.post(`/estoque/${id}/movimentacao`, {
            tipo: 'AJUSTE',
            quantidade: Number(form.estoqueQtd),
            motivo: 'Ajuste pelo cardápio',
          });
        }
      }

      toast.success('Produto atualizado');
      setEditandoProduto(null);
      load();
    } catch { toast.error('Erro ao atualizar produto'); }
  }

  async function desativarProduto(id) {
    if (!confirm('Desativar produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto desativado');
      load();
    } catch { toast.error('Erro'); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  const produtosPorCategoria = (catId) => produtos.filter((p) => p.categoriaId === catId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
          <p className="text-gray-500 text-sm">Gerencie categorias e produtos</p>
        </div>
        <button
          onClick={() => setCriandoProduto(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      {criandoProduto && (
        <ProdutoForm
          categorias={categorias}
          terminais={terminais}
          onSave={criarProduto}
          onCancel={() => setCriandoProduto(false)}
        />
      )}

      {categorias.map((cat) => {
        const prods = produtosPorCategoria(cat.id);
        return (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandidas((e) => ({ ...e, [cat.id]: !e[cat.id] }))}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
            >
              <UtensilsCrossed size={18} className="text-gray-400" />
              <span className="font-semibold text-gray-800">{cat.nome}</span>
              <span className="text-xs text-gray-400 ml-1">({prods.length} produtos)</span>
              <span className="ml-auto">
                {expandidas[cat.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </span>
            </button>

            {expandidas[cat.id] && (
              <div className="border-t">
                {prods.length === 0 && (
                  <p className="text-gray-400 text-sm p-4">Nenhum produto nesta categoria</p>
                )}
                {prods.map((prod) => (
                  <div key={prod.id}>
                    {editandoProduto === prod.id ? (
                      <div className="p-4">
                        <ProdutoForm
                          initial={{
                            ...prod,
                            preco: String(prod.preco),
                            estoqueQtd: '',
                            estoqueMin: String(prod.estoque?.minimo ?? 5),
                          }}
                          categorias={categorias}
                          terminais={terminais}
                          onSave={(f) => editarProduto(prod.id, f)}
                          onCancel={() => setEditandoProduto(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 border-t first:border-t-0 hover:bg-gray-50">
                        {prod.imagemUrl ? (
                          <img src={prod.imagemUrl} alt={prod.nome} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-lg">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{prod.nome}</p>
                            {!prod.ativo && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inativo</span>}
                          </div>
                          {prod.descricao && <p className="text-xs text-gray-500 mt-0.5 truncate">{prod.descricao}</p>}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-green-600 font-semibold text-sm">
                              R$ {Number(prod.preco).toFixed(2).replace('.', ',')}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ background: prod.terminal?.cor }} />
                              <span className="text-xs text-gray-500">{prod.terminal?.nome}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditandoProduto(prod.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => desativarProduto(prod.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
