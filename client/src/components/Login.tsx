import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Terminal, ShieldCheck } from 'lucide-react';

export const Login = ({ onLogin }: { onLogin: (status: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [glitchText, setGlitchText] = useState('BETTERME');
  const [dots, setDots] = useState('');

  // Анимация мигающих точек в статусе
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Glitch эффект на заголовке
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    const original = 'BETTERME';
    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const startGlitch = () => {
      iteration = 0;
      interval = setInterval(() => {
        setGlitchText(
          original.split('').map((char, i) => {
            if (i < iteration) return original[i];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        if (iteration >= original.length) {
          clearInterval(interval);
          setGlitchText(original);
        }
        iteration += 0.4;
      }, 40);
    };

    startGlitch();
    const repeat = setInterval(startGlitch, 4000);
    return () => { clearInterval(interval); clearInterval(repeat); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/login', { username, password });
      if (response.data.success) {
        onLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden">

      {/* Сетка на фоне */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)' }}
        />
      </div>

      {/* Угловые декоративные элементы */}
      <div className="absolute top-8 left-8 text-emerald-500/20 font-mono text-xs space-y-1">
        <p>SYS://TAX_ADMIN_v1.1</p>
        <p>ВУЗОЛ: NYC_CLUSTER_01</p>
        <p>СТАТУС: АКТИВНИЙ{dots}</p>
      </div>
      <div className="absolute bottom-8 right-8 text-emerald-500/20 font-mono text-xs text-right space-y-1">
        <p>© 2025 BETTERME INC.</p>
        <p>ЗАХИЩЕНИЙ_КАНАЛ: AES-256</p>
      </div>

      {/* Основная карточка */}
      <div
        className="relative w-full max-w-md mx-4 animate-fade-up"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Верхний бордер с градиентом */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-0" />

        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 border-t-0 rounded-b-xl rounded-t-none p-8 space-y-6"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
        >
          {/* Логотип / заголовок */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-2 h-10 bg-emerald-400 rounded-full" />
              <h1
                className="text-3xl font-black tracking-[0.15em] text-white"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {glitchText}
              </h1>
            </div>
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.3em]">
              Tax Administration Terminal
            </p>
          </div>

          {/* Статус бар */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-mono text-zinc-500">
              AWAITING_CREDENTIALS{dots}
            </span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest pl-1">
                Ідентифікатор
              </label>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3.5 text-sm font-mono text-zinc-100 placeholder-zinc-700 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest pl-1">
                Ключ доступу
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3.5 text-sm font-mono text-zinc-100 placeholder-zinc-700 transition-all"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-glow w-full py-3.5 rounded-lg text-sm font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all duration-200 mt-1
                disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:shadow-none
                enabled:bg-emerald-500 enabled:hover:bg-emerald-400 enabled:text-zinc-950 enabled:cursor-pointer"
              style={(!loading && username && password) ? { boxShadow: '0 0 20px rgba(16,185,129,0.3)' } : {}}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Авторизація{dots}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Ініціалізувати сесію
                </>
              )}
            </button>
          </form>

          {/* Нижний декор */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
              Захищено
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        </div>

        {/* Нижний бордер */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </div>
    </div>
  );
};
