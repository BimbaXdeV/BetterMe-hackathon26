import React, { useState } from 'react';
import axios from 'axios';

export const ImportCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Сначала выбери файл!");
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Ключ 'file' должен совпадать с тем, что ждет бэкенд

    setLoading(true);
    try {
      // Заменить URL на адреc бэкенда
      const response = await axios.post('http://localhost:3000/orders/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Файл успешно загружен и обработан!');
      console.log('Ответ сервера:', response.data);
    } catch (error) {
      console.error('Ошибка при загрузке:', error);
      alert('Произошла ошибка при импорте');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px dashed #646cff', borderRadius: '8px', margin: '10px 0' }}>
      <h3>1. Импорт заказов из CSV</h3>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        disabled={loading}
      />
      <button 
        onClick={handleUpload} 
        disabled={!file || loading}
        style={{ marginLeft: '10px' }}
      >
        {loading ? 'Обработка...' : 'Загрузить и рассчитать'}
      </button>
    </div>
  );
};