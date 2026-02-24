import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImportCSV } from './components/ImportCSV';
import { ManualOrderForm } from './components/ManualOrderForm';
import { OrdersTable } from './components/OrdersTable';
import { Toaster } from 'sonner';

function App() {
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
    fetchStats();
  }, [refreshKey]);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster theme="dark" position="bottom-right" richColors />

      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-2 h-8 bg-emerald-400 rounded-full" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white font-display">BetterMe</h1>
            <p className="text-xs text-zinc-500 font-mono">Tax Admin Panel · v1.1</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">System Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats bar — staggered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Всего заказов', value: stats.count },
            { label: 'Общий налог',   value: `$${stats.tax.toLocaleString()}` },
            { label: 'Общая выручка', value: `$${stats.total.toLocaleString()}` },
          ].map((stat) => (
            <div key={stat.label} className="stat-card glow-card bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">{stat.label}</p>
              <p className="text-2xl font-mono font-bold text-emerald-400">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-card">
            <ImportCSV onSuccess={handleUpdate} />
          </div>
          <div className="form-card">
            <ManualOrderForm onSuccess={handleUpdate} />
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <OrdersTable key={refreshKey} />
        </div>
      </main>
    </div>
  );
}

export default App;
