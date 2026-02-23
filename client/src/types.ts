export interface OrderInput {
  latitude: number;   // широта точки доставки 
  longitude: number;  // долгота точки доставки 
  subtotal: number;   // цена без налога 
  timestamp: string;  // время заказа 
}

//Детализация налоговых ставок 
export interface TaxBreakdown {
  state_rate: number;    // ставка штата 
  county_rate: number;   // ставка округа 
  city_rate: number;     // ставка города 
  special_rates: number; // специальные налоги 
}

//Полный объект заказа, который возвращает API после расчетов
export interface Order extends OrderInput {
  id: number;                   // уникальный ID в базе данных
  composite_tax_rate: number;   // итоговая ставка (напр. 0.08875)
  tax_amount: number;           // сумма налога (subtotal * rate)
  total_amount: number;         // итоговая сумма к оплате 
  breakdown: TaxBreakdown;      // объект с расшифровкой ставок 
  jurisdictions?: string[];     // (бонус) названия примененных юрисдикций 
}

//Тип для ответа от API при получении списка (для пагинации)
export interface OrdersResponse {
  data: Order[];       // массив заказов для текущей страницы 
  total: number;       // общее количество заказов 
  page: number;        // текущая страница
  limit: number;       // количество элементов на страницу
}