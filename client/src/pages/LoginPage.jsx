import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beer, Loader2, ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const ROLE_CONFIG = {
  GARCOM: { label: 'Garçom', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-300' },
  CAIXA:  { label: 'Caixa',  color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-300' },
};

export default function LoginPage() {
  const [aba, setAba] = useState('garcom');
  const [garcons, setGarcons] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/garcons/lista').then((r) => setGarcons(r.data)).catch(() => {});
  }, []);

  function trocarAba(id) {
    setAba(id);
    setSelecionado(null);
    setSenha('');
    setMostrarSenha(false);
  }

  async function loginGarcom(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { garcomId: selecionado.id, senha });
      login(data.token, data.user);
      navigate('/garcom');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Senha incorreta');
    } finally {
      setLoading(false);
    }
  }

  async function loginAdmin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha: senhaAdmin });
      login(data.token, data.user);
      const role = data.user.role;
      if (role === 'ADMIN' || role === 'GERENTE') navigate('/admin');
      else navigate('/garcom');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  const cfg = selecionado ? (ROLE_CONFIG[selecionado.role] || ROLE_CONFIG.GARCOM) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, #052e16 0%, #030712 60%)' }}>

      {/* Decorative glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-900/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header band */}
          <div className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 px-8 pt-10 pb-8 text-white text-center relative overflow-hidden">
            {/* Background circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-4 ring-1 ring-white/20">
                <Beer size={30} className="text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">PDV Bar</h1>
              <p className="text-green-200 text-sm mt-1">Sistema de gestão</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-7">

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
              {[
                { id: 'garcom', label: 'Garçom / Caixa' },
                { id: 'admin',  label: 'Administrador' },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => trocarAba(id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    aba === id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── ABA GARÇOM: grade de nomes ── */}
            {aba === 'garcom' && !selecionado && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-4">
                  Toque no seu nome
                </p>
                {garcons.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">Nenhum garçom cadastrado</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {garcons.map((g) => {
                      const c = ROLE_CONFIG[g.role] || ROLE_CONFIG.GARCOM;
                      return (
                        <button
                          key={g.id}
                          onClick={() => { setSelecionado(g); setSenha(''); setMostrarSenha(false); }}
                          className="group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:bg-green-50/60 transition-all active:scale-95"
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all`}>
                            {g.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{g.nome.split(' ')[0]}</p>
                            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${c.bg} ${c.text}`}>
                              {c.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA GARÇOM: digitar senha ── */}
            {aba === 'garcom' && selecionado && (
              <form onSubmit={loginGarcom} className="space-y-5">
                {/* Perfil selecionado */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl ${cfg.bg} border border-current/10`}>
                  <button type="button" onClick={() => setSelecionado(null)}
                    className="p-1.5 rounded-xl hover:bg-white/60 text-gray-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={16} />
                  </button>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm`}>
                    {selecionado.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold ${cfg.text}`}>{selecionado.nome}</p>
                    <p className="text-xs text-gray-500">{cfg.label}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 pr-11 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm hover:shadow-md active:scale-[0.98]">
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <ChevronRight size={16} />
                  }
                  Entrar
                </button>
              </form>
            )}

            {/* ── ABA ADMIN ── */}
            {aba === 'admin' && (
              <form onSubmit={loginAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm transition-colors"
                    placeholder="admin@bar.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenhaAdmin ? 'text' : 'password'}
                      value={senhaAdmin}
                      onChange={(e) => setSenhaAdmin(e.target.value)}
                      className="w-full px-4 py-3 pr-11 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setMostrarSenhaAdmin(!mostrarSenhaAdmin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                      {mostrarSenhaAdmin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm hover:shadow-md active:scale-[0.98]">
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <ChevronRight size={16} />
                  }
                  Entrar
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-5">
          PDV Bar · Sistema de gestão
        </p>
      </div>
    </div>
  );
}
