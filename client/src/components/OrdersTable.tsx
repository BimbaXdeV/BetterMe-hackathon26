import type { Order } from '../types';

interface Props {
  orders: Order[];
}

export const OrdersTable = ({ orders }: Props) => {
  return (
    <div style={{ marginTop: '30px', overflowX: 'auto' }}>
      <h3>3. Список заказов (Orders List)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#333', color: 'white' }}>
            <th style={{ padding: '10px', border: '1px solid #444' }}>ID</th>
            <th style={{ padding: '10px', border: '1px solid #444' }}>Lat / Lon</th>
            <th style={{ padding: '10px', border: '1px solid #444' }}>Subtotal</th>
            <th style={{ padding: '10px', border: '1px solid #444' }}>Tax Rate</th>
            <th style={{ padding: '10px', border: '1px solid #444' }}>Tax Amount</th>
            <th style={{ padding: '10px', border: '1px solid #444' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                Заказов пока нет. Загрузи CSV или создай вручную!
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ padding: '10px' }}>{order.id}</td>
                <td style={{ padding: '10px' }}>
                  {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                </td>
                <td style={{ padding: '10px' }}>${order.subtotal.toFixed(2)}</td>
                <td style={{ padding: '10px' }}>
                  {(order.composite_tax_rate * 100).toFixed(3)}%
                </td>
                <td style={{ padding: '10px' }}>${order.tax_amount.toFixed(2)}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ${order.total_amount.toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};