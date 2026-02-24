import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronDown, ChevronUp, Layers,
  ChevronLeft, ChevronRight, Search, Filter, DollarSign, MapPin
} from 'lucide-react';
import type { Order } from '../types';

export const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [countyFilter, setCountyFilter] = useState('');
  const [minSubtotal, setMinSubtotal] = useState<string>('');
  const [minTaxAmount, setMinTaxAmount] = useState<string>('');
  const [minTaxRate, setMinTaxRate] = useState<string>('');

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
        }
      });
      setOrders(response.data.orders);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [countyFilter, minSubtotal, minTaxAmount, minTaxRate]);
  useEffect(() => { fetchOrders(); }, [page, countyFilter, minSubtotal, minTaxAmount, minTaxRate]);

  const filterInputClass = `
    input-glow w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4
    text-xs font-mono text-zinc-300 focus:border-emerald-500 outline-none
  `;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="animate-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Округ..." value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)} className={filterInputClass} />
        </div>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="number" placeholder="Мин. Subtotal..." value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)} className={filterInputClass} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="number" placeholder="Мин. Налог ($)..." value={minTaxAmount}
            onChange={(e) => setMinTaxAmount(e.target.value)} className={filterInputClass} />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">%</span>
          <input type="number" placeholder="Мин. Ставка (%)..." value={minTaxRate}
            onChange={(e) => setMinTaxRate(e.target.value)} className={filterInputClass} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">03</span>
          <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">Реестр заказов</h2>
          <span className="ml-auto text-[10px] font-mono text-zinc-500 uppercase">Найдено: {totalCount}</span>
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
                // Shimmer skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/40">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className={`shimmer h-3 rounded ${j === 1 ? 'w-24' : 'w-16'} mx-auto`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-zinc-600 font-mono animate-fade-in">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Ничего не найдено
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
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-300">{order.jurisdictions}</span>
                          <span className="text-[9px] text-zinc-600 font-mono">
                            {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-zinc-300 text-right">${order.subtotal.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                          {(order.composite_tax_rate * 100).toFixed(3)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-zinc-400 text-right">${order.tax_amount.toFixed(2)}</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400 text-right">${order.total_amount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        {expandedId === order.id
                          ? <ChevronUp className="w-4 h-4 text-emerald-500 inline transition-transform" />
                          : <ChevronDown className="w-4 h-4 text-zinc-700 inline group-hover:text-zinc-400 transition-colors" />
                        }
                      </td>
                    </tr>

                    {/* Новая плавная строка детализации */}
                    <tr className="bg-zinc-950/50">
                      <td colSpan={7} className="p-0">
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            expandedId === order.id
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            {/* Внутренняя обертка с рамкой и отступами */}
                            <div className={`px-5 py-4 border-l-2 transition-colors duration-300 ${
                              expandedId === order.id ? 'border-emerald-500/30' : 'border-transparent'
                            }`}>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[10px] font-mono">
                                <div>
                                  <p className="text-zinc-600 uppercase mb-1">State Rate</p>
                                  <p className="text-zinc-300">{((order.breakdown?.state_rate || 0) * 100).toFixed(3)}%</p>
                                </div>
                                <div>
                                  <p className="text-zinc-600 uppercase mb-1">County Rate</p>
                                  <p className="text-zinc-300">{((order.breakdown?.county_rate || 0) * 100).toFixed(3)}%</p>
                                </div>
                                <div>
                                  <p className="text-zinc-600 uppercase mb-1">City/Special</p>
                                  <p className="text-zinc-300">{((order.breakdown?.special_rates || 0) * 100).toFixed(3)}%</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <div>
                                    <p className="text-zinc-600 uppercase mb-1">Timestamp</p>
                                    <p className="text-zinc-300">{new Date(order.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Страница {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="page-btn p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="page-btn p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-20"
            >
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
