import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ChevronDown,  Layers,
  ChevronLeft, ChevronRight, Search, Filter, DollarSign
} from 'lucide-react';
import type { Order } from '../types';

const NY_COUNTIES = [
  "Albany, New York State",
  "Allegany, New York State",
  "Bronx, New York State",
  "Broome, New York State",
  "Cattaraugus, New York State",
  "Cayuga, New York State",
  "Chautauqua, New York State",
  "Chemung, New York State",
  "Chenango, New York State",
  "Clinton, New York State",
  "Columbia, New York State",
  "Cortland, New York State",
  "Delaware, New York State",
  "Dutchess, New York State",
  "Erie, New York State",
  "Essex, New York State",
  "Franklin, New York State",
  "Fulton, New York State",
  "Genesee, New York State",
  "Greene, New York State",
  "Hamilton, New York State",
  "Herkimer, New York State",
  "Jefferson, New York State",
  "Kings, New York State",
  "Lewis, New York State",
  "Livingston, New York State",
  "Madison, New York State",
  "Monroe, New York State",
  "Montgomery, New York State",
  "Nassau, New York State",
  "New York, New York State",
  "Niagara, New York State",
  "Oneida, New York State",
  "Onondaga, New York State",
  "Ontario, New York State",
  "Orange, New York State",
  "Orleans, New York State",
  "Oswego, New York State",
  "Otsego, New York State",
  "Putnam, New York State",
  "Queens, New York State",
  "Rensselaer, New York State",
  "Richmond, New York State",
  "Rockland, New York State",
  "St. Lawrence, New York State",
  "Saratoga, New York State",
  "Schenectady, New York State",
  "Schoharie, New York State",
  "Schuyler, New York State",
  "Seneca, New York State",
  "Steuben, New York State",
  "Suffolk, New York State",
  "Sullivan, New York State",
  "Tioga, New York State",
  "Tompkins, New York State",
  "Ulster, New York State",
  "Warren, New York State",
  "Washington, New York State",
  "Wayne, New York State",
  "Westchester, New York State",
  "Wyoming, New York State",
  "Yates, New York State"
];

export const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredTax, setFilteredTax] = useState(0);
  const [filteredRevenue, setFilteredRevenue] = useState(0);

  const [toShowErrors, settoShowErrors] = useState(true);
  const [countyFilter, setCountyFilter] = useState('');
  const [minSubtotal, setMinSubtotal] = useState<string>('');
  const [minTaxAmount, setMinTaxAmount] = useState<string>('');
  const [minTaxRate, setMinTaxRate] = useState<string>('');

  // Состояния для подсказок
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [filteredCounties, setFilteredCounties] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/orders', {
        params: {
          page,
          limit: 15,
          county: countyFilter || undefined,
          min_subtotal: minSubtotal || undefined,
          min_tax: minTaxAmount || undefined,
          min_rate: minTaxRate ? parseFloat(minTaxRate) / 100 : undefined,
          to_show_errors: toShowErrors || undefined
        }
      });
      setOrders(response.data.orders);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total);
      setFilteredTax(response.data.total_tax || 0);
      setFilteredRevenue(response.data.total_revenue || 0);
    } catch (error) {
      console.error('Помилка завантаження:', error);
    } finally {
      setLoading(false);
    }
  };

  // Логика фильтрации подсказок (ПО НАЧАЛУ СЛОВА)
  useEffect(() => {
    const query = countyFilter.trim().toLowerCase();
    if (query === '') {
      setFilteredCounties([]);
      setIsSuggestionsOpen(false);
    } else {
      const filtered = NY_COUNTIES.filter(c =>
        c.toLowerCase().startsWith(query)
      );
      setFilteredCounties(filtered);
      setIsSuggestionsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    }
  }, [countyFilter]);

  // Обработка клавиш (Вверх, Вниз, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSuggestionsOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredCounties.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      setCountyFilter(filteredCounties[selectedIndex]);
      setIsSuggestionsOpen(false);
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
    }
  };

  // Закрытие по клику вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setPage(1); }, [countyFilter, minSubtotal, minTaxAmount, minTaxRate, toShowErrors]);
  useEffect(() => { fetchOrders(); }, [page, countyFilter, minSubtotal, minTaxAmount, minTaxRate, toShowErrors]);

  const textInputClass = `
    input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4
    text-xs font-mono text-zinc-300 focus:border-emerald-500 outline-none transition-all
  `;

  return (
    <div className="space-y-4">
      {/* ─── Блок фильтров ─── */}
      <div className="animate-fade-up flex flex-wrap lg:flex-nowrap items-center gap-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-xl relative z-20">
        
        <div className="flex items-center gap-3 px-2 min-w-fit">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={toShowErrors}
              onChange={(e) => settoShowErrors(e.target.checked)} 
              className="custom-checkbox" 
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 group-hover:text-emerald-400 transition-colors">
              Помилки
            </span>
          </label>
        </div>

        <div className="hidden lg:block w-px h-6 bg-zinc-800" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Контейнер поиска */}
          <div className="relative" ref={suggestionsRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Округ..." 
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              onFocus={() => countyFilter && setIsSuggestionsOpen(true)}
              onKeyDown={handleKeyDown}
              className={textInputClass}
            />
            
            {isSuggestionsOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-[999] bg-zinc-950 border border-zinc-800 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 scrollbar-thin scrollbar-thumb-zinc-800">
                {filteredCounties.map((county, index) => (
                  <div
                    key={county}
                    onClick={() => {
                      setCountyFilter(county);
                      setIsSuggestionsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-2.5 text-[11px] font-mono cursor-pointer transition-colors border-b border-zinc-900/50 last:border-0 flex items-center gap-2 
                      ${selectedIndex === index ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400'}`}
                  >
                    <span className={`text-[10px] ${selectedIndex === index ? 'text-emerald-400' : 'text-emerald-500 opacity-50'}`}>›</span>
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

      {/* ─── Таблица заказов ─── */}
      <div className="table-card mt-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative z-10">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">03</span>
          <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase font-display">Реєстр замовлень</h2>
          
          <div className="ml-auto flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none">Фільтр Податок</span>
              <span className="text-xs font-mono text-emerald-500 font-bold">${filteredTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none">Фільтр Виручка</span>
              <span className="text-xs font-mono text-white font-bold">${filteredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/40">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="shimmer h-3 rounded w-full mx-auto" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-zinc-600 font-mono">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Нічого не знайдено
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="table-row hover:bg-emerald-500/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">#{order.id}</td>
                      <td className="px-5 py-4 text-zinc-300 font-semibold">{order.jurisdictions}</td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400">${order.subtotal.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                          {(order.composite_tax_rate * 100).toFixed(3)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400">${order.tax_amount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-400 font-bold">${order.total_amount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <ChevronDown className={`w-4 h-4 text-zinc-700 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
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