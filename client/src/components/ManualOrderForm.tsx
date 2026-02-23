import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, DollarSign, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderInput, Order } from '../types';

interface Props {
  onSuccess?: () => void;
}

export const ManualOrderForm = ({ onSuccess }: Props) => {
  const [formData, setFormData] = useState<OrderInput>({
    latitude: 0,
    longitude: 0,
    subtotal: 0,
    timestamp: new Date().toISOString(),
  });
  
  const [result, setResult] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // В Sonner создаем лоадер, который вернет ID для последующего обновления
    const toastId = toast.loading('Рассчитываем налог и сохраняем...');
    
    try {
      // ИСПРАВЛЕНО: порт изменен на 8000, чтобы совпадать с App.tsx
      const response = await axios.post('http://localhost:8000/orders', formData);
      
      setResult(response.data);
      
      // Обновляем тот же самый тост успехом
      toast.success('Заказ успешно создан!', { id: toastId });
      
      onSuccess?.();
    } catch (error) {
      console.error('Ошибка:', error);
      // Обновляем тот же самый тост ошибкой
      toast.error('Не удалось создать заказ. Проверьте соединение с API.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5
    text-sm text-zinc-100 font-mono placeholder-zinc-600
    focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
    transition-all duration-150
  `;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
          02
        </span>
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Ручное создание
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className={inputClass + ' pl-9'}
              onChange={(e) =>
                setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className={inputClass + ' pl-9'}
              onChange={(e) =>
                setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="number"
            step="any"
            placeholder="Subtotal"
            className={inputClass + ' pl-9'}
            onChange={(e) =>
              setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
            ${loading
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
            }
          `}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          {loading ? 'Расчёт...' : 'Рассчитать и сохранить'}
        </button>
      </form>

      {result && (
        <div className="mt-2 rounded-lg bg-zinc-800/80 border border-zinc-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-2 border-b border-zinc-700 bg-zinc-800">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Результат расчёта
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-zinc-700">
            {[
              { label: 'Ставка', value: `${((result.composite_tax_rate || 0) * 100).toFixed(3)}%` },
              { label: 'Налог', value: `$${(result.tax_amount || 0).toFixed(2)}` },
              { label: 'Итого', value: `$${(result.total_amount || 0).toFixed(2)}` },
            ].map((item) => (
              <div key={item.label} className="px-4 py-3 text-center">
                <p className="text-xs text-zinc-500 font-mono mb-1">{item.label}</p>
                <p className="text-sm font-mono font-semibold text-emerald-400">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};