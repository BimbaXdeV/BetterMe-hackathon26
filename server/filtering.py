import pandas as pd
import urllib.parse

class Filter():
    def init(self):
        pass

    async def filter(self, orders_db, county=None, min_subtotal=None, min_tax=None, min_rate=None, to_show_errors=None):
        if not orders_db:
            return []

        try:
            df = pd.DataFrame(orders_db)
            mask = pd.Series([True] * len(df))

           
            if county and str(county).strip():
                decoded = urllib.parse.unquote(str(county))
                clean_name = decoded.split(',')[0].strip()
                mask &= df['jurisdictions'].str.contains(clean_name, case=False, na=False, regex=False)

           
            if min_subtotal is not None:
                df['subtotal'] = pd.to_numeric(df['subtotal'], errors='coerce')
                mask &= df['subtotal'] >= float(min_subtotal)

            if min_tax is not None:
                df['tax_amount'] = pd.to_numeric(df['tax_amount'], errors='coerce')
                mask &= df['tax_amount'] >= float(min_tax)

            if min_rate is not None:
                df['composite_tax_rate'] = pd.to_numeric(df['composite_tax_rate'], errors='coerce')
                mask &= df['composite_tax_rate'] >= float(min_rate)

          
            if to_show_errors is False and 'isInNewYork' in df.columns:
                mask &= df['isInNewYork'] == True

           
            return [orders_db[i] for i, val in enumerate(mask) if val]

        except Exception as e:
            print(f"Помилка в Pandas: {e}")
            return orders_db