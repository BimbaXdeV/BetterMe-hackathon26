import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImportCSV } from './components/ImportCSV';
import { ManualOrderForm } from './components/ManualOrderForm';
import { OrdersTable } from './components/OrdersTable';
import { Login } from './components/Login'; 
import { Toaster } from 'sonner';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({ count: 0, tax: 0, total: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/');
      setStats({
        count: response.data.orders_count,
        tax: response.data.total_tax || 0,
        total: response.data.total_revenue || 0
      });
    } catch (error) {
      console.error('Ошибка статистики:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
    }
  }, [refreshKey, isLoggedIn]);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Если не залогинен — показываем только форму входа
  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster theme="dark" position="bottom-right" richColors />

      <header className="border-b border-zinc-800 bg-zinc-900/80 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-400 rounded-full" />
            <h1 className="text-lg font-semibold">BetterMe Tax Admin</h1>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 text-xs"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Карточки статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase font-mono">Заказы</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.count}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase font-mono">Налог</p>
            <p className="text-2xl font-bold text-emerald-400">${stats.tax.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase font-mono">Выручка</p>
            <p className="text-2xl font-bold text-emerald-400">${stats.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImportCSV onSuccess={handleUpdate} />
          <ManualOrderForm onSuccess={handleUpdate} />
        </div>

        <OrdersTable key={refreshKey} />
      </main>
    </div>
  );
}

export default App;