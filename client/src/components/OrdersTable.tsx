import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  ChevronLeft, ChevronRight, Search, Filter, DollarSign
} from 'lucide-react';
import type { Order } from '../types';

// Список округов NY. Если честно, я выучил их названия лучше, чем имена соседей, пока мы это дебажили.
const NY_COUNTIES = [
  "Albany, New York State", "Allegany, New York State", "Bronx, New York State",
  "Broome, New York State", "Cattaraugus, New York State", "Cayuga, New York State",
  "Chautauqua, New York State", "Chemung, New York State", "Chenango, New York State",
  "Clinton, New York State", "Columbia, New York State", "Cortland, New York State",
  "Delaware, New York State", "Dutchess, New York State", "Erie, New York State",
  "Essex, New York State", "Franklin, New York State", "Fulton, New York State",
  "Genesee, New York State", "Greene, New York State", "Hamilton, New York State",
  "Herkimer, New York State", "Jefferson, New York State", "Kings, New York State",
  "Lewis, New York State", "Livingston, New York State", "Madison, New York State",
  "Monroe, New York State", "Montgomery, New York State", "Nassau, New York State",
  "New York, New York State", "Niagara, New York State", "Oneida, New York State",
  "Onondaga, New York State", "Ontario, New York State", "Orange, New York State",
  "Orleans, New York State", "Oswego, New York State", "Otsego, New York State",
  "Putnam, New York State", "Queens, New York State", "Rensselaer, New York State",
  "Richmond, New York State", "Rockland, New York State", "St. Lawrence, New York State",
  "Saratoga, New York State", "Schenectady, New York State", "Schoharie, New York State",
  "Schuyler, New York State", "Seneca, New York State", "Steuben, New York State",
  "Suffolk, New York State", "Sullivan, New York State", "Tioga, New York State",
  "Tompkins, New York State", "Ulster, New York State", "Warren, New York State",
  "Washington, New York State", "Wayne, New York State", "Westchester, New York State",
  "Wyoming, New York State", "Yates, New York State"
];

interface Props {
  refreshTrigger?: number;
}

