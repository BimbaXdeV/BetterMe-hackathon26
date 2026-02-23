import  {useState, useEffect} from 'react';
import axios from 'axios';
import  {ImportCSV} from './components/ImportCSV';
import { ManualOrderForm } from './components/ManualOrderForm';
import  { OrdersTable } from './components/OrdersTable';
import  type { Order } from './types';

function App(){
  const [orders, setOrders] = useState<Order[]>([]);
  //стук к  бэку за списком  заказов

  const  fetchOrders = async () => {
    try {
      const  response = await axios.get('http://locolhost:3000/orders');
      //если  с  бэка  {data : [...]}

      if(response.data && response.data.data){
        setOrders(response.data.data);
      } else if(Array.isArray(response.data)){
        // для  массива 
        setOrders(response.data);

      }
    } catch (error){
      console.error('Ошибка  при загрузке  заказов:', error);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);

  return(
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1> BetterMe: Tax Admin Panel</h1>
      <hr style={{marginBottom: '20px'}}/>


      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{flex: '1 1 400px'}}>
          {/* Передаем fetchOrders, чтобы после загрузки таблица сама обновилась */}
          <ImportCSV/>
        </div>
        <div style={{flex: '1 1 400px'}}>
          <ManualOrderForm/>
        </div>
      </div>
      <OrdersTable orders = {orders}/>
    </div>
  );
}
export default App;