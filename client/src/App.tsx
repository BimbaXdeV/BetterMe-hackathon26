import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ImportCSV } from './components/ImportCSV';
import { ManualOrderForm } from './components/ManualOrderForm';
import { OrdersTable } from './components/OrdersTable';
import { Login } from './components/Login'; 
import { Toaster } from 'sonner';

function App() {
  // --- STATE: Управляем вселенной BetterMe ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({ count: 0, tax: 0, total: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- LOGIC: Получаем глобальные цифры ---
  const fetchGlobalStats = useCallback(async () => {
    try {
      // Стучимся в наш новый эндпоинт, который мы только что создали в main.py
      const response = await axios.get('/api/stats');
      setStats({
        count: response.data.orders_count || 0,
        tax: response.data.total_tax || 0,
        total: response.data.total_revenue || 0
      });
    } catch (error) {
      console.error('Помилка статистики. Сервер спить или обиделся:', error);
    }
  }, []);

  // Обновляем статистику при входе или когда прилетают новые данные
  useEffect(() => {
    if (isLoggedIn) {
      fetchGlobalStats();
    }
  }, [isLoggedIn, refreshTrigger, fetchGlobalStats]);

  // Этот колбэк мы прокидываем в формы, чтобы они "пинали" главную страницу после успеха
  const handleUpdate = useCallback(() => {
    console.log('Данные обновлены! Перерисовываем мир...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Если не залогинены — показываем экран входа. Безопасность превыше всего!
  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      {/* Умные уведомления (тостеры), которые не бесят */}
      <Toaster theme="dark" position="bottom-right" richColors />

      {/* --- HEADER: Шапка, которая всегда с тобой --- */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-400 rounded-full animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight">
              BetterMe <span className="text-emerald-400">Tax Admin</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 hover:border-emerald-500/50 text-xs font-mono transition-all"
          >
            Вийти
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT: Где происходит вся магия --- */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Карточки статистики: чтобы сразу видеть масштаб катастрофы (или успеха) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-lg hover:border-emerald-500/30 transition-colors">
            <p className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Замовлення</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.count.toLocaleString()}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-lg hover:border-emerald-500/30 transition-colors">
            <p className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Податки</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${stats.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-lg hover:border-emerald-500/30 transition-colors">
            <p className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Виторг</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Секция инструментов: загрузка и создание */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImportCSV onSuccess={handleUpdate} />
          <ManualOrderForm onSuccess={handleUpdate} />
        </div>

        {/* Главная таблица: здесь лежат наши данные под надежной защитой refreshTrigger */}
        <OrdersTable refreshTrigger={refreshTrigger} />
        
      </main>

      {/* Маленький футер для солидности */}
      <footer className="max-w-7xl mx-auto px-6 py-10 text-center">
        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">
          BetterMe Hackathon Edition 2026 • Build with ❤️ for KNURE
        </p>
      </footer>
    </div>
  );
}

export default App;