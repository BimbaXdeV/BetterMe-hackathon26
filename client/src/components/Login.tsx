import React, { useState } from 'react';
import axios from 'axios';

export const Login = ({ onLogin }: { onLogin: (status: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Отправляем данные на бэк
      const response = await axios.post('http://localhost:8000/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        onLogin(true);
      }
      console.log(response);
      console.log(response.data.success);
    } catch (err: any) {
      console.log('not success')
      setError(err.response?.data?.detail || 'Помилка авторизації');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: 'white' }}>
      <form onSubmit={handleSubmit} style={{ border: '1px solid #27272a', padding: '2rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>Вход</h2>
        
        {error && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>{error}</p>}
        
        <input type="text" placeholder="Логін" value={username} onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #3f3f46', background: 'transparent', color: 'white' }} />
        
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #3f3f46', background: 'transparent', color: 'white' }} />
        
        <button type="submit" style={{ padding: '0.7rem', borderRadius: '4px', border: 'none', background: '#10b981', fontWeight: 'bold', cursor: 'pointer' }}>
          Зареєструватися
        </button>
      </form>
    </div>
  );
};