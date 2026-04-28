import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Terminal, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@smartserve.com');
    setPassword('SuperAdmin@123');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
            <Terminal className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-cyan-400">&lt;</span>
            Developer
            <span className="text-cyan-400">/&gt;</span>
          </h1>
          <p className="text-cyan-400 text-sm uppercase tracking-wider mb-1">
            Super Developer Control Center
          </p>
          <p className="text-gray-400 text-xs">Internal Access Only</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                System: <span className="text-green-400 font-semibold">ONLINE</span>
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true 
              })}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-cyan-400 text-xs uppercase mb-3">
                Developer Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartserve.com"
                  className="w-full bg-[#0f1828] border border-dark-border rounded-lg pl-12 pr-4 py-3.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-cyan-400 text-xs uppercase mb-3">
                Access Token
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0f1828] border border-dark-border rounded-lg pl-12 pr-4 py-3.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Terminal className="w-5 h-5" />
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Request Access Token
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-cyan-400 text-xs uppercase mb-2">
                  // Demo Access
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400 text-xs">
                    Email: <span className="text-white">admin@smartserve.com</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Password: <span className="text-white">SuperAdmin@123</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  → Use demo credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
