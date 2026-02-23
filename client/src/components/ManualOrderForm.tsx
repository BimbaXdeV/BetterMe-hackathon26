import React, { useState } from 'react';
import axios from 'axios';
import type { OrderInput, Order } from '../types';


export const ManualOrderForm = () => {
  const [formData, setFormData] = useState<OrderInput>({
    latitude: 0,
    longitude: 0,
    subtotal: 0,
    timestamp: new Date().toISOString(),
  });

  const [result, setResult] = useState<Order | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправка  данных  на  эндпоинт для ручного создания
      const response = await axios.post('http://localhost:3000/orders', formData);
      setResult(response.data);
      alert('Заказ успешно создан и налог рассчитан!');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось рассчитать налог');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px', marginTop: '20px' }}>
      <h3>2. Ручное создание заказа</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <input 
          type="number" step="any" placeholder="Latitude" 
          onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})} 
        />
        <input 
          type="number" step="any" placeholder="Longitude" 
          onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})} 
        />
        <input 
          type="number" placeholder="Subtotal ($)" 
          onChange={(e) => setFormData({...formData, subtotal: parseFloat(e.target.value)})} 
        />
        <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white' }}>Рассчитать и сохранить</button>
      </form>

      {result && (
        <div style={{ marginTop: '15px', background: '#222', padding: '10px' }}>
          <p><b>Итоговая ставка:</b> {(result.composite_tax_rate * 100).toFixed(3)}%</p>
          <p><b>Налог:</b> ${result.tax_amount.toFixed(2)}</p>
          <p><b>Всего:</b> ${result.total_amount.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};