export const OrdersTable = ({ refreshTrigger = 0 }: Props) => {
  // --- STATE: Храним всё, что нажито непосильным трудом ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Статистика фильтрации (чтобы видеть, сколько налоговая у нас отнимет на этот раз)
  const [filteredTax, setFilteredTax] = useState(0);
  const [filteredRevenue, setFilteredRevenue] = useState(0);

  // Фильтры (наш щит против хаоса в данных)
  const [toShowErrors, setToShowErrors] = useState(true);
  const [countyFilter, setCountyFilter] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [minTaxAmount, setMinTaxAmount] = useState('');
  const [minTaxRate, setMinTaxRate] = useState('');

  // UI стейты: подсказки, контроллеры и прочие радости жизни
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [filteredCounties, setFilteredCounties] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- LOGIC: Магия получения данных ---
  const fetchOrders = useCallback(async () => {
    // Убиваем старый запрос, если он еще дышит. В очереди должен быть только один!
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const queryParams: any = {
        page,
        limit: 15,
        to_show_errors: toShowErrors
      };

      // Чистим фильтры перед отправкой (пустые строки серверу не интересны)
      if (countyFilter.trim()) queryParams.county = countyFilter.trim();
      if (minSubtotal) queryParams.min_subtotal = Number(minSubtotal);
      if (minTaxAmount) queryParams.min_tax = Number(minTaxAmount);
      if (minTaxRate) queryParams.min_rate = Number(minTaxRate);

      const { data } = await axios.get('/orders', { 
        params: queryParams,
        signal: abortControllerRef.current.signal 
      });

      setOrders(data.orders || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setFilteredTax(data.total_tax || 0);
      setFilteredRevenue(data.total_revenue || 0);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Запрос отменен. Спокойно, это нормально.');
      } else {
        console.error('Сервер сказал "ой":', error);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [page, countyFilter, minSubtotal, minTaxAmount, minTaxRate, toShowErrors]);

  // --- EFFECTS: Следим за миром ---

  // Подсказки округов (автокомплит — это когда ты ленив, но хочешь выглядеть профи)
  useEffect(() => {
    const query = countyFilter.trim().toLowerCase();
    if (!query) {
      setFilteredCounties([]);
      setIsSuggestionsOpen(false);
    } else {
      const filtered = NY_COUNTIES.filter(c => c.toLowerCase().startsWith(query));
      setFilteredCounties(filtered);
      setIsSuggestionsOpen(filtered.length > 0);
    }
  }, [countyFilter]);

  // Закрываем выпадашку, если кликнули "куда-то туда"
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Дебаунс: ждем, пока юзер закончит яростно печатать, прежде чем мучить сервер
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fetchOrders, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [fetchOrders, refreshTrigger]);

  // Сбрасываем страницу в начало, если фильтры поменялись. Логично же!
  useEffect(() => {
    setPage(1);
  }, [countyFilter, minSubtotal, minTaxAmount, minTaxRate, toShowErrors, refreshTrigger]);

  const textInputClass = `
    input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4
    text-xs font-mono text-zinc-300 focus:border-emerald-500 outline-none transition-all
  `;

  return (
    <div className="space-y-4">
      {/* --- СЕКЦИЯ ФИЛЬТРОВ: Чтобы найти иголку в стоге налогов --- */}
      <div className="animate-fade-up flex flex-wrap lg:flex-nowrap items-center gap-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-xl relative z-20">
        <div className="flex items-center gap-3 px-2 min-w-fit">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={toShowErrors}
              onChange={(e) => setToShowErrors(e.target.checked)} 
              className="custom-checkbox" 
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 group-hover:text-emerald-400 transition-colors">
              Помилки
            </span>
          </label>
        </div>

        <div className="hidden lg:block w-px h-6 bg-zinc-800" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Автокомплит округа */}
          <div className="relative" ref={suggestionsRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Округ..." 
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              onFocus={() => countyFilter && setIsSuggestionsOpen(true)}
              className={textInputClass}
            />
            {isSuggestionsOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-[999] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                {filteredCounties.map((county) => (
                  <div
                    key={county}
                    onClick={() => { setCountyFilter(county); setIsSuggestionsOpen(false); }}
                    className="px-4 py-2.5 text-[11px] font-mono cursor-pointer transition-colors border-b border-zinc-900/50 hover:bg-emerald-500/10 hover:text-emerald-400 text-zinc-400"
                  >
                    {county}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="number" placeholder="Мін. Subtotal..." value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)} className={textInputClass} />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="number" placeholder="Мін. Податок ($)..." value={minTaxAmount}
              onChange={(e) => setMinTaxAmount(e.target.value)} className={textInputClass} />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 font-mono">%</span>
            <input type="number" placeholder="Мін. Ставка (%)..." value={minTaxRate}
              onChange={(e) => setMinTaxRate(e.target.value)} className={textInputClass} />
          </div>
        </div>
      </div>

      {/* --- ТАБЛИЦА: Сердце нашей админки --- */}
      <div className="table-card mt-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative z-10">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">03</span>
          <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase font-display">Реєстр замовлень</h2>
          
          <div className="ml-auto flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none">Фільтр Податок</span>
              <span className="text-xs font-mono text-emerald-500 font-bold">${Number(filteredTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none">Фільтр Виручка</span>
              <span className="text-xs font-mono text-white font-bold">${Number(filteredRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end border-l border-zinc-800 pl-4">
              <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none">Знайдено</span>
              <span className="text-xs font-mono text-zinc-300">{totalCount}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/40 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Jurisdiction</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
                <th className="px-5 py-3 text-right">Tax Rate</th>
                <th className="px-5 py-3 text-right">Tax Amount</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-center">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center font-mono text-zinc-500 animate-pulse">Завантаження...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-zinc-600 font-mono">Нічого не знайдено (може пощастить наступного разу?)</td></tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="table-row hover:bg-emerald-500/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">#{order.id}</td>
                      <td className="px-5 py-4 text-zinc-300 font-semibold">{order.jurisdictions}</td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400">${Number(order.subtotal || 0).toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                          {(Number(order.composite_tax_rate || 0) * 100).toFixed(3)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400">${Number(order.tax_amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-400 font-bold">${Number(order.total_amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <ChevronDown className={`w-4 h-4 text-zinc-700 transition-transform ${expandedId === order.id ? 'rotate-180 text-emerald-500' : ''}`} />
                      </td>
                    </tr>

                    {/* Breakdown Panel — Аккуратный ряд, всё как мы любим */}
                    {expandedId === order.id && (
                      <tr className="bg-zinc-950/40 border-b border-zinc-800">
                        <td colSpan={7} className="px-8 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest">Tax Breakdown:</span>
                              <div className="flex gap-4 text-[11px] font-mono">
                                <span className="text-zinc-400">State: <span className="text-emerald-400">4.000%</span></span>
                                <span className="text-zinc-400">County: <span className="text-emerald-400">{(Number(order.breakdown?.county_rate || 0) * 100).toFixed(3)}%</span></span>
                                <span className="text-zinc-400">Special: <span className="text-emerald-400">{(Number(order.breakdown?.special_rates || 0) * 100).toFixed(3)}%</span></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Geo:</span>
                                <span className="text-[11px] font-mono text-zinc-300">[{order.latitude}, {order.longitude}]</span>
                              </div>
                              <div className="h-4 w-px bg-zinc-800" />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Full Info:</span>
                                <span className="text-[11px] text-zinc-300 font-mono italic">{order.jurisdictions}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ПАГИНАЦИЯ: Чтобы не утонуть в данных */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Сторінка {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="page-btn p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="page-btn p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};