import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Terminal, ShieldCheck } from 'lucide-react';

// Массив с координатами для разброса дронов по ВСЕМУ экрану
// Ты можешь легко менять их размер (size), угол (rotate) и прозрачность (opacity) прямо здесь
const backgroundDrones = [
  { top: '10%', left: '10%', size: 'w-32 h-32', rotate: 'rotate-12', opacity: 'opacity-[0.04]' },
  { top: '15%', left: '75%', size: 'w-40 h-40', rotate: '-rotate-45', opacity: 'opacity-[0.03]' },
  { top: '40%', left: '85%', size: 'w-24 h-24', rotate: 'rotate-90', opacity: 'opacity-[0.05]' },
  { top: '45%', left: '8%', size: 'w-20 h-20', rotate: '-rotate-12', opacity: 'opacity-[0.04]' },
  { top: '25%', left: '45%', size: 'w-16 h-16', rotate: 'rotate-180', opacity: 'opacity-[0.02]' },
  { top: '75%', left: '15%', size: 'w-48 h-48', rotate: 'rotate-45', opacity: 'opacity-[0.03]' },
  { top: '80%', left: '80%', size: 'w-28 h-28', rotate: '-rotate-90', opacity: 'opacity-[0.04]' },
  { top: '85%', left: '45%', size: 'w-20 h-20', rotate: 'rotate-12', opacity: 'opacity-[0.03]' },
];

export const Login = ({ onLogin }: { onLogin: (status: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [glitchText, setGlitchText] = useState('BETTERME');
  const [dots, setDots] = useState('');

  // Анимация мигающих точек
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Glitch эффект
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    const original = 'BETTERME';
    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const startGlitch = () => {
      iteration = 0;
      interval = setInterval(() => {
        setGlitchText(
          original.split('').map((_, i) => {
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

      {/* --- ТВОИ ДРОНЫ ИЗ ПАПКИ PUBLIC --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {backgroundDrones.map((drone, index) => (
          <img
            key={index}
            src="/drone.svg" /* Если скачаешь PNG, поменяй тут на /drone.png */
            alt="Drone background"
            className={`absolute ${drone.size} ${drone.rotate} ${drone.opacity} object-contain transition-all duration-1000`}
            style={{ 
              top: drone.top, 
              left: drone.left,
              // Делаем их изумрудными, если картинка белая/черная
              filter: 'brightness(0) saturate(100%) invert(56%) sepia(85%) saturate(3015%) hue-rotate(124deg) brightness(96%) contrast(92%)' 
            }}
          />
        ))}
      </div>
      {/* ---------------------------------- */}

      {/* Радиальное свечение по центру */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)' }}
      />

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
      <div className="relative w-full max-w-lg mx-4 animate-fade-up z-10" style={{ animationDelay: '0.1s' }}>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-0" />

        <div
          className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 border-t-0 rounded-b-2xl rounded-t-none p-10 space-y-7"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
        >
          {/* Логотип */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-2.5 h-12 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h1 className="text-4xl font-black tracking-[0.15em] text-white" style={{ fontFamily: 'IBM Plex Mono, monospace', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
                {glitchText}
              </h1>
            </div>
            <p className="text-sm font-mono text-zinc-600 uppercase tracking-[0.3em]">
              Tax Administration Terminal
            </p>
          </div>

          {/* Статус бар */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-800/80 rounded-lg px-5 py-3">
            <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-mono text-zinc-500">AWAITING_CREDENTIALS{dots}</span>
            <span className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-600 uppercase tracking-widest pl-1">Ідентифікатор</label>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg px-5 py-4 text-base font-mono text-zinc-100 placeholder-zinc-700 transition-all focus:border-emerald-500/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-600 uppercase tracking-widest pl-1">Ключ доступу</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg px-5 py-4 text-base font-mono text-zinc-100 placeholder-zinc-700 transition-all focus:border-emerald-500/50 outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 animate-fade-in">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-glow w-full py-4 rounded-lg text-sm font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all duration-200 mt-2
                disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:shadow-none
                enabled:bg-emerald-500 enabled:hover:bg-emerald-400 enabled:text-zinc-950 enabled:cursor-pointer"
              style={(!loading && username && password) ? { boxShadow: '0 0 25px rgba(16,185,129,0.4)' } : {}}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Авторизація{dots}</> : <><ShieldCheck className="w-4 h-4" />Ініціалізувати сесію</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};