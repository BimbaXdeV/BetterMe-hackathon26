import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Layers } from 'lucide-react';
import type { Order } from '../types';

interface Props {
  orders: Order[];
}

type SortKey = 'id' | 'subtotal' | 'composite_tax_rate' | 'tax_amount' | 'total_amount';

export const OrdersTable = ({ orders }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...orders].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * mul;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-zinc-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-emerald-400" />
      : <ChevronDown className="w-3 h-3 text-emerald-400" />;
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'composite_tax_rate', label: 'Tax Rate' },
    { key: 'tax_amount', label: 'Tax Amount' },
    { key: 'total_amount', label: 'Total' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
          03
        </span>
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Список заказов
        </h2>
        {orders.length > 0 && (
          <span className="ml-auto text-xs font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-md">
            {orders.length} записей
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/40">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-5 py-3 text-left cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Lat / Lon</span>
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-zinc-600">
                    <Layers className="w-8 h-8" />
                    <p className="text-sm font-mono">
                      Заказов пока нет — загрузи CSV или создай вручную
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((order) => (
                <>
                  <tr
                    key={order.id}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-zinc-500 text-xs">#{order.id}</td>
                    <td className="px-5 py-3 font-mono text-zinc-300">${order.subtotal.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {(order.composite_tax_rate * 100).toFixed(3)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-400">${order.tax_amount.toFixed(2)}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-emerald-400">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-600">
                      {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {expandedId === order.id
                        ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500 inline" />
                        : <ChevronDown className="w-3.5 h-3.5 text-zinc-600 inline" />}
                    </td>
                  </tr>

                  {/* Expanded breakdown */}
                  {expandedId === order.id && (
                    <tr key={`${order.id}-breakdown`} className="bg-zinc-800/30">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="flex items-center gap-6 text-xs font-mono">
                          <span className="text-zinc-500 uppercase tracking-wider">Breakdown:</span>
                          {[
                            { label: 'State', val: order.breakdown.state_rate },
                            { label: 'County', val: order.breakdown.county_rate },
                            { label: 'City', val: order.breakdown.city_rate },
                            { label: 'Special', val: order.breakdown.special_rates },
                          ].map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5">
                              <span className="text-zinc-600">{b.label}</span>
                              <span className="text-zinc-300">{(b.val * 100).toFixed(3)}%</span>
                            </div>
                          ))}
                          {order.jurisdictions && order.jurisdictions.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-4">
                              <span className="text-zinc-600">Jurisdictions:</span>
                              <span className="text-zinc-400">{order.jurisdictions.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
