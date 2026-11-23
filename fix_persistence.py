import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_states = """  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [saleItems, setSaleItems] = useState<SaleItem[]>(initialSaleItems);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);"""

new_states = """  const [categories, setCategories] = useState<Category[]>(() => { const s = localStorage.getItem('fx_cat'); return s ? JSON.parse(s) : initialCategories; });
  const [products, setProducts] = useState<Product[]>(() => { const s = localStorage.getItem('fx_prod'); return s ? JSON.parse(s) : initialProducts; });
  const [customers, setCustomers] = useState<Customer[]>(() => { const s = localStorage.getItem('fx_cust'); return s ? JSON.parse(s) : initialCustomers; });
  const [sales, setSales] = useState<Sale[]>(() => { const s = localStorage.getItem('fx_sale'); return s ? JSON.parse(s) : initialSales; });
  const [saleItems, setSaleItems] = useState<SaleItem[]>(() => { const s = localStorage.getItem('fx_sitem'); return s ? JSON.parse(s) : initialSaleItems; });
  const [debts, setDebts] = useState<Debt[]>(() => { const s = localStorage.getItem('fx_debt'); return s ? JSON.parse(s) : initialDebts; });

  useEffect(() => { localStorage.setItem('fx_cat', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('fx_prod', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('fx_cust', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('fx_sale', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('fx_sitem', JSON.stringify(saleItems)); }, [saleItems]);
  useEffect(() => { localStorage.setItem('fx_debt', JSON.stringify(debts)); }, [debts]);"""

content = content.replace(old_states, new_states)

old_reset = """  const resetDemoState = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données de simulation aux valeurs d\\'origine de Bujumbura ?')) {
      setCategories(initialCategories);
      setProducts(initialProducts);
      setCustomers(initialCustomers);
      setSales(initialSales);
      setSaleItems(initialSaleItems);
      setDebts(initialDebts);
      setCart([]);
      showNotification('success', 'Données de simulation réinitialisées.');
    }
  };"""

new_reset = """  const resetDemoState = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données de simulation aux valeurs d\\'origine de Bujumbura ?')) {
      localStorage.clear();
      setCategories(initialCategories);
      setProducts(initialProducts);
      setCustomers(initialCustomers);
      setSales(initialSales);
      setSaleItems(initialSaleItems);
      setDebts(initialDebts);
      setCart([]);
      showNotification('success', 'Données de simulation réinitialisées avec succès.');
    }
  };"""

content = content.replace(old_reset, new_reset)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Persistence added.")
