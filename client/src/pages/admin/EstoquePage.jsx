import { useEffect, useState, useCallback, Fragment } from 'react';
import {
  Package, AlertTriangle, Loader2, Search, ChevronDown, ChevronUp,
  Plus, Sliders, Pencil, Trash2, Printer, Copy, Check, ShoppingCart, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ─── constantes ──────────────────────────────────────────────────────────────

const SETORES      = ['GERAL', 'BAR', 'COZINHA'];
const SETOR_LABEL  = { GERAL: 'Geral', BAR: 'Bar', COZINHA: 'Cozinha' };
const SETOR_COR    = { GERAL: 'bg-gray-100 text-gray-600', BAR: 'bg-blue-100 text-blue-700', COZINHA: 'bg-orange-100 text-orange-700' };
const UNIDADES     = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'dz', 'fardo', 'pct'];
const TIPO_LABEL   = { ENTRADA: '▲ Entrada', SAIDA: '▼ Saída', AJUSTE: '≈ Ajuste' };
const TIPO_COR     = { ENTRADA: 'text-green-600', SAIDA: 'text-red-600', AJUSTE: 'text-blue-600' };

// ─── modal de movimentação (produtos do cardápio) ─────────────────────────────

function MovProdutoModal({ estoque, onClose, onSuccess }) {
  const [tipo, setTipo]       = useState('ENTRADA');
  const [quantidade, setQtd]  = useState('');
  const [motivo, setMotivo]   = useState('');
  const [saving, setSaving]   = useState(false);

  async function salvar() {
    if (!quantidade) return;
    setSaving(true);
    try {
      await api.post(`/estoque/${estoque.produtoId}/movimentacao`, { tipo, quantidade: Number(quantidade), motivo });
      toast.success('Movimentação registrada');
      onSuccess();
    } catch { toast.error('Erro ao registrar'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg">Movimentação — {estoque.produto.nome}</h2>
        <TipoSelector value={tipo} onChange={setTipo} />
        <Campo label={tipo === 'AJUSTE' ? 'Nova quantidade' : 'Quantidade'} type="number" value={quantidade} onChange={setQtd} />
        <Campo label="Motivo (opcional)" value={motivo} onChange={setMotivo} placeholder="Ex: reposição semanal" />
        <BotoesModal onClose={onClose} onSave={salvar} saving={saving} />
      </div>
    </div>
  );
}

// ─── modal de criar / editar insumo ──────────────────────────────────────────

function InsumoFormModal({ insumo, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nome:    insumo?.nome    ?? '',
    unidade: insumo?.unidade ?? 'un',
    minimo:  insumo?.minimo  ?? 0,
    setor:   insumo?.setor   ?? 'GERAL',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.nome.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      insumo
        ? await api.put(`/insumos/${insumo.id}`, form)
        : await api.post('/insumos', { ...form, quantidade: 0 });
      toast.success(insumo ? 'Insumo atualizado' : 'Insumo criado');
      onSuccess();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg">{insumo ? 'Editar insumo' : 'Novo insumo'}</h2>
        <Campo label="Nome" value={form.nome} onChange={(v) => set('nome', v)} placeholder="Ex: Vodka, Óleo, Carvão..." />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Unidade</label>
            <select value={form.unidade} onChange={(e) => set('unidade', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {UNIDADES.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <Campo label="Mínimo" type="number" value={form.minimo} onChange={(v) => set('minimo', Number(v))} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Setor</label>
          <div className="flex gap-2 mt-2">
            {SETORES.map((s) => (
              <button key={s} onClick={() => set('setor', s)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.setor === s ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {SETOR_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <BotoesModal onClose={onClose} onSave={salvar} saving={saving} />
      </div>
    </div>
  );
}

// ─── modal de movimentação de insumo ─────────────────────────────────────────

function MovInsumoModal({ insumo, onClose, onSuccess }) {
  const [tipo, setTipo]      = useState('ENTRADA');
  const [quantidade, setQtd] = useState('');
  const [motivo, setMotivo]  = useState('');
  const [saving, setSaving]  = useState(false);

  async function salvar() {
    if (!quantidade) return;
    setSaving(true);
    try {
      await api.post(`/insumos/${insumo.id}/movimentacao`, { tipo, quantidade: Number(quantidade), motivo });
      toast.success('Movimentação registrada');
      onSuccess();
    } catch { toast.error('Erro ao registrar'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg">Movimentação — {insumo.nome}</h2>
        <p className="text-sm text-gray-500">Atual: <strong>{insumo.quantidade} {insumo.unidade}</strong></p>
        <TipoSelector value={tipo} onChange={setTipo} />
        <Campo label={tipo === 'AJUSTE' ? `Nova quantidade (${insumo.unidade})` : `Quantidade (${insumo.unidade})`}
          type="number" value={quantidade} onChange={setQtd} />
        <Campo label="Motivo (opcional)" value={motivo} onChange={setMotivo} placeholder="Ex: reposição, quebra..." />
        <BotoesModal onClose={onClose} onSave={salvar} saving={saving} />
      </div>
    </div>
  );
}

// ─── componentes auxiliares ───────────────────────────────────────────────────

function TipoSelector({ value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">Tipo</label>
      <div className="flex gap-2 mt-2">
        {['ENTRADA', 'SAIDA', 'AJUSTE'].map((t) => (
          <button key={t} onClick={() => onChange(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              value === t ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {t === 'ENTRADA' ? 'Entrada' : t === 'SAIDA' ? 'Saída' : 'Ajuste'}
          </button>
        ))}
      </div>
    </div>
  );
}

function Campo({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
    </div>
  );
}

function BotoesModal({ onClose, onSave, saving }) {
  return (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 border py-2 rounded-xl text-sm hover:bg-gray-50">Cancelar</button>
      <button onClick={onSave} disabled={saving}
        className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />}
        Salvar
      </button>
    </div>
  );
}

function Historico({ movimentacoes, unidade }) {
  return movimentacoes.length === 0 ? (
    <p className="text-xs text-gray-400 italic">Nenhuma movimentação registrada ainda.</p>
  ) : (
    <div className="space-y-1.5">
      {movimentacoes.map((m) => (
        <div key={m.id} className="flex items-center gap-3 text-xs">
          <span className={`w-20 font-medium shrink-0 ${TIPO_COR[m.tipo]}`}>{TIPO_LABEL[m.tipo]}</span>
          <span className="font-bold text-gray-800">{m.quantidade}{unidade ? ` ${unidade}` : ''}</span>
          {m.motivo && <span className="text-gray-400 truncate max-w-xs">{m.motivo}</span>}
          <span className="text-gray-300 ml-auto shrink-0">
            {new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── aba: produtos do cardápio ────────────────────────────────────────────────

function TabProdutos({ estoques, onReload, onReloadAll }) {
  const [busca, setBusca]       = useState('');
  const [filtro, setFiltro]     = useState('todos');
  const [expandidos, setExp]    = useState(new Set());
  const [movModal, setMovModal] = useState(null);
  const [ativando, setAtiv]     = useState(null);
  const [removendo, setRem]     = useState(null);

  const toggle = (id) => setExp((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function remover(produtoId) {
    if (!window.confirm('Remover controle de estoque? O histórico será apagado.')) return;
    setRem(produtoId);
    try {
      await api.delete(`/estoque/${produtoId}`);
      toast.success('Controle removido');
      onReloadAll();
    } catch { toast.error('Erro ao remover'); }
    finally { setRem(null); }
  }

  async function ativar(produtoId) {
    setAtiv(produtoId);
    try {
      const { data } = await api.post(`/estoque/${produtoId}/ativar`);
      toast.success('Controle ativado');
      onReload(data, produtoId);
    } catch { toast.error('Erro ao ativar'); }
    finally { setAtiv(null); }
  }

  const alertas = estoques.filter((e) => !e.semControle && e.quantidade <= e.minimo).length;
  const semCtrl = estoques.filter((e) => e.semControle).length;

  const filtrados = estoques.filter((e) => {
    if (busca && !e.produto.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtro === 'alerta')       return !e.semControle && e.quantidade <= e.minimo;
    if (filtro === 'sem-controle') return e.semControle;
    return !e.semControle; // padrão: só exibe quem tem controle ativo
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'todos',         label: `Ativos (${estoques.length - semCtrl})` },
            { key: 'alerta',        label: `Alertas (${alertas})` },
            { key: 'sem-controle',  label: `Sem controle (${semCtrl})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === key ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
            className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-56" />
        </div>
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
              const alerta    = !e.semControle && e.quantidade <= e.minimo;
              const expandido = expandidos.has(e.produtoId);
              return (
                <Fragment key={e.produtoId}>
                  <tr
                    onClick={() => !e.semControle && toggle(e.produtoId)}
                    className={`border-b transition-colors ${!e.semControle ? 'cursor-pointer hover:bg-gray-50' : ''} ${alerta ? 'bg-orange-50' : ''}`}>
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
                      {e.semControle
                        ? <span className="text-gray-300 font-medium">—</span>
                        : <span className={`font-bold text-lg ${alerta ? 'text-orange-600' : 'text-gray-900'}`}>{e.quantidade}</span>}
                    </td>
                    <td className="p-4 text-center text-sm text-gray-500">{e.semControle ? '—' : e.minimo}</td>
                    <td className="p-4 text-center">
                      {e.semControle
                        ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Sem controle</span>
                        : alerta
                          ? <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium"><AlertTriangle size={11} />Baixo</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">OK</span>}
                    </td>
                    <td className="p-4 text-center" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {e.semControle ? (
                          <button onClick={() => ativar(e.produtoId)} disabled={ativando === e.produtoId}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-60">
                            {ativando === e.produtoId ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Ativar
                          </button>
                        ) : (
                          <>
                            <button onClick={() => setMovModal(e)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Movimentação">
                              <Sliders size={15} />
                            </button>
                            <button onClick={() => toggle(e.produtoId)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Histórico">
                              {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <button onClick={() => remover(e.produtoId)} disabled={removendo === e.produtoId}
                              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Remover controle">
                              {removendo === e.produtoId ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandido && !e.semControle && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={6} className="px-6 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Package size={12} />Últimas movimentações</p>
                        <Historico movimentacoes={e.movimentacoes} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhum produto encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {movModal && (
        <MovProdutoModal estoque={movModal} onClose={() => setMovModal(null)}
          onSuccess={() => { setMovModal(null); onReloadAll(); }} />
      )}
    </>
  );
}

// ─── aba: insumos ─────────────────────────────────────────────────────────────

function TabInsumos({ insumos, onReload }) {
  const [busca, setBusca]    = useState('');
  const [setor, setSetor]    = useState('TODOS');
  const [expandidos, setExp] = useState(new Set());
  const [modal, setModal]    = useState(null);
  const [excluindo, setExc]  = useState(null);

  const toggle = (id) => setExp((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function excluir(id) {
    if (!window.confirm('Desativar este insumo?')) return;
    setExc(id);
    try {
      await api.delete(`/insumos/${id}`);
      toast.success('Insumo desativado');
      onReload();
    } catch { toast.error('Erro ao desativar'); }
    finally { setExc(null); }
  }

  const filtrados = insumos.filter((i) => {
    if (setor !== 'TODOS' && i.setor !== setor) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['TODOS', ...SETORES].map((s) => (
            <button key={s} onClick={() => setSetor(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                setor === s ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}>
              {s === 'TODOS' ? `Todos (${insumos.length})` : SETOR_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar insumo..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-52" />
          </div>
          <button onClick={() => setModal({ tipo: 'form', insumo: null })}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors whitespace-nowrap">
            <Plus size={15} />
            Novo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Insumo</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Setor</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Qtd</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Mínimo</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((insumo) => {
              const alerta    = insumo.quantidade <= insumo.minimo;
              const expandido = expandidos.has(insumo.id);
              return (
                <Fragment key={insumo.id}>
                  <tr onClick={() => toggle(insumo.id)}
                    className={`border-b cursor-pointer transition-colors hover:bg-gray-50 ${alerta ? 'bg-orange-50' : ''}`}>
                    <td className="p-4">
                      <p className="font-medium text-gray-900 text-sm">{insumo.nome}</p>
                      <p className="text-xs text-gray-400">unidade: {insumo.unidade}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SETOR_COR[insumo.setor]}`}>
                        {SETOR_LABEL[insumo.setor]}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold text-lg ${alerta ? 'text-orange-600' : 'text-gray-900'}`}>{insumo.quantidade}</span>
                    </td>
                    <td className="p-4 text-center text-sm text-gray-500">{insumo.minimo}</td>
                    <td className="p-4 text-center">
                      {alerta
                        ? <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            <AlertTriangle size={11} />{insumo.quantidade <= 0 ? 'Esgotado' : 'Baixo'}
                          </span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">OK</span>}
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setModal({ tipo: 'mov', insumo })} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Movimentação"><Sliders size={15} /></button>
                        <button onClick={() => setModal({ tipo: 'form', insumo })} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => excluir(insumo.id)} disabled={excluindo === insumo.id} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Desativar">
                          {excluindo === insumo.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                        <button onClick={() => toggle(insumo.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                          {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandido && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={6} className="px-6 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Package size={12} />Últimas movimentações</p>
                        <Historico movimentacoes={insumo.movimentacoes} unidade={insumo.unidade} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                  {insumos.length === 0
                    ? 'Nenhum insumo cadastrado. Clique em "Novo" para começar.'
                    : 'Nenhum insumo encontrado com esse filtro.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.tipo === 'form' && (
        <InsumoFormModal insumo={modal.insumo} onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); onReload(); }} />
      )}
      {modal?.tipo === 'mov' && (
        <MovInsumoModal insumo={modal.insumo} onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); onReload(); }} />
      )}
    </>
  );
}

// ─── aba: lista de compras (unificada) ────────────────────────────────────────

function TabListaCompras({ estoques, insumos }) {
  const [copiado, setCop] = useState(false);

  const itensEstoque = estoques
    .filter((e) => !e.semControle && e.quantidade <= e.minimo)
    .map((e) => ({
      id: e.produtoId,
      nome: e.produto.nome,
      unidade: 'un',
      setor: 'PRODUTOS',
      quantidade: e.quantidade,
      minimo: e.minimo,
      precisaComprar: Math.max(0, e.minimo - e.quantidade + e.minimo),
    }));

  const itensInsumos = insumos
    .filter((i) => i.quantidade <= i.minimo)
    .map((i) => ({
      id: i.id,
      nome: i.nome,
      unidade: i.unidade,
      setor: i.setor,
      quantidade: i.quantidade,
      minimo: i.minimo,
      precisaComprar: Math.max(0, i.minimo - i.quantidade + i.minimo),
    }));

  const todos = [...itensEstoque, ...itensInsumos].sort((a, b) => {
    const da = a.minimo - a.quantidade;
    const db = b.minimo - b.quantidade;
    return db - da;
  });

  const porSetor = { PRODUTOS: [], BAR: [], COZINHA: [], GERAL: [] };
  todos.forEach((i) => { if (porSetor[i.setor]) porSetor[i.setor].push(i); });

  const SETOR_LABEL_LISTA = { ...SETOR_LABEL, PRODUTOS: 'Produtos do Cardápio' };

  function gerarTexto() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const linhas = ['LISTA DE COMPRAS — ' + hoje, ''];
    for (const [s, itens] of Object.entries(porSetor)) {
      if (itens.length === 0) continue;
      linhas.push(`── ${SETOR_LABEL_LISTA[s]} ──`);
      itens.forEach((i) => linhas.push(`[ ] ${i.nome} — ${i.precisaComprar} ${i.unidade}`));
      linhas.push('');
    }
    return linhas.join('\n');
  }

  async function copiar() {
    await navigator.clipboard.writeText(gerarTexto());
    setCop(true);
    setTimeout(() => setCop(false), 2000);
  }

  function imprimir() {
    const w = window.open('', '_blank');
    w.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;white-space:pre-wrap">${gerarTexto()}</pre>`);
    w.document.close();
    w.print();
  }

  if (todos.length === 0) return (
    <div className="text-center py-20 text-gray-400">
      <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
      <p className="font-medium text-gray-500">Estoque OK</p>
      <p className="text-sm mt-1">Nenhum item abaixo do mínimo</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{todos.length} item{todos.length > 1 ? 's' : ''} precisam ser comprados</p>
        <div className="flex gap-2">
          <button onClick={copiar} className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
            {copiado ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={imprimir} className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>

      {Object.entries(porSetor).map(([s, itens]) => {
        if (itens.length === 0) return null;
        const corBadge = s === 'PRODUTOS' ? 'bg-purple-100 text-purple-700' : SETOR_COR[s];
        return (
          <div key={s}>
            <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corBadge}`}>{SETOR_LABEL_LISTA[s]}</span>
              <span className="text-sm text-gray-400">{itens.length} item{itens.length > 1 ? 's' : ''}</span>
            </h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Item</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500">Atual</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500">Mínimo</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 bg-orange-50">Comprar</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((i) => (
                    <tr key={i.id} className={`border-b last:border-0 ${i.quantidade <= 0 ? 'bg-red-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {i.quantidade <= 0 && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                          <span className="font-medium text-sm text-gray-900">{i.nome}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm font-semibold text-red-600">{i.quantidade} {i.unidade}</td>
                      <td className="p-3 text-center text-sm text-gray-500">{i.minimo} {i.unidade}</td>
                      <td className="p-3 text-center bg-orange-50">
                        <span className="font-bold text-orange-700">{i.precisaComprar} {i.unidade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function EstoquePage() {
  const [aba, setAba]         = useState('produtos');
  const [estoques, setEst]    = useState([]);
  const [insumos, setIns]     = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEstoques = useCallback(async () => {
    const { data } = await api.get('/estoque');
    setEst(data);
  }, []);

  const loadInsumos = useCallback(async () => {
    const { data } = await api.get('/insumos');
    setIns(data);
  }, []);

  useEffect(() => {
    Promise.all([loadEstoques(), loadInsumos()]).finally(() => setLoading(false));
  }, [loadEstoques, loadInsumos]);

  function handleEstoqueAtivar(data, produtoId) {
    setEst((prev) => prev.map((e) => e.produtoId === produtoId ? data : e));
  }

  const alertasProdutos = estoques.filter((e) => !e.semControle && e.quantidade <= e.minimo).length;
  const alertasInsumos  = insumos.filter((i) => i.quantidade <= i.minimo).length;
  const totalAlertas    = alertasProdutos + alertasInsumos;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500 text-sm">Produtos do cardápio e insumos internos</p>
        </div>
        {totalAlertas > 0 && (
          <button onClick={() => setAba('compras')}
            className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-orange-200 transition-colors">
            <AlertTriangle size={15} />
            {totalAlertas} item{totalAlertas > 1 ? 's' : ''} em falta
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'produtos', label: `Produtos (${estoques.length})` },
          { key: 'insumos',  label: `Insumos (${insumos.length})` },
          { key: 'compras',  label: `Lista de Compras${totalAlertas > 0 ? ` (${totalAlertas})` : ''}` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setAba(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {aba === 'produtos' && <TabProdutos estoques={estoques} onReload={handleEstoqueAtivar} onReloadAll={loadEstoques} />}
      {aba === 'insumos'  && <TabInsumos  insumos={insumos}   onReload={loadInsumos} />}
      {aba === 'compras'  && <TabListaCompras estoques={estoques} insumos={insumos} />}
    </div>
  );
}
