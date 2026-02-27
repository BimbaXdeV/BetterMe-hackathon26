import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, DollarSign, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderInput } from '../types';

interface Props {
  onSuccess?: () => void;
}

export const ManualOrderForm = ({ onSuccess }: Props) => {
  // Начальное состояние (чистое, как совесть программиста перед деплоем)
  const initialFormState: OrderInput = {
    latitude: 0,
    longitude: 0,
    subtotal: 0,
    timestamp: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<OrderInput>(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка на "нулевые" координаты (чтобы не спамить сервер мусором)
    if (formData.latitude === 0 && formData.longitude === 0) {
      toast.error('Координати не можуть бути нульовими');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Розраховуємо податок та зберігаємо...');

    try {
      // Отправляем данные на наш единственный и неповторимый бэкенд
      await axios.post('/orders', formData);
      
      toast.success('Замовлення успішно створено!', { id: toastId });
      
      // Сброс формы к истокам
      setFormData({
        ...initialFormState,
        timestamp: new Date().toISOString()
      });
      
      // Пингуем App.tsx, чтобы он обновил общую статистику
      onSuccess?.();
    } catch (error: any) {
      console.error('Помилка при створенні:', error);
      const errorMsg = error.response?.data?.detail || 'Не вдалося створити замовлення.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5
    text-sm text-zinc-100 font-mono placeholder-zinc-600 outline-none
    focus:border-emerald-500/50 transition-all duration-150 hover:border-zinc-700
  `;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl group">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">02</span>
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">Ручне створення</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500/50 transition-colors" />
            <input
              type="number" step="any" placeholder="Latitude"
              className={inputClass + ' pl-9'}
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500/50 transition-colors" />
            <input
              type="number" step="any" placeholder="Longitude"
              className={inputClass + ' pl-9'}
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500/50 transition-colors" />
          <input
            type="number" step="any" placeholder="Subtotal"
            className={inputClass + ' pl-9'}
            value={formData.subtotal || ''}
            onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            btn-glow w-full py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2
            uppercase tracking-widest transition-all duration-300
            ${loading
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
            }
          `}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          {loading ? 'Розрахунок...' : 'Розрахувати та зберегти'}
        </button>
      </form>
    </div>
  );
};