import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beer, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/auth';

const AVATAR_COLOR = {
  GARCOM: 'bg-blue-500',
  CAIXA:  'bg-purple-500',
};

export default function LoginPage() {
  const [aba, setAba] = useState('garcom');
  const [garcons, setGarcons] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 p-4 rounded-full mb-3">
            <Beer className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PDV Bar</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestão</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {[
            { id: 'garcom', label: 'Sou Garçom / Caixa' },
            { id: 'admin',  label: 'Administrador' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => trocarAba(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                aba === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ABA GARÇOM: grade de nomes ── */}
        {aba === 'garcom' && !selecionado && (
          <div>
            <p className="text-sm text-gray-500 mb-4 text-center">Toque no seu nome para entrar</p>
            {garcons.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nenhum garçom cadastrado</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {garcons.map((g) => (
                  <button key={g.id}
                    onClick={() => { setSelecionado(g); setSenha(''); setMostrarSenha(false); }}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-transparent hover:border-green-400 hover:bg-green-50 transition-all group">
                    <div className={`w-14 h-14 rounded-full ${AVATAR_COLOR[g.role] || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-2xl mb-2 group-hover:scale-110 transition-transform`}>
                      {g.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center leading-tight">{g.nome}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{g.role === 'GARCOM' ? 'Garçom' : 'Caixa'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA GARÇOM: digitar senha ── */}
        {aba === 'garcom' && selecionado && (
          <form onSubmit={loginGarcom} className="space-y-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSelecionado(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div className={`w-11 h-11 rounded-full ${AVATAR_COLOR[selecionado.role] || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                {selecionado.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selecionado.nome}</p>
                <p className="text-xs text-gray-400">{selecionado.role === 'GARCOM' ? 'Garçom' : 'Caixa'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Entrar
            </button>
          </form>
        )}

        {/* ── ABA ADMIN ── */}
        {aba === 'admin' && (
          <form onSubmit={loginAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="admin@bar.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" value={senhaAdmin} onChange={(e) => setSenhaAdmin(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
