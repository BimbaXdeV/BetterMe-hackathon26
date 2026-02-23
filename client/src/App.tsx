import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImportCSV } from './components/ImportCSV';
import { ManualOrderForm } from './components/ManualOrderForm';
import { OrdersTable } from './components/OrdersTable';
import type { Order } from './types';

function App() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/orders');
      if (response.data && response.data.data) {
        setOrders(response.data.data);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-2 h-8 bg-emerald-400 rounded-full" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white font-display">
              BetterMe
            </h1>
            <p className="text-xs text-zinc-500 font-mono">Tax Admin Panel · v1.0</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">API Connected</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Всего заказов', value: orders.length, suffix: '' },
            {
              label: 'Общий налог',
              value: orders.reduce((s, o) => s + o.tax_amount, 0).toFixed(2),
              suffix: '$',
            },
            {
              label: 'Общая выручка',
              value: orders.reduce((s, o) => s + o.total_amount, 0).toFixed(2),
              suffix: '$',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-mono font-bold text-emerald-400">
                {stat.suffix}
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Forms row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImportCSV onSuccess={fetchOrders} />
          <ManualOrderForm onSuccess={fetchOrders} />
        </div>

        {/* Table */}
        <OrdersTable orders={orders} />
      </main>
    </div>
  );
}

export default App;
