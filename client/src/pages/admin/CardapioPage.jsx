import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, ChevronDown, ChevronRight, Star, Upload, X, Tag, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('imagem', file);
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Imagem carregada');
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-600">Imagem do produto</label>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          <div className="relative flex-shrink-0">
            <img src={value} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0">
            <UtensilsCrossed size={24} />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Enviando...' : 'Fazer upload'}
          </button>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ou cole uma URL de imagem..."
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 placeholder:text-gray-300"
          />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

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
          <label className="text-xs font-medium text-gray-600">Categoria</label>
          <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}{!c.ativo ? ' (inativa)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600">Terminal (preparo)</label>
          <select value={form.terminalId} onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {terminais.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <ImageUpload value={form.imagemUrl || ''} onChange={(url) => setForm({ ...form, imagemUrl: url })} />
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
              type="number" min="0"
              value={form.estoqueQtd}
              onChange={(e) => setForm({ ...form, estoqueQtd: e.target.value })}
              placeholder={isEditing ? 'Sem alteração' : 'Ex: 50'}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {isEditing && (
              <p className="text-xs text-gray-400 mt-0.5">Atual: {initial.estoque?.quantidade ?? '—'} un</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Estoque mínimo (alerta)</label>
            <input
              type="number" min="0"
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

function CategoriaForm({ initial, onSave, onCancel }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [ordem, setOrdem] = useState(String(initial?.ordem ?? 0));

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-gray-800 text-sm">{initial ? 'Editar categoria' : 'Nova categoria'}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600">Nome</label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave({ nome, ordem: Number(ordem) })}
            placeholder="Ex: Dia das Mães, Promoção, Carnaval..."
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Ordem</label>
          <input
            type="number" min="0"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">Cancelar</button>
        <button
          onClick={() => nome.trim() && onSave({ nome, ordem: Number(ordem) })}
          disabled={!nome.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

function EstoqueBadge({ estoque }) {
  if (!estoque) return null;
  const qtd = Number(estoque.quantidade);
  const min = Number(estoque.minimo);
  const cor = qtd <= min
    ? 'bg-red-100 text-red-600'
    : qtd <= min * 1.5
    ? 'bg-yellow-100 text-yellow-600'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cor}`}>
      {qtd} un
    </span>
  );
}

export default function CardapioAdminPage() {
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [terminais, setTerminais] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('produtos');

  // Produtos
  const [criandoProduto, setCriandoProduto] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState(null);
  const [expandidas, setExpandidas] = useState({});
  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Categorias
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);

  async function load() {
    try {
      const [catRes, termRes, prodRes] = await Promise.all([
        api.get('/categorias'),
        api.get('/terminais'),
        api.get('/produtos'),
      ]);
      setTodasCategorias(catRes.data);
      setTerminais(termRes.data);
      setProdutos(prodRes.data);
      const exp = {};
      catRes.data.forEach((c) => (exp[c.id] = true));
      setExpandidas((prev) => {
        // preserve existing collapsed state, expand new ones
        const merged = { ...exp };
        Object.keys(prev).forEach((k) => { merged[k] = prev[k]; });
        return merged;
      });
    } catch {
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Produtos ──
  async function criarProduto(form) {
    try {
      await api.post('/produtos', {
        ...form,
        preco: Number(form.preco),
        estoque: form.estoqueQtd !== '' ? Number(form.estoqueQtd) : undefined,
        estoqueMin: form.estoqueMin !== '' ? Number(form.estoqueMin) : undefined,
      });
      toast.success('Produto criado');
      setCriandoProduto(false);
      load();
    } catch { toast.error('Erro ao criar produto'); }
  }

  async function editarProduto(id, form) {
    try {
      await api.put(`/produtos/${id}`, {
        ...form,
        preco: Number(form.preco),
        estoqueMin: form.estoqueMin !== '' ? Number(form.estoqueMin) : undefined,
      });
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

  async function reativarProduto(id) {
    try {
      await api.patch(`/produtos/${id}/ativo`, { ativo: true });
      toast.success('Produto reativado');
      load();
    } catch { toast.error('Erro ao reativar produto'); }
  }

  async function toggleDestaque(id) {
    try {
      const { data } = await api.patch(`/produtos/${id}/destaque`);
      setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, destaque: data.destaque } : p));
    } catch { toast.error('Erro ao atualizar destaque'); }
  }

  // ── Categorias ──
  async function criarCategoria(form) {
    try {
      await api.post('/categorias', form);
      toast.success('Categoria criada');
      setCriandoCategoria(false);
      load();
    } catch (e) { toast.error(e.response?.data?.erro || 'Erro ao criar categoria'); }
  }

  async function editarCategoria(id, form) {
    try {
      await api.put(`/categorias/${id}`, form);
      toast.success('Categoria atualizada');
      setEditandoCategoria(null);
      load();
    } catch (e) { toast.error(e.response?.data?.erro || 'Erro ao atualizar categoria'); }
  }

  async function toggleCategoriaAtivo(cat) {
    try {
      await api.put(`/categorias/${cat.id}`, { ativo: !cat.ativo });
      toast.success(cat.ativo ? 'Categoria desativada' : 'Categoria ativada');
      load();
    } catch (e) { toast.error(e.response?.data?.erro || 'Erro'); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  const produtosPorCategoria = (catId) => {
    let lista = produtos.filter((p) => p.categoriaId === catId);
    if (!mostrarInativos) lista = lista.filter((p) => p.ativo);
    if (busca.trim()) {
      const b = busca.toLowerCase();
      lista = lista.filter((p) =>
        p.nome.toLowerCase().includes(b) || p.descricao?.toLowerCase().includes(b)
      );
    }
    return lista;
  };

  // when searching, show all categories that have matching products
  const categoriasVisiveis = busca.trim()
    ? todasCategorias.filter((c) => produtosPorCategoria(c.id).length > 0)
    : todasCategorias;

  const totalInativos = produtos.filter((p) => !p.ativo).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
          <p className="text-gray-500 text-sm">Gerencie categorias e produtos</p>
        </div>
        <div className="flex gap-2">
          {aba === 'categorias' && (
            <button
              onClick={() => setCriandoCategoria(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={16} /> Nova categoria
            </button>
          )}
          {aba === 'produtos' && (
            <button
              onClick={() => setCriandoProduto(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Plus size={16} /> Novo produto
            </button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'produtos', label: 'Produtos', icon: UtensilsCrossed },
          { id: 'categorias', label: 'Categorias', icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── ABA PRODUTOS ── */}
      {aba === 'produtos' && (
        <div className="space-y-4">
          {criandoProduto && (
            <ProdutoForm
              categorias={todasCategorias}
              terminais={terminais}
              onSave={criarProduto}
              onCancel={() => setCriandoProduto(false)}
            />
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {totalInativos > 0 && (
              <button
                onClick={() => setMostrarInativos((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  mostrarInativos
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <RotateCcw size={13} />
                Inativos ({totalInativos})
              </button>
            )}
          </div>

          {categoriasVisiveis.map((cat) => {
            const prods = produtosPorCategoria(cat.id);
            const isExpanded = expandidas[cat.id] ?? true;
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandidas((e) => ({ ...e, [cat.id]: !e[cat.id] }))}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
                >
                  <UtensilsCrossed size={18} className="text-gray-400" />
                  <span className={`font-semibold ${cat.ativo ? 'text-gray-800' : 'text-gray-400'}`}>{cat.nome}</span>
                  {!cat.ativo && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Categoria inativa</span>
                  )}
                  <span className="text-xs text-gray-400 ml-1">({prods.length} produto{prods.length !== 1 ? 's' : ''})</span>
                  <span className="ml-auto">
                    {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {prods.length === 0 && (
                      <p className="text-gray-400 text-sm p-4">Nenhum produto nesta categoria</p>
                    )}
                    {prods.map((prod) => (
                      <div key={prod.id}>
                        {editandoProduto === prod.id ? (
                          <div className="p-4">
                            <ProdutoForm
                              initial={{ ...prod, preco: String(prod.preco), estoqueQtd: '', estoqueMin: prod.estoque?.minimo != null ? String(prod.estoque.minimo) : '' }}
                              categorias={todasCategorias}
                              terminais={terminais}
                              onSave={(f) => editarProduto(prod.id, f)}
                              onCancel={() => setEditandoProduto(null)}
                            />
                          </div>
                        ) : (
                          <div className={`flex items-center gap-4 p-4 border-t first:border-t-0 hover:bg-gray-50 ${!prod.ativo ? 'opacity-60' : ''}`}>
                            {prod.imagemUrl ? (
                              <img src={prod.imagemUrl} alt={prod.nome} className="w-14 h-14 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-lg">🍽️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-900">{prod.nome}</p>
                                {prod.destaque && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                    <Star size={10} className="fill-yellow-500 text-yellow-500" /> Destaque
                                  </span>
                                )}
                                {!prod.ativo && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inativo</span>}
                                <EstoqueBadge estoque={prod.estoque} />
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
                              {prod.ativo ? (
                                <>
                                  <button
                                    onClick={() => toggleDestaque(prod.id)}
                                    title={prod.destaque ? 'Remover destaque' : 'Marcar como especial do dia'}
                                    className={`p-2 rounded-lg transition-colors ${prod.destaque ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-100 hover:text-yellow-400'}`}
                                  >
                                    <Star size={15} className={prod.destaque ? 'fill-yellow-500' : ''} />
                                  </button>
                                  <button onClick={() => setEditandoProduto(prod.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <Pencil size={15} />
                                  </button>
                                  <button onClick={() => desativarProduto(prod.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => reativarProduto(prod.id)}
                                  title="Reativar produto"
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium"
                                >
                                  <RotateCcw size={12} /> Reativar
                                </button>
                              )}
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

          {categoriasVisiveis.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* ── ABA CATEGORIAS ── */}
      {aba === 'categorias' && (
        <div className="space-y-3">
          {criandoCategoria && (
            <CategoriaForm
              onSave={criarCategoria}
              onCancel={() => setCriandoCategoria(false)}
            />
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {todasCategorias.length === 0 && (
              <p className="text-gray-400 text-sm p-6 text-center">Nenhuma categoria cadastrada</p>
            )}
            {todasCategorias.map((cat) => (
              <div key={cat.id}>
                {editandoCategoria === cat.id ? (
                  <div className="p-4">
                    <CategoriaForm
                      initial={cat}
                      onSave={(f) => editarCategoria(cat.id, f)}
                      onCancel={() => setEditandoCategoria(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 flex-shrink-0">
                      <Tag size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${cat.ativo ? 'text-gray-900' : 'text-gray-400'}`}>{cat.nome}</p>
                        {!cat.ativo && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inativa</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cat._count?.produtos ?? 0} produto(s) · ordem {cat.ordem}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleCategoriaAtivo(cat)}
                        title={cat.ativo ? 'Desativar' : 'Ativar'}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                          cat.ativo
                            ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {cat.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => setEditandoCategoria(cat.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 px-1">
            Categorias inativas não aparecem no cardápio do cliente. Use isso para criar categorias sazonais (eventos, promoções) e ativar apenas quando precisar.
          </p>
        </div>
      )}
    </div>
  );
}
