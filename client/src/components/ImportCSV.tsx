import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse'; 
import { toast } from 'sonner';

interface Props {
  onSuccess?: () => void; 
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
    const startTime = Date.now();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedOrders = results.data.map((row: any) => {
            const findKey = (name: string) => 
              Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
            
            return {
              latitude: parseFloat(row[findKey('latitude') || ''] || 0),
              longitude: parseFloat(row[findKey('longitude') || ''] || 0),
              subtotal: parseFloat(row[findKey('subtotal') || ''] || 0),
              timestamp: row[findKey('timestamp') || ''] || new Date().toISOString()
            };
          }).filter(o => o.latitude !== 0);

          const total = formattedOrders.length;
          if (total === 0) throw new Error("Файл порожній або має невірні заголовки");

          setRowCount(total);

          const chunkSize = 5000; 
          for (let i = 0; i < total; i += chunkSize) {
            const chunk = formattedOrders.slice(i, i + chunkSize);
            await axios.post('http://localhost:8000/orders/bulk', chunk);
            
            const currentUploaded = Math.min(i + chunkSize, total);
            setUploadedCount(currentUploaded);

            const timeElapsed = Date.now() - startTime;
            const timePerItem = timeElapsed / currentUploaded;
            const remainingItems = total - currentUploaded;
            const secondsRemaining = Math.ceil((remainingItems * timePerItem) / 1000);

            setTimeLeft(secondsRemaining > 0 ? `~${secondsRemaining} сек.` : 'фіналізуємо...');
          }

          toast.success('Імпорт завершено', {
            description: `${total} записів успішно оброблено.`,
            style: { background: '#18181b', color: '#10b981', border: '1px solid #065f46' }
          });

          setSuccess(true);
          setFile(null);
          
          if (onSuccess) onSuccess(); 

        } catch (error: any) {
          toast.error('Помилка імпорту', { description: error.message });
        } finally {
          setLoading(false);
          setTimeLeft('');
        }
      }
    });
  };

  return (
    <div className="bg-zinc-950 border border-emerald-900/30 rounded-xl p-6 space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h2 className="text-xs font-bold text-emerald-500/80 tracking-[0.2em] uppercase">
          CSV_DATA_INJECTION
        </h2>
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
            : 'border-zinc-800 hover:border-emerald-500/40 bg-zinc-900/50 hover:bg-emerald-500/5'
          }
          ${loading ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} disabled={loading} className="hidden" />

        {file ? (
          <>
            <FileText className="w-10 h-10 text-emerald-400" />
            <div className="space-y-1">
              <p className="text-sm font-mono text-emerald-100">{file.name}</p>
              <p className="text-[10px] text-emerald-500/60 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className={`w-10 h-10 transition-colors ${dragging ? 'text-emerald-400' : 'text-emerald-900'}`} />
            <div>
              <p className="text-sm text-zinc-500">
                Перетягніть файл або <span className="text-emerald-500 hover:text-emerald-400 underline decoration-emerald-500/30">виберіть шлях</span>
              </p>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`
          w-full py-4 rounded-lg text-xs font-black transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-[0.1em]
          ${file && !loading
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]'
            : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono">
              PUSHING: {uploadedCount}/{rowCount} <span className="opacity-60">{timeLeft}</span>
            </span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            SUCCESS_LOADED
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