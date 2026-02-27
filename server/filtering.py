import pandas as pd

class Filter():
    def __init__(self):
        self.county = None
        self.min_subtotal = None
        self.min_tax = None
        self.min_rate = None
        self.to_show_errors = None

    async def filter(self, orders_db, county = None, min_subtotal = None, min_tax = None, min_rate = None, to_show_errors = None):
        df = pd.DataFrame(orders_db)

        # Создаем маску (набор условий)
        mask = True

        if None != county:
            mask &= df['jurisdictions'].str.contains(county, case=False)
            self.county = county
        if None != min_subtotal:
            mask &= df['subtotal'] >= min_subtotal
            self.min_subtotal = min_subtotal
        if None != min_tax:
            mask &= df['tax_amount'] >= min_tax
            self.min_tax = min_tax
        if None != min_rate:
            mask &= df['composite_tax_rate'] >= min_rate
            self.min_rate = min_rate

        try:
            if False == to_show_errors:
                mask &= df['isInNewYork'] == True
            filtered_orders = df[mask].to_dict('records')
        except Exception as e:
            filtered_orders = orders_db.copy()

        return filtered_orders