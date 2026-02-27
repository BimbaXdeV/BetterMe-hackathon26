import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse'; 
import { toast } from 'sonner';

interface Props {
  onSuccess?: () => void; // Упростили, так как App.tsx сам обновит данные
}

export const ImportCSV = ({ onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const [rowCount, setRowCount] = useState<number>(0);
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setSuccess(false);
    setRowCount(0);
    setUploadedCount(0);
    setTimeLeft('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith('.csv')) handleFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    const startTime = Date.now();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Мапим данные и защищаемся от странных заголовков в CSV
          const formattedOrders = results.data.map((row: any) => {
            const findKey = (name: string) => 
              Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase());
            
            return {
              latitude: parseFloat(row[findKey('latitude') || ''] || 0),
              longitude: parseFloat(row[findKey('longitude') || ''] || 0),
              subtotal: parseFloat(row[findKey('subtotal') || ''] || 0),
              timestamp: row[findKey('timestamp') || ''] || new Date().toISOString()
            };
          }).filter(o => o.latitude !== 0 && !isNaN(o.subtotal));

          const total = formattedOrders.length;
          if (total === 0) throw new Error("Файл порожній або має невірні заголовки (потрібні: latitude, longitude, subtotal)");

          setRowCount(total);

          // Разбиваем на чанки, чтобы Heroku не отвалился по таймауту (30 сек)
          const chunkSize = 2000; 

          for (let i = 0; i < total; i += chunkSize) {
            const chunk = formattedOrders.slice(i, i + chunkSize);
            
            // Отправляем порцию данных
            await axios.post('/orders/import', chunk);
            
            const currentUploaded = Math.min(i + chunkSize, total);
            setUploadedCount(currentUploaded);

            // Считаем время до конца (физика за 7 класс, привет ХНУРЭ!)
            const timeElapsed = Date.now() - startTime;
            const timePerItem = timeElapsed / currentUploaded;
            const remainingItems = total - currentUploaded;
            const secondsRemaining = Math.ceil((remainingItems * timePerItem) / 1000);

            setTimeLeft(secondsRemaining > 0 ? `~${secondsRemaining} сек.` : 'фіналізуємо...');
          }

          toast.success('Імпорт завершено', {
            description: `${total} записів успішно впорскнуто в систему.`,
          });

          setSuccess(true);
          setFile(null);
          
          // Вызываем обновление в App.tsx
          onSuccess?.();

        } catch (error: any) {
          console.error('CSV Injection Error:', error);
          toast.error('Помилка імпорту', { 
            description: error.response?.data?.detail || error.message 
          });
        } finally {
          setLoading(false);
          setTimeLeft('');
        }
      }
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl relative overflow-hidden group">
      {/* Декоративный эффект на фоне */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">01</span>
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">CSV_DATA_INJECTION</h2>
      </div>

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); !loading && setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-300 p-8
          flex flex-col items-center justify-center gap-3 text-center
          ${dragging
            ? 'border-emerald-400 bg-emerald-400/10'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-zinc-800 hover:border-emerald-500/40 bg-zinc-950 hover:bg-emerald-500/5'
          }
          ${loading ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} disabled={loading} className="hidden" />

        {file ? (
          <>
            <div className="p-3 bg-emerald-500/10 rounded-full">
                <FileText className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-mono text-zinc-200">{file.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className={`w-10 h-10 transition-colors ${dragging ? 'text-emerald-400' : 'text-zinc-700'}`} />
            <div>
              <p className="text-sm text-zinc-400">
                Перетягніть CSV або <span className="text-emerald-500 hover:underline">оберіть файл</span>
              </p>
              <p className="text-[10px] text-zinc-600 font-mono mt-2 uppercase tracking-tight">Support: Lat, Lon, Subtotal</p>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`
          btn-glow w-full py-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest
          ${file && !loading
            ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono">
              INJECTING: {uploadedCount}/{rowCount} <span className="text-[10px] opacity-60 ml-2">{timeLeft}</span>
            </span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            EXECUTION_COMPLETE
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            EXECUTE_IMPORT
          </>
        )}
      </button>
    </div>
  );
};