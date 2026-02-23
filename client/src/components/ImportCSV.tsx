import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  onSuccess?: () => void;
}

export const ImportCSV = ({ onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setSuccess(false);
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

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/orders/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setFile(null);
      alert('Файл успешно загружен и обработан!');
      onSuccess?.();
    } catch (error) {
      console.error('Ошибка при загрузке:', error);
      alert('Произошла ошибка при импорте');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
          01
        </span>
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Импорт из CSV
        </h2>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 p-8
          flex flex-col items-center justify-center gap-3 text-center
          ${dragging
            ? 'border-emerald-400 bg-emerald-400/5'
            : file
            ? 'border-zinc-600 bg-zinc-800/50'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/30 hover:bg-zinc-800/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />

        {file ? (
          <>
            <FileText className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">{file.name}</p>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className={`w-8 h-8 transition-colors ${dragging ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <div>
              <p className="text-sm text-zinc-400">
                Перетащи CSV или <span className="text-emerald-400 underline">выбери файл</span>
              </p>
              <p className="text-xs text-zinc-600 font-mono mt-1">.csv · до 50 MB</p>
            </div>
          </>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`
          w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
          ${file && !loading
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 cursor-pointer shadow-lg shadow-emerald-500/20'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Обработка...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Загружено!
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            Загрузить и рассчитать
          </>
        )}
      </button>
    </div>
  );
};
