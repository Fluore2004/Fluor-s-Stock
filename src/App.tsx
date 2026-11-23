/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Code, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  DollarSign, 
  LogOut, 
  User, 
  Phone, 
  Layers, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles, 
  ChevronRight,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Printer,
  QrCode,
  X,
  Calendar,
  CalendarRange,
  Banknote,
  Smartphone,
  Building2,
  Filter,
  Percent,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { 
  initialCategories, 
  initialProducts, 
  initialCustomers 
} from './data/mockData';
import { backendFiles } from './data/backendFiles';
import { Category, Product, Customer, Sale, SaleItem, Debt, PaymentMethod, Expense, CompanySettings } from './types';
import { 
  computePeriodicFinancials, 
  computeTodayPaymentBreakdown, 
  calculateSalesProfit, 
  filterSalesByDateRange 
} from './utils/finance';
import { printA4SalesReport } from './utils/printA4Report';

const defaultCompanySettings: CompanySettings = {
  name: 'Nom du Commerce',
  address: 'Bujumbura, Burundi',
  phone: '+257 22 00 00 00',
  email: 'contact@commerce.bi',
  nif: '4000000000',
  currency: 'BIF',
  receiptHeader: 'FACTURE OFFICIELLE • DEFFLOX STOCK & FINANCE',
  receiptFooterMessage: 'Merci pour votre visite et à bientôt !',
  autoPrintReceipt: true,
  criticalStockThreshold: 5,
  allowNegativeStock: false,
  allowEmployeeDiscount: false,
  allowEmployeeViewMargins: false,
  defaultUserRole: 'Gérant'
};

export default function App() {
  // --- STATES & PERMISSIONS ---
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    role: 'Gérant' | 'Employé';
  } | null>(() => {
    const s = localStorage.getItem('fx_user');
    if (s) {
      try {
        return JSON.parse(s);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: 1,
      username: 'admin',
      role: 'Gérant'
    };
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [categories, setCategories] = useState<Category[]>(() => {
    const s = localStorage.getItem('fx_cat') ?? localStorage.getItem('categories');
    return s !== null ? JSON.parse(s) : initialCategories;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const s = localStorage.getItem('fx_prod') ?? localStorage.getItem('products');
    return s !== null ? JSON.parse(s) : initialProducts;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const s = localStorage.getItem('fx_cust') ?? localStorage.getItem('customers');
    return s !== null ? JSON.parse(s) : initialCustomers;
  });

  // Sales, Debts, Expenses, SaleItems: ALWAYS default to [] if not saved or empty
  const [sales, setSales] = useState<Sale[]>(() => {
    const s = localStorage.getItem('fx_sale') ?? localStorage.getItem('sales');
    return s !== null ? JSON.parse(s) : [];
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>(() => {
    const s = localStorage.getItem('fx_sitem') ?? localStorage.getItem('saleItems');
    return s !== null ? JSON.parse(s) : [];
  });
  const [debts, setDebts] = useState<Debt[]>(() => {
    const s = localStorage.getItem('fx_debt') ?? localStorage.getItem('debts');
    return s !== null ? JSON.parse(s) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const s = localStorage.getItem('fx_exp') ?? localStorage.getItem('expenses');
    return s !== null ? JSON.parse(s) : [];
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const s = localStorage.getItem('fx_company_settings');
    return s ? { ...defaultCompanySettings, ...JSON.parse(s) } : defaultCompanySettings;
  });

  useEffect(() => {
    localStorage.setItem('fx_cat', JSON.stringify(categories));
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('fx_prod', JSON.stringify(products));
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('fx_cust', JSON.stringify(customers));
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('fx_sale', JSON.stringify(sales));
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem('fx_sitem', JSON.stringify(saleItems));
    localStorage.setItem('saleItems', JSON.stringify(saleItems));
  }, [saleItems]);
  useEffect(() => {
    localStorage.setItem('fx_debt', JSON.stringify(debts));
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);
  useEffect(() => {
    localStorage.setItem('fx_exp', JSON.stringify(expenses));
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem('fx_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fx_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fx_user');
    }
  }, [currentUser]);

  // Active Menu Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'pos' | 'debts' | 'code' | 'settings'>(() => {
    const savedUser = localStorage.getItem('fx_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.role === 'Employé') return 'pos';
      } catch (e) {
        // fallback
      }
    }
    return 'dashboard';
  });

  // Strict role guard: Employe cannot access Dashboard or Settings
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Gérant') {
      if (activeTab === 'dashboard' || activeTab === 'settings') {
        setActiveTab('pos');
      }
    }
  }, [currentUser, activeTab]);

  // --- SEARCH & FILTER STATES ---
  // Stock
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<number | 'all'>('all');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // New Product Form
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    category_id: 1,
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    alert_quantity: 5
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // New Category Form
  const [newCategoryName, setNewCategoryName] = useState('');

  // POS / Caisse State
  const [posSearch, setPosSearch] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [paymentStatus, setPaymentStatus] = useState<'Cash' | 'Dette'>('Cash');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('Espèces');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | 'new' | ''>('');
  
  // New Customer inside POS
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [isCreatingCustomerPOS, setIsCreatingCustomerPOS] = useState(false);
  const [amountPaidInitial, setAmountPaidInitial] = useState<number>(0);

  // Payment Validation & Confirmation Workflow States
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReferenceError, setPaymentReferenceError] = useState<string | null>(null);
  const [isPaymentConfirmedByCashier, setIsPaymentConfirmedByCashier] = useState(true);

  // Financial Dashboard Custom Date Range Filter State
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [customPeriodPreset, setCustomPeriodPreset] = useState<string>('7d');

  // Debts State
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentMethod, setRepaymentMethod] = useState<PaymentMethod>('Espèces');
  const [repaymentReference, setRepaymentReference] = useState<string>('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'Pending' | 'Paid'>('all');

  // Developer Code Viewer State & Settings Sub-Tab State
  const [selectedCodeFile, setSelectedCodeFile] = useState<keyof typeof backendFiles>('schemaSql');
  const [copiedFile, setCopiedFile] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'boutique' | 'recus' | 'stock' | 'droits'>('boutique');
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // Expenses State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isResetFinancialsModalOpen, setIsResetFinancialsModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [newExpense, setNewExpense] = useState({
    reason: '',
    amount: '',
    category: 'Fournitures' as Expense['category'],
    payment_method: 'Espèces' as Expense['payment_method'],
  });

  // --- NOTIFICATION BANNER STATE ---
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // --- HELPER FUNCTIONS ---
  const formatBIF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + (companySettings?.currency || 'BIF');
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Inconnu';
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return 'Client Comptant (Anonyme)';
    return customers.find(c => c.id === customerId)?.name || 'Client Inconnu';
  };

  const getSaleProfit = (saleId: number) => {
    const items = saleItems.filter(item => item.sale_id === saleId);
    let profit = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        profit += item.quantity * (item.unit_price - product.purchase_price);
      }
    }
    return profit;
  };

  const applyDatePreset = (preset: string) => {
    setCustomPeriodPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (preset === 'today') {
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setCustomStartDate(yStr);
      setCustomEndDate(yStr);
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomEndDate(todayStr);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setCustomStartDate(d.toISOString().split('T')[0]);
      setCustomEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setCustomStartDate(start.toISOString().split('T')[0]);
      setCustomEndDate(todayStr);
    } else if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setCustomStartDate(start.toISOString().split('T')[0]);
      setCustomEndDate(end.toISOString().split('T')[0]);
    } else if (preset === 'thisYear') {
      const start = new Date(now.getFullYear(), 0, 1);
      setCustomStartDate(start.toISOString().split('T')[0]);
      setCustomEndDate(todayStr);
    } else if (preset === 'all') {
      setCustomStartDate('2020-01-01');
      setCustomEndDate(todayStr);
    }
  };

  // --- CALCULATE REAL-TIME METRICS (KPIs) ---
  const metrics = useMemo(() => {
    // Total debts pending
    const totalPendingDebts = debts
      .filter(d => d.status === 'Pending')
      .reduce((sum, d) => sum + (d.amount_due - d.amount_paid), 0);

    // Stock alert count
    const lowStockCount = products.filter(p => p.stock_quantity <= p.alert_quantity).length;

    // Total Sales count
    const totalSalesCount = sales.length;

    // 1. Periodic financials (Jour, Semaine, Mois, Année) with margin & trends
    const periodic = computePeriodicFinancials(sales, saleItems, products, expenses);

    // 2. Today payment breakdown (Espèces, Mobile Money, Virement)
    const todayPayments = computeTodayPaymentBreakdown(periodic.todaySalesList);

    // 3. Custom Date Range Analysis
    const start = new Date(customStartDate + 'T00:00:00');
    const end = new Date(customEndDate + 'T23:59:59.999');
    
    const customSales = filterSalesByDateRange(sales, start, end);
    const startTime = start.getTime();
    const endTime = end.getTime();
    const customExpensesList = expenses.filter(e => {
      const t = new Date(e.created_at).getTime();
      return t >= startTime && t <= endTime;
    });

    const customTotal = customSales.reduce((sum, s) => sum + s.total_amount, 0);
    const customProfit = calculateSalesProfit(customSales, saleItems, products);
    const customExpensesTotal = customExpensesList.reduce((sum, e) => sum + e.amount, 0);
    const customMarginRate = customTotal > 0 ? ((customProfit - customExpensesTotal) / customTotal) * 100 : 0;
    const customCount = customSales.length;
    const customAvgBasket = customCount > 0 ? customTotal / customCount : 0;

    return {
      totalPendingDebts,
      lowStockCount,
      totalSalesCount,
      periodic,
      todayPayments,
      customSales,
      customTotal,
      customProfit,
      customMarginRate,
      customCount,
      customAvgBasket,
      customExpensesList,
      customExpensesTotal
    };
  }, [sales, debts, saleItems, products, expenses, customStartDate, customEndDate]);

  // --- CRUD ACTIONS ---

  // Logout Action
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fx_user');
    showNotification('success', 'Vous avez été déconnecté avec succès. Redirection vers l\'écran de connexion.');
  };

  // Handle Login Form Submit
  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();
    if (cleanUser === 'admin' || cleanUser === 'gerant' || cleanUser === 'gérant') {
      setCurrentUser({ id: 1, username: 'admin', role: 'Gérant' });
      setActiveTab('dashboard');
      showNotification('success', 'Bienvenue ! Connexion réussie en tant que Gérant.');
    } else if (cleanUser === 'caissier' || cleanUser === 'employe' || cleanUser === 'employé' || cleanUser === 'cashier') {
      setCurrentUser({ id: 2, username: 'caissier', role: 'Employé' });
      setActiveTab('pos');
      showNotification('success', 'Bienvenue ! Connexion réussie en tant qu\'Employé (Caisse).');
    } else {
      setCurrentUser({ id: 1, username: loginUsername.trim() || 'admin', role: 'Gérant' });
      setActiveTab('dashboard');
      showNotification('success', `Bienvenue ${loginUsername} ! Connexion réussie.`);
    }
    setLoginUsername('');
    setLoginPassword('');
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'Gérant') {
      showNotification('error', 'Seul le Gérant peut ajouter des catégories.');
      return;
    }
    if (!newCategoryName.trim()) {
      showNotification('error', 'Le nom de la catégorie ne peut pas être vide.');
      return;
    }

    const nextId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const category: Category = {
      id: nextId,
      name: newCategoryName.trim()
    };

    setCategories([...categories, category]);
    setNewCategoryName('');
    setIsAddingCategory(false);
    showNotification('success', `Catégorie "${category.name}" créée avec succès.`);
  };

  // Add Product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name || newProduct.purchase_price <= 0 || newProduct.selling_price <= 0) {
      showNotification('error', 'Veuillez remplir tous les champs avec des valeurs positives.');
      return;
    }

    if (newProduct.selling_price <= newProduct.purchase_price) {
      showNotification('warning', 'Le prix de vente est inférieur ou égal au prix d\'achat. Êtes-vous sûr de cette marge ?');
    }

    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const product: Product = {
      id: nextId,
      code: newProduct.code.toUpperCase(),
      name: newProduct.name,
      category_id: Number(newProduct.category_id),
      purchase_price: Number(newProduct.purchase_price),
      selling_price: Number(newProduct.selling_price),
      stock_quantity: Number(newProduct.stock_quantity),
      alert_quantity: Number(newProduct.alert_quantity)
    };

    // Check duplicate code
    if (products.some(p => p.code === product.code)) {
      showNotification('error', `Le code produit "${product.code}" existe déjà.`);
      return;
    }

    setProducts([...products, product]);
    setIsAddingProduct(false);
    setNewProduct({
      code: '',
      name: '',
      category_id: categories[0]?.id || 1,
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      alert_quantity: 5
    });
    showNotification('success', `Produit "${product.name}" ajouté avec succès au stock.`);
  };

  // Edit Product
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.code || !editingProduct.name || editingProduct.purchase_price <= 0 || editingProduct.selling_price <= 0) {
      showNotification('error', 'Champs invalides. Veuillez vérifier les prix.');
      return;
    }

    // Check code uniqueness excluding current product
    if (products.some(p => p.code === editingProduct.code.toUpperCase() && p.id !== editingProduct.id)) {
      showNotification('error', `Le code produit "${editingProduct.code}" est déjà utilisé.`);
      return;
    }

    setProducts(products.map(p => p.id === editingProduct.id ? {
      ...editingProduct,
      code: editingProduct.code.toUpperCase(),
      category_id: Number(editingProduct.category_id),
      purchase_price: Number(editingProduct.purchase_price),
      selling_price: Number(editingProduct.selling_price),
      stock_quantity: Number(editingProduct.stock_quantity),
      alert_quantity: Number(editingProduct.alert_quantity)
    } : p));

    setEditingProduct(null);
    showNotification('success', 'Produit mis à jour avec succès.');
  };

  // Delete Product (opens in-app confirmation modal instead of window.confirm)
  const handleDeleteProduct = (productId: number) => {
    if (currentUser.role !== 'Gérant') {
      showNotification('error', 'Accès refusé : Seul le Gérant peut supprimer définitivement un produit.');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    setProductToDelete(product);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    if (currentUser.role !== 'Gérant') {
      showNotification('error', 'Accès refusé : Seul le Gérant peut supprimer définitivement un produit.');
      setProductToDelete(null);
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    setCart(prev => prev.filter(item => item.product.id !== productToDelete.id));
    if (editingProduct?.id === productToDelete.id) {
      setEditingProduct(null);
    }
    showNotification('success', `Produit "${productToDelete.name}" supprimé.`);
    setProductToDelete(null);
  };

  // Add Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newExpense.amount);
    if (!newExpense.reason.trim() || amount <= 0) {
      showNotification('error', "Veuillez entrer un motif valide et un montant positif.");
      return;
    }
    
    const newExp: Expense = {
      id: expenses.length > 0 ? Math.max(...expenses.map(exp => exp.id)) + 1 : 1,
      reason: newExpense.reason.trim(),
      amount,
      category: newExpense.category,
      payment_method: newExpense.payment_method,
      created_at: new Date().toISOString(),
      user_id: currentUser.id
    };
    
    setExpenses([newExp, ...expenses]);
    setNewExpense({ reason: '', amount: '', category: 'Fournitures', payment_method: 'Espèces' });
    setIsAddExpenseModalOpen(false);
    showNotification('success', "Dépense enregistrée avec succès.");
  };

  // --- POS CART ACTIONS ---
  const addToCart = (product: Product) => {
    const allowNeg = Boolean(companySettings?.allowNegativeStock);
    if (!allowNeg && product.stock_quantity <= 0) {
      showNotification('error', `Stock épuisé pour "${product.name}". Veuillez réapprovisionner.`);
      return;
    }

    const existingCartItem = cart.find(item => item.product.id === product.id);
    if (existingCartItem) {
      if (!allowNeg && existingCartItem.quantity >= product.stock_quantity) {
        showNotification('error', `Quantité maximale en stock atteinte (${product.stock_quantity} pièces).`);
        return;
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: number, change: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else {
      // Check stock limit unless negative stock is explicitly allowed
      if (!companySettings?.allowNegativeStock && newQty > item.product.stock_quantity) {
        showNotification('error', `Stock insuffisant : Seulement ${item.product.stock_quantity} disponibles.`);
        return;
      }
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  };

  // STEP 1: Initiate Payment & Open Confirmation Modal
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showNotification('error', 'Le panier est vide.');
      return;
    }

    // Verify product stock availability unless negative stock is allowed
    if (!companySettings?.allowNegativeStock) {
      for (const item of cart) {
        const prod = products.find(p => p.id === item.product.id);
        if (!prod || prod.stock_quantity < item.quantity) {
          showNotification('error', `Stock insuffisant pour "${item.product.name}" (Disponible : ${prod?.stock_quantity || 0}).`);
          return;
        }
      }
    }

    // Validate Customer selection for Debt
    if (paymentStatus === 'Dette') {
      if (!selectedCustomerId) {
        showNotification('error', 'Sélectionnez un client débiteur ou créez-en un pour les ventes à crédit.');
        return;
      }
      if (selectedCustomerId === 'new' && (!newCustomer.name.trim() || !newCustomer.phone.trim())) {
        showNotification('error', 'Veuillez saisir le nom et le téléphone pour la nouvelle fiche client.');
        return;
      }
      const total = getCartTotal();
      if (amountPaidInitial > total) {
        showNotification('error', 'L\'acompte ne peut pas être supérieur au montant total de la vente.');
        return;
      }
    }

    // Auto-suggest reference based on payment method if empty
    if (!paymentReference.trim()) {
      if (paymentStatus === 'Cash') {
        if (posPaymentMethod === 'Espèces') {
          const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
          const rand = Math.floor(1000 + Math.random() * 9000);
          setPaymentReference(`ESP-${dateCode}-${rand}`);
        } else if (posPaymentMethod === 'Mobile Money') {
          setPaymentReference('');
        } else if (posPaymentMethod === 'Virement') {
          setPaymentReference('');
        }
      } else {
        const rand = Math.floor(100 + Math.random() * 900);
        setPaymentReference(`BON-DETTE-${rand}`);
      }
    }

    setPaymentReferenceError(null);
    setIsPaymentConfirmedByCashier(true);
    setIsPaymentConfirmationOpen(true);
  };

  // STEP 2: Cashier Validates Payment & Generates Confirmed Receipt
  const handleConfirmAndFinalizePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanRef = paymentReference.trim();
    if (!cleanRef) {
      setPaymentReferenceError("La référence du paiement / N° de transaction est obligatoire (ex: ID SMS Lumicash/EcoCash, Réf Virement ou N° Caisse).");
      showNotification('error', "Veuillez renseigner la référence ou le N° de transaction du paiement.");
      return;
    }

    if (!isPaymentConfirmedByCashier) {
      showNotification('error', "Veuillez attester la réception et confirmation du règlement.");
      return;
    }

    const total = getCartTotal();
    let finalCustomerId: number | null = null;

    // Handle Customer Creation universally
    if (selectedCustomerId === 'new') {
      if (!newCustomer.name || !newCustomer.phone) {
        showNotification('error', 'Veuillez saisir le nom et le téléphone du client.');
        return;
      }
      // Create customer
      const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      const created: Customer = {
        id: newId,
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim()
      };
      setCustomers([...customers, created]);
      finalCustomerId = newId;
      // Reset POS customer states
      setNewCustomer({ name: '', phone: '' });
      setIsCreatingCustomerPOS(false);
    } else if (selectedCustomerId !== '') {
      finalCustomerId = Number(selectedCustomerId);
    }

    const nextSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
    
    // 1. Add Sale record with payment reference & confirmed flag
    const newSale: Sale = {
      id: nextSaleId,
      user_id: currentUser.id,
      customer_id: finalCustomerId,
      total_amount: total,
      payment_status: paymentStatus,
      payment_method: paymentStatus === 'Cash' ? posPaymentMethod : 'Espèces',
      payment_reference: cleanRef,
      payment_confirmed: true,
      created_at: new Date().toISOString()
    };

    // 2. Add Sale Items & update stock list
    const newItems: SaleItem[] = [];
    let itemCounter = saleItems.length > 0 ? Math.max(...saleItems.map(si => si.id)) + 1 : 1;

    const updatedProducts = [...products];

    for (const cartItem of cart) {
      newItems.push({
        id: itemCounter++,
        sale_id: nextSaleId,
        product_id: cartItem.product.id,
        quantity: cartItem.quantity,
        unit_price: cartItem.product.selling_price,
        subtotal: cartItem.product.selling_price * cartItem.quantity
      });

      // Update product stocks
      const productIdx = updatedProducts.findIndex(p => p.id === cartItem.product.id);
      if (productIdx !== -1) {
        updatedProducts[productIdx] = {
          ...updatedProducts[productIdx],
          stock_quantity: updatedProducts[productIdx].stock_quantity - cartItem.quantity
        };
      }
    }

    // 3. Add Debt if 'Dette'
    if (paymentStatus === 'Dette' && finalCustomerId) {
      const nextDebtId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1;
      const initialPaid = Number(amountPaidInitial) || 0;
      const isPaid = initialPaid >= total;

      const newDebt: Debt = {
        id: nextDebtId,
        sale_id: nextSaleId,
        customer_id: finalCustomerId,
        amount_due: total,
        amount_paid: initialPaid,
        status: isPaid ? 'Paid' : 'Pending',
        created_at: new Date().toISOString()
      };

      setDebts([newDebt, ...debts]);
    }

    // Commit States
    setSales([newSale, ...sales]);
    setSaleItems([...saleItems, ...newItems]);
    setProducts(updatedProducts);
    
    // Prepare receipt data
    let receiptCustomer = null;
    if (finalCustomerId) {
       receiptCustomer = customers.find(c => c.id === finalCustomerId);
       if (!receiptCustomer && selectedCustomerId === 'new') {
           receiptCustomer = { id: finalCustomerId, name: newCustomer.name, phone: newCustomer.phone };
       }
    }
    
    setReceiptData({
      sale: newSale,
      items: newItems.map(item => ({
        ...item,
        product_name: products.find(p => p.id === item.product_id)?.name || 'Produit inconnu'
      })),
      customer: receiptCustomer,
      amount_paid: amountPaidInitial
    });

    // Clear Cart & reset POS state & close confirmation dialog
    setCart([]);
    setSelectedCustomerId('');
    setPaymentStatus('Cash');
    setAmountPaidInitial(0);
    setPaymentReference('');
    setPaymentReferenceError(null);
    setIsPaymentConfirmationOpen(false);

    showNotification('success', `Paiement validé avec succès ! Transaction ${cleanRef} confirmée. Reçu #FLX-${String(nextSaleId).padStart(4, '0')} prêt.`);
  };

  // --- REPAY DEBT ACTION ---
  // --- REPAY DEBT ACTION ---
  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;

    const amountToPay = Number(repaymentAmount);
    const remaining = selectedDebtForPayment.amount_due - selectedDebtForPayment.amount_paid;

    if (amountToPay <= 0) {
      showNotification('error', 'Veuillez saisir un montant supérieur à 0 BIF.');
      return;
    }

    if (amountToPay > remaining) {
      showNotification('error', `Le paiement dépasse le montant restant dû (${formatBIF(remaining)}).`);
      return;
    }

    // Update debt
    setDebts(debts.map(d => {
      if (d.id === selectedDebtForPayment.id) {
        const newPaid = d.amount_paid + amountToPay;
        return {
          ...d,
          amount_paid: newPaid,
          status: newPaid >= d.amount_due ? 'Paid' : 'Pending'
        };
      }
      return d;
    }));

    // Inject into today's CA as a pseudo-sale
    const nextSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
    const repaymentSale: Sale = {
      id: nextSaleId,
      user_id: currentUser.id,
      customer_id: selectedDebtForPayment.customer_id,
      total_amount: amountToPay,
      payment_status: 'Cash',
      payment_method: repaymentMethod,
      payment_reference: repaymentReference || `REMB-DETTE-${selectedDebtForPayment.id}`,
      payment_confirmed: true,
      created_at: new Date().toISOString()
    };
    setSales([repaymentSale, ...sales]);

    showNotification('success', `Remboursement de ${formatBIF(amountToPay)} enregistré pour la dette #${selectedDebtForPayment.id}.`);
    
    const receiptCustomer = customers.find(c => c.id === selectedDebtForPayment.customer_id) || null;
    
    setReceiptData({
      sale: repaymentSale,
      items: [{
        id: 0,
        sale_id: nextSaleId,
        product_id: 0,
        quantity: 1,
        unit_price: amountToPay,
        subtotal: amountToPay,
        // @ts-ignore
        product_name: `Remboursement dette #${selectedDebtForPayment.id}`
      }],
      customer: receiptCustomer,
      amount_paid: amountToPay
    });

    setSelectedDebtForPayment(null);
    setRepaymentAmount(0);
    setRepaymentMethod('Espèces');
    setRepaymentReference('');
  };

  // --- SEARCH FILTERS COMPUTATIONS ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) || p.code.toLowerCase().includes(stockSearch.toLowerCase());
      const matchesCategory = stockCategoryFilter === 'all' || p.category_id === Number(stockCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, stockSearch, stockCategoryFilter]);

  const filteredPOSProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.code.toLowerCase().includes(posSearch.toLowerCase());
      const matchesCategory = posCategoryFilter === 'all' || p.category_id === Number(posCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, posSearch, posCategoryFilter]);

  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (debtFilter === 'all') return true;
      return d.status === debtFilter;
    });
  }, [debts, debtFilter]);

  const getCustomerPhone = (customerId: number) => {
    return customers.find(c => c.id === customerId)?.phone || 'Pas de téléphone';
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
    showNotification('success', 'Code source copié dans le presse-papiers !');
  };

  // Reset demo state helper to initial values
  const resetDemoState = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données de simulation aux valeurs d\'origine de Bujumbura ?')) {
      localStorage.clear();
      setCategories(initialCategories);
      setProducts(initialProducts);
      setCustomers(initialCustomers);
      setSales([]);
      setSaleItems([]);
      setDebts([]);
      setExpenses([]);
      setCart([]);
      showNotification('success', 'Données de simulation réinitialisées avec succès.');
    }
  };

  // Reset only financial data (Purge complète des ventes, caisse, dettes, charges)
  const handleResetFinancials = () => {
    if (resetConfirmationInput.trim() !== 'SUPPRIMER') {
      showNotification('error', 'Veuillez saisir le mot "SUPPRIMER" pour débloquer la réinitialisation.');
      return;
    }

    // Sauvegarde des catalogues (Produits, Catégories, Clients, Utilisateur, Paramètres entreprise)
    const savedProd = localStorage.getItem('fx_prod') || localStorage.getItem('products');
    const savedCat = localStorage.getItem('fx_cat') || localStorage.getItem('categories');
    const savedCust = localStorage.getItem('fx_cust') || localStorage.getItem('customers');
    const savedUser = localStorage.getItem('fx_user');
    const savedCompany = localStorage.getItem('fx_company_settings');
    
    // 1. Vider tous les tableaux d'état React financiers
    setSales([]);
    setSaleItems([]);
    setDebts([]);
    setExpenses([]);
    setCart([]);
    
    // 2. Nettoyage explicite des clés de stockage
    localStorage.removeItem('sales');
    localStorage.removeItem('debts');
    localStorage.removeItem('expenses');
    localStorage.removeItem('saleItems');
    localStorage.removeItem('transactions');
    localStorage.removeItem('fx_sale');
    localStorage.removeItem('fx_sitem');
    localStorage.removeItem('fx_debt');
    localStorage.removeItem('fx_exp');
    
    // 3. Forcer explicitement à "[]" dans le localStorage
    localStorage.setItem('sales', JSON.stringify([]));
    localStorage.setItem('fx_sale', JSON.stringify([]));
    localStorage.setItem('debts', JSON.stringify([]));
    localStorage.setItem('fx_debt', JSON.stringify([]));
    localStorage.setItem('expenses', JSON.stringify([]));
    localStorage.setItem('fx_exp', JSON.stringify([]));
    localStorage.setItem('saleItems', JSON.stringify([]));
    localStorage.setItem('fx_sitem', JSON.stringify([]));
    
    // 4. Restauration des catalogues et paramètres
    if (savedProd) {
      localStorage.setItem('fx_prod', savedProd);
      localStorage.setItem('products', savedProd);
    }
    if (savedCat) {
      localStorage.setItem('fx_cat', savedCat);
      localStorage.setItem('categories', savedCat);
    }
    if (savedCust) {
      localStorage.setItem('fx_cust', savedCust);
      localStorage.setItem('customers', savedCust);
    }
    if (savedUser) localStorage.setItem('fx_user', savedUser);
    if (savedCompany) localStorage.setItem('fx_company_settings', savedCompany);
    
    setIsResetFinancialsModalOpen(false);
    setResetConfirmationInput('');
    showNotification('success', 'Historique des ventes, caisse et dettes réinitialisés à 0 BIF.');
  };

  const imprimerFacture = () => {
    if (!receiptData || !receiptData.sale || !receiptData.sale.payment_confirmed) {
      showNotification('error', "Impression bloquée : Le paiement doit être validé et confirmé par le caissier avant l'impression.");
      return;
    }

    setTimeout(() => {
      try {
        // Détection iframe : window.print() échoue ou est ignoré silencieusement dans une sandbox sans allow-modals
        if (window.top !== window.self) {
          throw new Error("Environnement sandbox iframe détecté");
        }
        window.print();
      } catch (error) {
        console.warn("Impression native bloquée, utilisation du fallback autonome :", error);
        
        const modalContent = document.getElementById('carte-recu');
        if (modalContent) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Facture ${companySettings?.name || 'Commerce'} #${String(receiptData.sale.id).padStart(4, '0')}</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                    @page {
                      size: 80mm auto;
                      margin: 0mm !important;
                    }

                    html, body {
                      width: 80mm !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: white;
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    }

                    #carte-recu {
                      width: 80mm !important;
                      max-width: 80mm !important;
                      padding: 8px !important;
                      margin: 0 auto !important;
                      box-shadow: none !important;
                      border: none !important;
                    }

                    .no-print, .print\\:hidden, button {
                      display: none !important;
                    }
                  </style>
                </head>
                <body>
                  ${modalContent.outerHTML}
                  <script>
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 800);
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          } else {
            alert("Veuillez autoriser les pop-ups pour imprimer la facture.");
          }
        }
      }
    }, 100);
  };

  const fermerModale = () => {
    setReceiptData(null);
  };

  const envoyerWhatsApp = () => {
    if (!receiptData) return;
    if (!receiptData.customer?.phone || receiptData.customer.name === 'Client Comptoir (Anonyme)') {
      showNotification('error', 'Aucun numéro de téléphone enregistré pour ce client.');
      return;
    }
    const phone = receiptData.customer.phone.replace(/[^0-9]/g, '');
    const isDebt = receiptData.sale.payment_status === 'Dette';
    const companyTitle = companySettings?.name || 'Nom du Commerce';
    const currencyStr = companySettings?.currency || 'BIF';
    const footerMsg = companySettings?.receiptFooterMessage || 'Merci de votre confiance !';
    const text = `*${companyTitle}*\n====================\nFacture N°#FLX-${String(receiptData.sale.id).padStart(4, '0')}\nDate: ${new Date(receiptData.sale.created_at).toLocaleString('fr-FR')}\n\nClient: ${receiptData.customer.name}\n\n*Total Général: ${receiptData.sale.total_amount.toLocaleString()} ${currencyStr}*\nStatut: ${isDebt ? 'Dette Active' : 'Payé en Comptant'}\n${isDebt ? `Reste à payer: ${(receiptData.sale.total_amount - receiptData.amount_paid).toLocaleString()} ${currencyStr}` : ''}\n\n${footerMsg}\n\n_Logiciel édité par FLODELIXA Technologies (AI • Software • Digital Solutions)_`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const imprimerRapportA4 = (periodeNom: string, salesToPrint: Sale[], expensesList: Expense[], dateSubtitle?: string) => {
    if (salesToPrint.length === 0 && expensesList.length === 0) {
      showNotification('warning', `Aucune donnée enregistrée pour la période "${periodeNom}".`);
    }
    const success = printA4SalesReport({
      periodName: periodeNom,
      dateSubtitle,
      salesList: salesToPrint,
      saleItems,
      expensesList,
      products,
      customers,
      userName: currentUser.username,
      userRole: currentUser.role,
      companySettings
    });

    if (success) {
      showNotification('success', `Rapport A4 pour "${periodeNom}" ouvert dans la fenêtre d'impression.`);
    } else {
      showNotification('error', "Impossible d'ouvrir la fenêtre pop-up. Veuillez autoriser les pop-ups dans votre navigateur.");
    }
  };

      <style>{`
        @media print {
          /* HIDE APP INTERFACE COMPLETELY */
          nav, main {
            display: none !important;
          }
          
          #app_root {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* FORCE STRICT MODAL VISIBILITY */
          #modal-recu {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          #carte-recu {
            display: block !important;
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #carte-recu * {
            visibility: visible !important;
          }

          /* HIDE BUTTONS / ACTIONS */
          .no-print, .print\:hidden, button {
            display: none !important;
          }
        }
      `}</style>

  {/* LOGIN SCREEN WHEN NOT AUTHENTICATED */}
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center p-4 selection:bg-[#0066FF] selection:text-white" id="login_screen_container">
        {/* TOP NOTIFICATION BANNER */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border text-sm max-w-md animate-bounce ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : notification.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            id="login_notification"
          >
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
            <div>{notification.message}</div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-fade-in my-auto" id="login_card">
          <div className="text-center mb-4 sm:mb-5">
            <div className="inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#0066FF]/10 text-[#0066FF] mb-2 sm:mb-2.5">
              <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0D1B2A]">{companySettings.name || 'Nom du Commerce'}</h1>
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#0066FF] font-bold">{companySettings.address || 'Bujumbura, Burundi'}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5">{companySettings.phone ? `Tél : ${companySettings.phone}` : 'Gestion Commerciale, Caisse & Stocks'}</p>
          </div>

          <form onSubmit={handleLoginFormSubmit} className="space-y-3 sm:space-y-4" id="form_login">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Identifiant / Rôle</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Ex: admin ou caissier"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0066FF] focus:bg-white transition-all font-medium pr-10"
                  required
                  id="input_login_username"
                />
                <User className="h-4 w-4 text-gray-400 absolute right-3.5 top-3 sm:top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mot de passe</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0066FF] focus:bg-white transition-all font-medium"
                id="input_login_password"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 sm:py-3.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-[#0066FF]/20 transition-all flex items-center justify-center gap-2 mt-1 sm:mt-2 cursor-pointer"
              id="btn_submit_login"
            >
              <User className="h-4 w-4" />
              <span>Se Connecter à la Boutique</span>
            </button>
          </form>

          <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-gray-100">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2 sm:mb-2.5">Accès Rapide (1-Clic)</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => {
                  setCurrentUser({ id: 1, username: 'admin', role: 'Gérant' });
                  setActiveTab('dashboard');
                  showNotification('success', 'Connecté avec succès en tant que Gérant.');
                }}
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-blue-50 hover:border-[#0066FF]/40 border border-gray-200 rounded-xl text-left transition-all group cursor-pointer"
                id="btn_quick_login_admin"
              >
                <div className="text-xs font-black text-gray-900 group-hover:text-[#0066FF] flex items-center justify-between">
                  <span>Gérant</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Accès total & Stocks</div>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setCurrentUser({ id: 2, username: 'caissier', role: 'Employé' });
                  setActiveTab('pos');
                  showNotification('success', 'Connecté avec succès en tant qu\'Employé (Caisse).');
                }}
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500/40 border border-gray-200 rounded-xl text-left transition-all group cursor-pointer"
                id="btn_quick_login_cashier"
              >
                <div className="text-xs font-black text-gray-900 group-hover:text-emerald-700 flex items-center justify-between">
                  <span>Employé</span>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Caisse POS & Ventes</div>
              </button>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-center gap-2.5">
              <img 
                src="/logo-flodelixa.png" 
                alt="FLODELIXA Technologies" 
                className="w-9 h-9 object-contain rounded-md shadow-sm border border-gray-100"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <p className="text-[11px] text-gray-800 font-extrabold tracking-wider uppercase leading-tight">
                  FLO<span className="text-cyan-500 font-black">D</span>ELIXA TECHNOLOGIES
                </p>
                <p className="text-[7.5px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">
                  AI • SOFTWARE • DIGITAL SOLUTIONS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#F8FAFC] text-[#0D1B2A] font-sans overflow-hidden selection:bg-[#0066FF] selection:text-white" id="app_root">
      
      {/* TOP NOTIFICATION BANNER */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border text-sm max-w-md animate-bounce ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          id="global_notification"
        >
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
          <div>{notification.message}</div>
        </div>
      )}

      {/* SIDE BAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0D1B2A] text-white flex flex-col flex-shrink-0 z-20 h-auto md:h-full" id="sidebar_nav_container">
        <div className="p-3 md:px-5 md:py-4 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1 flex-shrink-0">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white truncate max-w-full" title={companySettings.name || 'Nom du Commerce'}>
            {companySettings.name || 'Nom du Commerce'}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0066FF] font-semibold truncate max-w-full">
            {companySettings.address || 'Point de Vente'}
          </p>
        </div>

        <nav className="mt-1 md:mt-2 flex-1 min-h-0 px-3 md:px-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto pb-2 md:pb-2 md:space-y-1 space-y-0" id="navigation_menu">
          {currentUser.role === 'Gérant' && (
            <button 
              id="btn_nav_dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'dashboard' ? 'bg-white' : 'bg-gray-500'}`}></div>
              <span>Tableau de Bord</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('pos')}
            className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pos' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'pos' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span>Point de Vente (POS)</span>
          </button>

          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'stock' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span className="flex-1 text-left">Gestion Stocks</span>
            {metrics.lowStockCount > 0 && (
              <span className="bg-[#FACC15] text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {metrics.lowStockCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('debts')}
            className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'debts' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'debts' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span className="flex-1 text-left">Dettes & Clients</span>
            {metrics.totalPendingDebts > 0 && (
              <span className="bg-[#F59E0B] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'code' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'code' ? 'bg-white' : 'bg-gray-500'}`}></div>
            <span>Code Production PHP</span>
          </button>
          
          {currentUser.role === 'Gérant' && (
            <button 
              id="btn_nav_settings"
              onClick={() => setActiveTab('settings')}
              className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-[#0066FF] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'settings' ? 'bg-white' : 'bg-gray-500'}`}></div>
              <span>Paramètres</span>
            </button>
          )}
        </nav>

        <div className="hidden md:flex flex-col flex-shrink-0 p-4 md:px-4 md:py-3 border-t border-gray-800 text-[11px] text-gray-400 gap-2.5" id="sidebar_footer">
          <div className="flex justify-between items-center">
            <div>
              <p>Connecté: <strong className="text-white capitalize">{currentUser.role}</strong></p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[130px]">{companySettings.address || 'Bujumbura, BI'}</p>
            </div>
            <div>
              <button 
                onClick={handleLogout} 
                className="p-2 bg-gray-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-gray-400 transition-colors flex items-center gap-1.5 cursor-pointer" 
                title="Se déconnecter"
                id="btn_logout_sidebar"
              >
                <LogOut className="h-4 w-4"/>
              </button>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-800/80 flex items-center gap-2.5">
            <img 
              src="/logo-flodelixa.png" 
              alt="FLODELIXA Technologies" 
              className="w-9 h-9 object-contain rounded-md shadow-sm bg-black/50 p-0.5 border border-cyan-500/20 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="text-left min-w-0">
              <p className="text-[10.5px] text-gray-100 font-extrabold tracking-wider uppercase leading-tight truncate">
                FLO<span className="text-cyan-400 font-black">D</span>ELIXA TECHNOLOGIES
              </p>
              <p className="text-[7.5px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 truncate">
                AI • SOFTWARE • DIGITAL SOLUTIONS
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]" id="main_content_viewport">
        
        {/* HEADER BAR */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {activeTab === 'dashboard' && "Vue d'ensemble"}
              {activeTab === 'pos' && "Point de Vente (POS)"}
              {activeTab === 'stock' && "Gestion des Stocks"}
              {activeTab === 'debts' && "Dettes & Clients"}
              {activeTab === 'code' && "Code de Production"}
              {activeTab === 'settings' && "Paramètres"}
            </h2>
            <span className="hidden sm:inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200 truncate max-w-[200px]" title={companySettings.name}>
              {companySettings.name || 'Nom du Commerce'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-800">{currentUser.username}</span>
              <span className="text-[10px] text-gray-500 capitalize">{currentUser.role}</span>
            </div>
            <div className="h-9 w-9 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center font-bold text-[#0066FF] text-xs">
              {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'IF'}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors md:hidden"
              title="Se déconnecter"
              id="btn_logout_mobile"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="p-4 md:p-8 flex-1 overflow-auto">
          
          {/* =======================================================
              1. TAB: DASHBOARD
              ======================================================= */}
          {activeTab === 'dashboard' && currentUser.role === 'Gérant' && (
            <div className="space-y-6" id="view_dashboard">
              
              {/* WELCOME BANNER & FOUNDER INSPIRATION */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F8FAFC] border border-gray-200 p-5 rounded-2xl">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
                    Tableau de Bord
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Statistiques de vente et situation de stock de la boutique à Bujumbura.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-150 shadow-sm font-medium">
                  <span className="font-semibold text-[#0066FF]">Burundi</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-gray-500">Région Bujumbura Mairie</span>
                </div>
              </div>

              {/* LOW STOCK IMPORTANT ALERTS BAR */}
              {metrics.lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 border border-amber-200 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Alerte de Stock Bas ({metrics.lowStockCount} produits)</h4>
                      <p className="text-[11px] text-amber-700">Certaines références ont atteint leur seuil critique. Pensez à réapprovisionner.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setStockCategoryFilter('all');
                      setStockSearch('');
                      setActiveTab('stock');
                    }}
                    className="text-xs font-bold text-amber-900 underline hover:text-amber-950 flex items-center gap-1 self-end sm:self-auto"
                  >
                    Voir les produits <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* =======================================================
                  1. MODULE DE SUIVI DES ENTRÉES FINANCIÈRES (4 CARTES PRINCIPALES)
                  ======================================================= */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Suivi des Entrées Financières & Rentabilité Réelle
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddExpenseModalOpen(true)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Ajouter une nouvelle dépense ou charge"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajouter Dépense</span>
                    </button>
                    <span className="hidden md:inline text-[11px] text-gray-500 font-medium border-l border-gray-200 pl-3">
                      Calcul automatique : Bénéfice = Ventes - Dépenses
                    </span>
                    <button
                      type="button"
                      id="btn_print_general_sales_a4"
                      onClick={() => imprimerRapportA4("Historique Global des Ventes", sales, expenses, "Bilan commercial global")}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-[#0066FF] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Imprimer tout l'historique au format A4"
                    >
                      <Printer className="h-3.5 w-3.5 text-gray-500" />
                      <span>Imprimer Bilan Général (A4)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi_grid">
                  
                  {/* 1. AUJOURD'HUI (JOUR) */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                          Aujourd'hui (Jour)
                        </span>
                        {/* Trend Indicator vs Yesterday */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          metrics.periodic.today.growth > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : metrics.periodic.today.growth < 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {metrics.periodic.today.growth > 0 && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {metrics.periodic.today.growth < 0 && <TrendingDown className="h-3 w-3 text-rose-600" />}
                          {metrics.periodic.today.growth === 0 && <Minus className="h-3 w-3 text-gray-400" />}
                          <span>{metrics.periodic.today.growth > 0 ? `+${metrics.periodic.today.growth.toFixed(1)}%` : `${metrics.periodic.today.growth.toFixed(1)}%`}</span>
                          <span className="text-[9px] font-normal text-gray-400">vs hier</span>
                        </div>
                      </div>

                      <div className="text-xl font-black text-gray-900 tracking-tight mb-1">
                        {formatBIF(metrics.periodic.today.total)}
                      </div>

                      {/* SOUS-TITRE DE MARGE NETTE */}
                      <div className="bg-blue-50/70 border border-blue-100/80 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Marge brute:</span>
                          <span className="font-bold text-gray-700">{formatBIF(metrics.periodic.today.netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-500">Dépenses:</span>
                          <span className="font-bold text-red-600">-{formatBIF(metrics.periodic.today.expensesTotal)}</span>
                        </div>
                        <div className="border-t border-blue-100 pt-1 mt-1">
                          <div className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">Bénéfice Net Réel</div>
                          <div className="text-sm font-extrabold text-[#0066FF]">
                            {metrics.periodic.today.realNetProfit > 0 ? '+' : ''}{formatBIF(metrics.periodic.today.realNetProfit)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {metrics.periodic.today.count} vente(s) enregistrée(s)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn_print_report_today"
                      onClick={() => imprimerRapportA4("Aujourd'hui (Jour)", metrics.periodic.todaySalesList, metrics.periodic.todayExpensesList, `Date: ${new Date().toLocaleDateString('fr-FR')}`)}
                      className="w-full mt-3 py-1.5 px-2 bg-slate-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-[#0066FF] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Imprimer l'historique des ventes du jour au format A4"
                    >
                      <Printer className="h-3 w-3 text-gray-500" />
                      <span>Imprimer l'Historique (A4)</span>
                    </button>
                  </div>

                  {/* 2. CETTE SEMAINE */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                          Cette Semaine
                        </span>
                        {/* Trend Indicator vs Last Week */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          metrics.periodic.thisWeek.growth > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : metrics.periodic.thisWeek.growth < 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {metrics.periodic.thisWeek.growth > 0 && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {metrics.periodic.thisWeek.growth < 0 && <TrendingDown className="h-3 w-3 text-rose-600" />}
                          {metrics.periodic.thisWeek.growth === 0 && <Minus className="h-3 w-3 text-gray-400" />}
                          <span>{metrics.periodic.thisWeek.growth > 0 ? `+${metrics.periodic.thisWeek.growth.toFixed(1)}%` : `${metrics.periodic.thisWeek.growth.toFixed(1)}%`}</span>
                          <span className="text-[9px] font-normal text-gray-400">vs sem. préc.</span>
                        </div>
                      </div>

                      <div className="text-xl font-black text-gray-900 tracking-tight mb-1">
                        {formatBIF(metrics.periodic.thisWeek.total)}
                      </div>

                      {/* SOUS-TITRE DE MARGE NETTE */}
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Marge brute:</span>
                          <span className="font-bold text-gray-700">{formatBIF(metrics.periodic.thisWeek.netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-500">Dépenses:</span>
                          <span className="font-bold text-red-600">-{formatBIF(metrics.periodic.thisWeek.expensesTotal)}</span>
                        </div>
                        <div className="border-t border-emerald-100 pt-1 mt-1">
                          <div className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider">Bénéfice Net Réel</div>
                          <div className="text-sm font-extrabold text-emerald-700">
                            {metrics.periodic.thisWeek.realNetProfit > 0 ? '+' : ''}{formatBIF(metrics.periodic.thisWeek.realNetProfit)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {metrics.periodic.thisWeek.count} vente(s) enregistrée(s)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn_print_report_this_week"
                      onClick={() => imprimerRapportA4("Cette Semaine", metrics.periodic.thisWeekSalesList, metrics.periodic.thisWeekExpensesList, "Bilan hebdomadaire")}
                      className="w-full mt-3 py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-slate-700 hover:text-emerald-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Imprimer l'historique des ventes de la semaine au format A4"
                    >
                      <Printer className="h-3 w-3 text-gray-500" />
                      <span>Imprimer l'Historique (A4)</span>
                    </button>
                  </div>

                  {/* 3. CE MOIS-CI */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                          Ce Mois-ci
                        </span>
                        {/* Trend Indicator vs Last Month */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          metrics.periodic.thisMonth.growth > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : metrics.periodic.thisMonth.growth < 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {metrics.periodic.thisMonth.growth > 0 && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {metrics.periodic.thisMonth.growth < 0 && <TrendingDown className="h-3 w-3 text-rose-600" />}
                          {metrics.periodic.thisMonth.growth === 0 && <Minus className="h-3 w-3 text-gray-400" />}
                          <span>{metrics.periodic.thisMonth.growth > 0 ? `+${metrics.periodic.thisMonth.growth.toFixed(1)}%` : `${metrics.periodic.thisMonth.growth.toFixed(1)}%`}</span>
                          <span className="text-[9px] font-normal text-gray-400">vs mois préc.</span>
                        </div>
                      </div>

                      <div className="text-xl font-black text-gray-900 tracking-tight mb-1">
                        {formatBIF(metrics.periodic.thisMonth.total)}
                      </div>

                      {/* SOUS-TITRE DE MARGE NETTE */}
                      <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Marge brute:</span>
                          <span className="font-bold text-gray-700">{formatBIF(metrics.periodic.thisMonth.netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-500">Dépenses:</span>
                          <span className="font-bold text-red-600">-{formatBIF(metrics.periodic.thisMonth.expensesTotal)}</span>
                        </div>
                        <div className="border-t border-indigo-100 pt-1 mt-1">
                          <div className="text-[10px] text-indigo-900 font-bold uppercase tracking-wider">Bénéfice Net Réel</div>
                          <div className="text-sm font-extrabold text-indigo-700">
                            {metrics.periodic.thisMonth.realNetProfit > 0 ? '+' : ''}{formatBIF(metrics.periodic.thisMonth.realNetProfit)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {metrics.periodic.thisMonth.count} vente(s) enregistrée(s)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn_print_report_this_month"
                      onClick={() => imprimerRapportA4("Ce Mois-ci", metrics.periodic.thisMonthSalesList, metrics.periodic.thisMonthExpensesList, "Bilan mensuel")}
                      className="w-full mt-3 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-slate-700 hover:text-indigo-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Imprimer l'historique des ventes du mois au format A4"
                    >
                      <Printer className="h-3 w-3 text-gray-500" />
                      <span>Imprimer l'Historique (A4)</span>
                    </button>
                  </div>

                  {/* 4. CETTE ANNÉE */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                          Cette Année
                        </span>
                        {/* Trend Indicator vs Last Year */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          metrics.periodic.thisYear.growth > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : metrics.periodic.thisYear.growth < 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {metrics.periodic.thisYear.growth > 0 && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                          {metrics.periodic.thisYear.growth < 0 && <TrendingDown className="h-3 w-3 text-rose-600" />}
                          {metrics.periodic.thisYear.growth === 0 && <Minus className="h-3 w-3 text-gray-400" />}
                          <span>{metrics.periodic.thisYear.growth > 0 ? `+${metrics.periodic.thisYear.growth.toFixed(1)}%` : `${metrics.periodic.thisYear.growth.toFixed(1)}%`}</span>
                          <span className="text-[9px] font-normal text-gray-400">vs an préc.</span>
                        </div>
                      </div>

                      <div className="text-xl font-black text-gray-900 tracking-tight mb-1">
                        {formatBIF(metrics.periodic.thisYear.total)}
                      </div>

                      {/* SOUS-TITRE DE MARGE NETTE */}
                      <div className="bg-purple-50/70 border border-purple-100/80 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Marge brute:</span>
                          <span className="font-bold text-gray-700">{formatBIF(metrics.periodic.thisYear.netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-500">Dépenses:</span>
                          <span className="font-bold text-red-600">-{formatBIF(metrics.periodic.thisYear.expensesTotal)}</span>
                        </div>
                        <div className="border-t border-purple-100 pt-1 mt-1">
                          <div className="text-[10px] text-purple-900 font-bold uppercase tracking-wider">Bénéfice Net Réel</div>
                          <div className="text-sm font-extrabold text-purple-700">
                            {metrics.periodic.thisYear.realNetProfit > 0 ? '+' : ''}{formatBIF(metrics.periodic.thisYear.realNetProfit)}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {metrics.periodic.thisYear.count} vente(s) enregistrée(s)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn_print_report_this_year"
                      onClick={() => imprimerRapportA4("Cette Année", metrics.periodic.thisYearSalesList, metrics.periodic.thisYearExpensesList, "Bilan annuel d'activité")}
                      className="w-full mt-3 py-1.5 px-2 bg-slate-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg text-slate-700 hover:text-purple-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Imprimer l'historique des ventes de l'année au format A4"
                    >
                      <Printer className="h-3 w-3 text-gray-500" />
                      <span>Imprimer l'Historique (A4)</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* =======================================================
                  2. RÉPARTITION DES PAIEMENTS DU JOUR (SOUS LES 4 CARTES)
                  ======================================================= */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4" id="section_repartition_paiements">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#0066FF]" />
                      Répartition des Ventes du Jour par Mode de Paiement
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Ventilation des encaissements enregistrés aujourd'hui ({new Date().toLocaleDateString('fr-FR')})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                    <span>Total Jour :</span>
                    <span className="text-[#0066FF] font-black">{formatBIF(metrics.todayPayments.total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mode 1: Espèces */}
                  <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <Banknote className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">Espèces (Cash)</h4>
                          <span className="text-[10px] text-emerald-700 font-medium">Billets de caisse</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {metrics.todayPayments.especes.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-lg font-black text-emerald-900 mb-2">
                      {formatBIF(metrics.todayPayments.especes.amount)}
                    </div>

                    <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden mb-2">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, metrics.todayPayments.especes.percentage))}%` }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-emerald-800 font-semibold flex justify-between">
                      <span>{metrics.todayPayments.especes.count} transaction(s)</span>
                      <span>Encaissé direct</span>
                    </div>
                  </div>

                  {/* Mode 2: Mobile Money */}
                  <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center font-bold">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-950">Mobile Money</h4>
                          <span className="text-[10px] text-blue-700 font-medium">Lumicash / EcoCash</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {metrics.todayPayments.mobileMoney.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-lg font-black text-blue-900 mb-2">
                      {formatBIF(metrics.todayPayments.mobileMoney.amount)}
                    </div>

                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden mb-2">
                      <div 
                        className="bg-[#0066FF] h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, metrics.todayPayments.mobileMoney.percentage))}%` }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-blue-800 font-semibold flex justify-between">
                      <span>{metrics.todayPayments.mobileMoney.count} transaction(s)</span>
                      <span>Portefeuille électronique</span>
                    </div>
                  </div>

                  {/* Mode 3: Virement Bancaire */}
                  <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-950">Virement</h4>
                          <span className="text-[10px] text-indigo-700 font-medium">Comptes bancaires</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                        {metrics.todayPayments.virement.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-lg font-black text-indigo-900 mb-2">
                      {formatBIF(metrics.todayPayments.virement.amount)}
                    </div>

                    <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden mb-2">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, metrics.todayPayments.virement.percentage))}%` }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-indigo-800 font-semibold flex justify-between">
                      <span>{metrics.todayPayments.virement.count} transaction(s)</span>
                      <span>Banque / Électronique</span>
                    </div>
                  </div>
                </div>

                {/* Status bar if debts occurred today */}
                {metrics.todayPayments.dette.count > 0 && (
                  <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
                    <span className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Crédits / Dettes accordés aujourd'hui :
                    </span>
                    <span className="font-extrabold">
                      {formatBIF(metrics.todayPayments.dette.amount)} ({metrics.todayPayments.dette.count} facture(s))
                    </span>
                  </div>
                )}
              </div>

              {/* =======================================================
                  3. FILTRE SUR-MESURE & ANALYSE DE PÉRIODE PERSONNALISÉE
                  ======================================================= */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-5" id="section_filtre_sur_mesure">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-[#0066FF]" />
                      Filtre Sur-Mesure : Période Personnalisée
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Analysez instantanément le chiffre d'affaires et la marge bénéficiaire réelle sur n'importe quel intervalle de temps.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn_print_custom_period_a4"
                      onClick={() => imprimerRapportA4("Période Personnalisée", metrics.customSales, metrics.customExpensesList, `Intervalle : Du ${customStartDate || 'Début'} au ${customEndDate || 'Aujourd\'hui'}`)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Imprimer l'historique de cette sélection au format A4"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Imprimer l'Historique (A4)</span>
                    </button>
                    {/* Reset to 7d */}
                    <button 
                      onClick={() => applyDatePreset('7d')}
                      className="text-xs font-bold text-gray-500 hover:text-[#0066FF] hover:underline flex items-center gap-1 px-2 py-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {/* PRESETS BUTTONS ROW */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Raccourcis :</span>
                  {[
                    { id: 'today', label: "Aujourd'hui" },
                    { id: 'yesterday', label: "Hier" },
                    { id: '7d', label: "7 Derniers Jours" },
                    { id: '30d', label: "30 Derniers Jours" },
                    { id: 'thisMonth', label: "Ce Mois-ci" },
                    { id: 'lastMonth', label: "Mois Dernier" },
                    { id: 'thisYear', label: "Cette Année" },
                    { id: 'all', label: "Tout l'Historique" }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyDatePreset(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        customPeriodPreset === preset.id
                          ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-sm'
                          : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* DATE RANGE INPUTS */}
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-gray-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Du :
                    </label>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setCustomPeriodPreset('custom');
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Au :
                    </label>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setCustomPeriodPreset('custom');
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                {/* CUSTOM PERIOD RESULTS KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: CA Période */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Total des Ventes (CA)
                    </span>
                    <div className="text-lg font-black text-gray-900">
                      {formatBIF(metrics.customTotal)}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Sur l'intervalle sélectionné
                    </span>
                  </div>

                  {/* KPI 2: Marge Brute */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Marge Brute (Ventes)
                    </span>
                    <div className="text-lg font-black text-slate-700">
                      {formatBIF(metrics.customProfit)}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Bénéfice brut avant charges
                    </span>
                  </div>
                  
                  {/* KPI 2.5: Total Dépenses */}
                  <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">
                      Total Dépenses / Charges
                    </span>
                    <div className="text-lg font-black text-red-600">
                      -{formatBIF(metrics.customExpensesTotal)}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {metrics.customExpensesList.length} dépense(s)
                    </span>
                  </div>

                  {/* KPI 3: Bénéfice Réel (Marge Nette) */}
                  <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
                    <span className="text-[10px] font-bold text-[#0066FF] uppercase tracking-wider block mb-1">
                      Bénéfice Net Réel
                    </span>
                    <div className="text-lg font-black text-[#0066FF]">
                      {metrics.customProfit - metrics.customExpensesTotal > 0 ? '+' : ''}{formatBIF(metrics.customProfit - metrics.customExpensesTotal)}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Marge Brute - Dépenses
                    </span>
                  </div>

                  {/* KPI 4: Taux de Marge Moyen */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Rentabilité Réelle
                    </span>
                    <div className="text-lg font-black text-emerald-700">
                      {metrics.customMarginRate.toFixed(1)} %
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Basé sur bénéfice net réel
                    </span>
                  </div>
                </div>

                {/* CUSTOM PERIOD SALES TABLE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Détail des {metrics.customSales.length} Ventes sur la Période Choisie
                    </h4>
                    {metrics.customSales.length > 0 && (
                      <button
                        type="button"
                        id="btn_print_custom_table_a4"
                        onClick={() => imprimerRapportA4("Période Personnalisée", metrics.customSales, metrics.customExpensesList, `Intervalle : Du ${customStartDate || 'Début'} au ${customEndDate || 'Aujourd\'hui'}`)}
                        className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        Imprimer ce tableau (A4)
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {metrics.customSales.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs">
                        Aucune vente enregistrée sur cet intervalle de dates.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5">Réf & Date</th>
                              <th className="px-4 py-2.5">Client</th>
                              <th className="px-4 py-2.5">Règlement</th>
                              <th className="px-4 py-2.5 text-right">Total Vente</th>
                              <th className="px-4 py-2.5 text-right text-blue-700">Marge Nette</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {metrics.customSales.slice(0, 15).map(sale => {
                              const saleProfit = getSaleProfit(sale.id);
                              return (
                                <tr key={sale.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                                    <div>#FLX-{String(sale.id).padStart(4, '0')}</div>
                                    <span className="text-[10px] text-gray-400 font-normal">
                                      {new Date(sale.created_at).toLocaleDateString('fr-FR')} {new Date(sale.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 font-medium text-gray-700">
                                    {getCustomerName(sale.customer_id)}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      sale.payment_status === 'Cash'
                                        ? sale.payment_method === 'Mobile Money'
                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : sale.payment_method === 'Virement'
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                      {sale.payment_status === 'Cash' 
                                        ? `${sale.payment_method || 'Espèces'}` 
                                        : 'Dette / Crédit'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-black text-gray-900">
                                    {formatBIF(sale.total_amount)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-black text-[#0066FF]">
                                    +{formatBIF(saleProfit)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* =======================================================
                  4. SPLIT VIEW: RECENT SALES & HIGHLIGHTED METRICS
                  ======================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2-Thirds column: Recent Sales Log */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">5 Dernières Transactions Globales</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        id="btn_print_recent_sales_a4"
                        onClick={() => imprimerRapportA4("Dernières Transactions", sales.slice(0, 20), expenses.slice(0, 20), "Extrait des dernières transactions")}
                        className="text-xs text-gray-500 hover:text-[#0066FF] font-bold flex items-center gap-1"
                        title="Imprimer les transactions récentes en A4"
                      >
                        <Printer className="h-3 w-3" />
                        Imprimer (A4)
                      </button>
                      <button 
                        onClick={() => setActiveTab('pos')}
                        className="text-xs text-[#0066FF] font-bold hover:underline flex items-center gap-1"
                      >
                        Nouvelle vente <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                        <tr>
                          <th className="px-6 py-3">Réf/Date</th>
                          <th className="px-6 py-3">Client</th>
                          <th className="px-6 py-3">Mode</th>
                          <th className="px-6 py-3 text-right">Montant Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sales.slice(0, 5).map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-55/40">
                            <td className="p-3 font-semibold text-slate-700">
                              <div>#FLX-{String(sale.id).padStart(4, '0')}</div>
                              <span className="text-[10px] text-gray-400 font-normal">
                                {new Date(sale.created_at).toLocaleDateString('fr-FR')} {new Date(sale.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-gray-800">
                              {getCustomerName(sale.customer_id)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                sale.payment_status === 'Cash' 
                                  ? sale.payment_method === 'Mobile Money'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : sale.payment_method === 'Virement'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {sale.payment_status === 'Cash' ? `${sale.payment_method || 'Espèces'}` : 'Dette / Crédit'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              {formatBIF(sale.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 1-Third column: Fast Action / Low Stock references */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Besoins de Réapprovisionnement</h3>
                  <div className="border border-gray-200 p-4 rounded-xl bg-white space-y-3">
                    {products.filter(p => p.stock_quantity <= p.alert_quantity).length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold">Tous les stocks sont au vert !</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.filter(p => p.stock_quantity <= p.alert_quantity).slice(0, 4).map(prod => (
                          <div key={prod.id} className="flex justify-between items-center gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-gray-400 block">{prod.code}</span>
                              <span className="text-xs font-bold text-gray-800 truncate block">{prod.name}</span>
                              <span className="text-[10px] text-gray-500">Stock actuel : <strong className="text-rose-600 font-extrabold">{prod.stock_quantity}</strong> (Seuil : {prod.alert_quantity})</span>
                            </div>
                            <button 
                              onClick={() => {
                                setEditingProduct(prod);
                                setStockSearch(prod.code);
                                setActiveTab('stock');
                              }}
                              className="px-2 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-200"
                            >
                              Éditer
                            </button>
                          </div>
                        ))}
                        {products.filter(p => p.stock_quantity <= p.alert_quantity).length > 4 && (
                          <button 
                            onClick={() => {
                              setStockSearch('');
                              setActiveTab('stock');
                            }}
                            className="w-full text-center text-xs font-bold text-[#0066FF] hover:underline"
                          >
                            Voir les {products.filter(p => p.stock_quantity <= p.alert_quantity).length - 4} autres...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* LISTE DES DÉPENSES (RECENTES) */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Historique des Dépenses & Charges</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(true)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nouvelle Dépense</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Motif & Catégorie</th>
                        <th className="px-6 py-3">Mode</th>
                        <th className="px-6 py-3 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-400">
                            Aucune dépense enregistrée.
                          </td>
                        </tr>
                      ) : (
                        expenses.slice(0, 10).map(expense => (
                          <tr key={expense.id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-semibold text-slate-700">
                              <span className="text-[11px] text-gray-500 font-normal block">
                                {new Date(expense.created_at).toLocaleDateString('fr-FR')} {new Date(expense.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-gray-800">{expense.reason}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{expense.category}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200">
                                {expense.payment_method}
                              </span>
                            </td>
                            <td className="p-3 text-right font-black text-red-600">
                              -{expense.amount.toLocaleString()} BIF
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MVP STRATEGIC INSTRUCTION CARD */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-[#0066FF] mb-1">Ligne Directrice FLODELIXA Technologies</span>
                <p>
                  "Problème réel → Prototype simple (MVP) → ~10 commerçants bêtatesteurs réels à Bujumbura. Nous nous concentrons uniquement sur l'élimination des pertes financières liées aux crédits non remboursés et à la rupture de stock."
                </p>
              </div>

            </div>
          )}

          {/* =======================================================
              2. TAB: GESTION DU STOCK
              ======================================================= */}
          {activeTab === 'stock' && (
            <div className="space-y-6" id="view_stock">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
                    Gestion du Stock & Produits
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez vos références, fixez vos prix d\'achat et prix de vente pour le calcul automatique des marges.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="px-3 py-2 border border-gray-200 hover:border-blue-500 text-slate-700 hover:text-[#0066FF] rounded-xl text-xs font-bold bg-white shadow-sm flex items-center gap-1.5"
                    id="btn_open_category_modal"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Nouvelle Catégorie</span>
                  </button>
                  <button 
                    onClick={() => {
                      setNewProduct({
                        code: '',
                        name: '',
                        category_id: categories[0]?.id || 1,
                        purchase_price: 0,
                        selling_price: 0,
                        stock_quantity: 0,
                        alert_quantity: 5
                      });
                      setIsAddingProduct(true);
                    }}
                    className="px-3 py-2 bg-[#0066FF] text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                    id="btn_open_product_modal"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un Produit</span>
                  </button>
                </div>
              </div>

              {/* CATEGORY & SEARCH CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stock_filters">
                
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Chercher par nom ou code..." 
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] bg-white outline-none"
                    id="input_stock_search"
                  />
                </div>

                {/* Category filter dropdown */}
                <div>
                  <select 
                    value={stockCategoryFilter}
                    onChange={(e) => setStockCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] bg-white outline-none text-slate-700"
                    id="select_stock_category_filter"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Info summary */}
                <div className="text-right flex items-center justify-end text-xs text-gray-500 font-medium">
                  {filteredProducts.length} référence(s) trouvée(s)
                </div>

              </div>

              {/* CONDITIONAL FORMS: NEW CATEGORY */}
              {isAddingCategory && (
                <form onSubmit={handleAddCategory} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Créer une Nouvelle Catégorie (Gérant unique)</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(false)}
                      className="text-gray-400 hover:text-slate-600 font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: Quincaillerie, Médicaments, Boissons..." 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white outline-none"
                      disabled={currentUser.role !== 'Gérant'}
                    />
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-[#0066FF] text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                      disabled={currentUser.role !== 'Gérant'}
                    >
                      Ajouter
                    </button>
                  </div>
                  {currentUser.role !== 'Gérant' && (
                    <p className="text-[10px] text-rose-600 font-medium">** Vous devez basculer en rôle "Gérant" ci-dessus pour ajouter une catégorie.</p>
                  )}
                </form>
              )}

              {/* CONDITIONAL FORMS: NEW PRODUCT */}
              {isAddingProduct && (
                <form onSubmit={handleAddProduct} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in" id="form_new_product">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Ajouter un Nouveau Produit</h3>
                    <button type="button" onClick={() => setIsAddingProduct(false)} className="text-gray-400 hover:text-slate-600 text-xs">Fermer</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Code Unique</label>
                      <input 
                        type="text" 
                        placeholder="Ex: CIM-01" 
                        value={newProduct.code}
                        onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Désignation / Nom du Produit</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Ciment Dangote 42.5R (Sac 50kg)" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Catégorie</label>
                      <select 
                        value={newProduct.category_id}
                        onChange={(e) => setNewProduct({...newProduct, category_id: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none text-slate-700"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix d'Achat (BIF)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 28000" 
                        value={newProduct.purchase_price || ''}
                        onChange={(e) => setNewProduct({...newProduct, purchase_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix de Vente (BIF)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 33000" 
                        value={newProduct.selling_price || ''}
                        onChange={(e) => setNewProduct({...newProduct, selling_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantité Initiale en Stock</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 50" 
                        value={newProduct.stock_quantity || ''}
                        onChange={(e) => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seuil Alerte Stock Bas</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 5" 
                        value={newProduct.alert_quantity || ''}
                        onChange={(e) => setNewProduct({...newProduct, alert_quantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingProduct(false)}
                      className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Enregistrer le Produit
                    </button>
                  </div>
                </form>
              )}

              {/* CONDITIONAL FORMS: EDIT PRODUCT */}
              {editingProduct && (
                <form onSubmit={handleEditProduct} className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4 animate-fade-in" id="form_edit_product">
                  <div className="flex justify-between items-center border-b border-amber-250 pb-2">
                    <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Modifier le Produit : {editingProduct.name}</h3>
                    <button type="button" onClick={() => setEditingProduct(null)} className="text-amber-800 hover:text-amber-950 text-xs">Fermer</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Code</label>
                      <input 
                        type="text" 
                        value={editingProduct.code}
                        onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nom du Produit</label>
                      <input 
                        type="text" 
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Catégorie</label>
                      <select 
                        value={editingProduct.category_id}
                        onChange={(e) => setEditingProduct({...editingProduct, category_id: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none text-slate-700"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix d'Achat (BIF)</label>
                      <input 
                        type="number" 
                        value={editingProduct.purchase_price}
                        onChange={(e) => setEditingProduct({...editingProduct, purchase_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prix de Vente (BIF)</label>
                      <input 
                        type="number" 
                        value={editingProduct.selling_price}
                        onChange={(e) => setEditingProduct({...editingProduct, selling_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantité Disponible</label>
                      <input 
                        type="number" 
                        value={editingProduct.stock_quantity}
                        onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seuil Alerte</label>
                      <input 
                        type="number" 
                        value={editingProduct.alert_quantity}
                        onChange={(e) => setEditingProduct({...editingProduct, alert_quantity: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              )}

              {/* PRODUCTS DATA TABLE */}
              <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-left text-xs" id="table_stock_products">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                      <th className="px-6 py-4">Code / Produit</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4 text-right">Prix d'Achat</th>
                      <th className="px-6 py-4 text-right">Prix de Vente</th>
                      <th className="px-6 py-4 text-right">Marge Bénéf.</th>
                      <th className="px-6 py-4 text-center">Quantité Stock</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-400">
                          Aucun produit trouvé dans cette sélection.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const effectiveAlertQty = Math.max(p.alert_quantity, companySettings?.criticalStockThreshold ?? 5);
                        const isAlert = p.stock_quantity <= effectiveAlertQty;
                        const margin = p.selling_price - p.purchase_price;
                        const canSeeMargins = currentUser.role === 'Gérant' || Boolean(companySettings?.allowEmployeeViewMargins);
                        return (
                          <tr key={p.id} className="hover:bg-slate-55/40">
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-[#0066FF] block uppercase tracking-wider">{p.code}</span>
                              <span className="font-bold text-gray-800 text-xs">{p.name}</span>
                            </td>
                            <td className="p-3 font-medium text-slate-600 text-xs">
                              {getCategoryName(p.category_id)}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-700">
                              {canSeeMargins ? formatBIF(p.purchase_price) : <span className="text-gray-400 italic">Masqué</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              {formatBIF(p.selling_price)}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              {canSeeMargins ? `+${formatBIF(margin)}` : <span className="text-gray-400 font-normal italic">Masqué</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isAlert 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold animate-pulse' 
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {isAlert && <AlertTriangle className="h-3.5 w-3.5" />}
                                <span>{p.stock_quantity} pièces</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1.5 text-gray-400 hover:text-[#0066FF] hover:bg-gray-50 rounded transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  id={`btn_delete_product_${p.id}`}
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className={`p-1.5 rounded transition-colors ${
                                    currentUser.role !== 'Gérant'
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                  }`}
                                  title="Supprimer (Réservé Gérant)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* =======================================================
              3. TAB: POINT DE VENTE (POS / CAISSE)
              ======================================================= */}
          {activeTab === 'pos' && (
            <div className="space-y-6" id="view_pos">
              
              <div className="border-b border-gray-200 pb-5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
                  Caisse & Facturation POS
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez rapidement les articles, ajustez les quantités et validez les règlements (Comptant ou Dette client).
                </p>
              </div>

              {/* TWO COLUMN GRID : LEFT PRODUCT SELECTION, RIGHT SHOPPING CART */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6" id="pos_workspace">
                
                {/* Left Side: Product Picker (7 Columns) */}
                <div className="w-full md:w-[60%] lg:w-[65%] space-y-4">
                  
                  {/* Quick Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2 text-gray-400 h-4 w-4" />
                      <input 
                        type="text" 
                        placeholder="Recherche produit rapide..." 
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0066FF] outline-none"
                        id="input_pos_search"
                      />
                    </div>
                    <select 
                      value={posCategoryFilter}
                      onChange={(e) => setPosCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white text-slate-600 outline-none"
                    >
                      <option value="all">Toutes catégories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grid layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1" id="pos_product_grid">
                    {filteredPOSProducts.map(p => {
                      const isOutOfStock = p.stock_quantity <= 0;
                      const isLowStock = p.stock_quantity <= p.alert_quantity;
                      return (
                        <div 
                          key={p.id}
                          onClick={() => !isOutOfStock && addToCart(p)}
                          className={`p-3.5 border rounded-xl bg-white text-left transition-all ${
                            isOutOfStock 
                              ? 'opacity-40 border-gray-100 cursor-not-allowed bg-gray-50' 
                              : 'border-gray-200 hover:border-[#0066FF] cursor-pointer hover:shadow-md hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">{p.code}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isOutOfStock 
                                ? 'bg-rose-100 text-rose-800' 
                                : isLowStock 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {isOutOfStock ? 'Épuisé' : `Stock: ${p.stock_quantity}`}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-800 mt-1 line-clamp-2 min-h-[32px]">{p.name}</h4>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                            <span className="text-[10px] text-gray-500">{getCategoryName(p.category_id)}</span>
                            <span className="text-xs font-black text-[#0066FF]">{formatBIF(p.selling_price)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Right Side: Active Cart & Checkout Form (5 Columns) */}
                <div className="w-full md:w-[40%] lg:w-[35%] bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between" id="pos_checkout_box">
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <h3 className="text-xs font-extrabold text-[#0D1B2A] uppercase tracking-wider flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-[#0066FF]" />
                        <span>Panier Actuel</span>
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => setCart([])} 
                        className="text-[10px] text-gray-400 hover:text-rose-600 font-bold uppercase tracking-wider"
                        disabled={cart.length === 0}
                      >
                        Vider
                      </button>
                    </div>

                    {/* CART ITEMS LIST */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="cart_items_container">
                      {cart.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs">
                          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-600" />
                          Le panier est vide. Cliquez sur un produit à gauche pour l'ajouter.
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 text-xs">
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-gray-800 truncate">{item.product.name}</h5>
                              <span className="text-[10px] text-gray-500">{formatBIF(item.product.selling_price)} x {item.quantity}</span>
                            </div>
                            
                            {/* Quantity buttons */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, -1)}
                                className="h-7 w-7 md:h-5 md:w-5 rounded bg-gray-100 hover:bg-slate-200 flex items-center justify-center font-bold text-base md:text-sm"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, 1)}
                                className="h-7 w-7 md:h-5 md:w-5 rounded bg-gray-100 hover:bg-slate-200 flex items-center justify-center font-bold text-base md:text-sm"
                              >
                                +
                              </button>
                            </div>

                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* PAYMENT MODE SELECTOR */}
                    {cart.length > 0 && (
                      <div className="border-t border-gray-200 pt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Règlement de la Vente</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setPaymentStatus('Cash');
                                setSelectedCustomerId('');
                              }}
                              className={`py-3 md:py-2 text-sm md:text-xs font-bold rounded-xl border transition-all ${
                                paymentStatus === 'Cash' 
                                   ? 'bg-[#0066FF] text-white border-transparent shadow-sm' 
                                  : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              COMPTANT (CASH)
                            </button>
                            <button 
                              type="button"
                              onClick={() => setPaymentStatus('Dette')}
                              className={`py-3 md:py-2 text-sm md:text-xs font-bold rounded-xl border transition-all ${
                                paymentStatus === 'Dette' 
                                  ? 'bg-amber-500 text-white border-transparent shadow-sm' 
                                  : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              CRÉDIT (DETTE CLIENT)
                            </button>
                          </div>
                        </div>

                        {/* CASH SPECIFIC SUB-METHODS */}
                        {paymentStatus === 'Cash' && (
                          <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl space-y-1.5 animate-fade-in">
                            <label className="block text-[10px] font-bold text-blue-900 uppercase">Mode d'encaissement</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPosPaymentMethod('Espèces')}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${
                                  posPaymentMethod === 'Espèces'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-gray-200 hover:bg-emerald-50'
                                }`}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                <span>Espèces</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPosPaymentMethod('Mobile Money')}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${
                                  posPaymentMethod === 'Mobile Money'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-gray-200 hover:bg-blue-50'
                                }`}
                              >
                                <Smartphone className="h-3.5 w-3.5" />
                                <span>Mobile Money</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPosPaymentMethod('Virement')}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${
                                  posPaymentMethod === 'Virement'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-gray-200 hover:bg-indigo-50'
                                }`}
                              >
                                <Building2 className="h-3.5 w-3.5" />
                                <span>Virement</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CONDITIONAL DEBT CUSTOMER FIELD */}
                        {paymentStatus === 'Dette' && (
                          <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl space-y-3 animate-fade-in text-xs">
                            <h4 className="font-bold text-amber-950 text-xs">Suivi Dette Client</h4>
                            
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-900 mb-1">Sélectionner un Client Débiteur</label>
                              <select 
                                value={selectedCustomerId}
                                onChange={(e) => {
                                  setSelectedCustomerId(e.target.value as any);
                                  if (e.target.value === 'new') {
                                    setIsCreatingCustomerPOS(true);
                                  } else {
                                    setIsCreatingCustomerPOS(false);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                              >
                                <option value="">-- Choisir un client débiteur --</option>
                                {customers.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                                <option value="new">+ Créer une nouvelle fiche client</option>
                              </select>
                            </div>

                            {/* INLINE NEW CUSTOMER FORM */}
                            {isCreatingCustomerPOS && (
                              <div className="bg-white p-3 border border-amber-200 rounded-lg space-y-2 animate-fade-in">
                                <h5 className="font-bold text-[10px] text-gray-500 uppercase">Nouvelle Fiche Client</h5>
                                <div className="space-y-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="Nom Complet (Ex: Elysée NKURUNZIZA)" 
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="N° de Téléphone (Ex: +257 79...)" 
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50"
                                  />
                                </div>
                              </div>
                            )}

                            {/* INITIAL PAYMENT / DEPOSIT IF ANY */}
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-900 mb-1">Acompte versé au départ (BIF - Optionnel)</label>
                              <input 
                                type="number" 
                                placeholder="0 BIF"
                                value={amountPaidInitial || ''}
                                onChange={(e) => setAmountPaidInitial(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                              />
                              <p className="text-[10px] text-amber-700 mt-1">Le reste à payer sera enregistré comme dette active.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM TOTAL SUMMARY & SUBMIT */}
                  {cart.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Facture :</span>
                        <span className="text-lg font-black text-gray-900" id="pos_total_amount">{formatBIF(getCartTotal())}</span>
                      </div>

                      {paymentStatus === 'Dette' && (
                        <div className="flex justify-between items-center text-xs border-b border-dashed border-gray-200 pb-2">
                          <span className="text-gray-500">Reste dû par le client :</span>
                          <span className="font-extrabold text-amber-700">
                            {formatBIF(getCartTotal() - (Number(amountPaidInitial) || 0))}
                          </span>
                        </div>
                      )}

                      <button 
                        onClick={handleInitiatePayment}
                        className={`w-full py-4 md:py-3 rounded-xl text-sm md:text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                          paymentStatus === 'Dette' 
                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                            : 'bg-[#0066FF] hover:bg-blue-700 shadow-blue-100'
                        }`}
                        id="btn_pos_validate"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>CONFIRMER LE RÈGLEMENT (ÉTAPE DE VALIDATION)</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* =======================================================
              4. TAB: SUIVI DES DETTES
              ======================================================= */}
          {activeTab === 'debts' && (
            <div className="space-y-6" id="view_debts">
              
              <div className="border-b border-gray-200 pb-5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
                  Registre des Dettes & Remboursements
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Consultez les arriérés de vos clients débiteurs, suivez l'historique des remboursements et recouvrez vos fonds.
                </p>
              </div>

              {/* LIVE COUNTERS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="debts_summary_cards">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Total Crédits Accordés</span>
                  <div className="text-lg font-black text-amber-950">
                    {formatBIF(debts.reduce((sum, d) => sum + d.amount_due, 0))}
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Montant Déjà Recouvré</span>
                  <div className="text-lg font-black text-emerald-950">
                    {formatBIF(debts.reduce((sum, d) => sum + d.amount_paid, 0))}
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block mb-1">Reste Actif à Récupérer</span>
                  <div className="text-lg font-black text-rose-950">
                    {formatBIF(metrics.totalPendingDebts)}
                  </div>
                </div>
              </div>

              {/* LIST CONTROLS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs" id="debts_status_filter">
                  <button 
                    onClick={() => setDebtFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold ${debtFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                  >
                    Toutes
                  </button>
                  <button 
                    onClick={() => setDebtFilter('Pending')}
                    className={`px-3 py-1 rounded-lg font-bold ${debtFilter === 'Pending' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500'}`}
                  >
                    Non Remboursées (En attente)
                  </button>
                  <button 
                    onClick={() => setDebtFilter('Paid')}
                    className={`px-3 py-1 rounded-lg font-bold ${debtFilter === 'Paid' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'}`}
                  >
                    Entièrement Réglées
                  </button>
                </div>

                <div className="text-xs font-semibold text-gray-500">
                  {filteredDebts.length} dette(s) listée(s)
                </div>
              </div>

              {/* CONDITIONAL PAYMENT MODAL/FORM */}
              {/* CONDITIONAL PAYMENT MODAL/FORM */}
              {selectedDebtForPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                  <form onSubmit={handleRepaymentSubmit} className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden" id="form_repayment">
                    <div className="bg-amber-50 border-b border-amber-100 p-5 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                          Encaisser un Remboursement
                        </h3>
                        <p className="text-xs text-amber-700 mt-0.5">Client: <span className="font-bold">{getCustomerName(selectedDebtForPayment.customer_id)}</span></p>
                      </div>
                      <button type="button" onClick={() => setSelectedDebtForPayment(null)} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="flex bg-gray-50 rounded-xl p-4 divide-x divide-gray-200 border border-gray-100 text-xs">
                        <div className="flex-1 px-2 text-center">
                          <span className="text-gray-500 block mb-1 font-semibold">Montant Initial Dû</span>
                          <strong className="text-gray-900 font-bold text-sm">{formatBIF(selectedDebtForPayment.amount_due)}</strong>
                        </div>
                        <div className="flex-1 px-2 text-center">
                          <span className="text-gray-500 block mb-1 font-semibold">Déjà remboursé</span>
                          <strong className="text-emerald-600 font-bold text-sm">{formatBIF(selectedDebtForPayment.amount_paid)}</strong>
                        </div>
                        <div className="flex-1 px-2 text-center">
                          <span className="text-gray-500 block mb-1 font-semibold">Reste à payer</span>
                          <strong className="text-amber-600 font-bold text-sm">
                            {formatBIF(selectedDebtForPayment.amount_due - selectedDebtForPayment.amount_paid)}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Montant Encaissé (BIF)</label>
                          <input 
                            type="number" 
                            placeholder="Ex: 10000" 
                            value={repaymentAmount || ''}
                            onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl text-sm font-bold bg-white outline-none transition-all"
                            required
                            min="1"
                            max={selectedDebtForPayment.amount_due - selectedDebtForPayment.amount_paid}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mode de paiement</label>
                            <select 
                              value={repaymentMethod}
                              onChange={(e) => setRepaymentMethod(e.target.value as PaymentMethod)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none"
                            >
                              <option value="Espèces">Espèces</option>
                              <option value="Mobile Money">Mobile Money</option>
                              <option value="Virement">Virement Bancaire</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">N° de Référence (Optionnel)</label>
                            <input 
                              type="text" 
                              placeholder="Ex: ID-123456" 
                              value={repaymentReference}
                              onChange={(e) => setRepaymentReference(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={() => setSelectedDebtForPayment(null)}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Confirmer Encaissement
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* DEBTS GRID LIST */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs" id="table_debts_registry">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                      <th className="px-6 py-4">Client Débiteur</th>
                      <th className="px-6 py-4">Date Vente</th>
                      <th className="px-6 py-4 text-right">Crédit Total</th>
                      <th className="px-6 py-4 text-right">Total Remboursé</th>
                      <th className="px-6 py-4 text-right">Solde Restant</th>
                      <th className="px-6 py-4 text-center">Statut</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDebts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-400">
                          Aucun registre de dette ne correspond à ce filtre.
                        </td>
                      </tr>
                    ) : (
                      filteredDebts.map(debt => {
                        const remaining = debt.amount_due - debt.amount_paid;
                        const isPaid = debt.status === 'Paid';
                        return (
                          <tr key={debt.id} className="hover:bg-slate-55/40">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 text-xs block">{getCustomerName(debt.customer_id)}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {getCustomerPhone(debt.customer_id)}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-gray-500">
                              {new Date(debt.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-700">
                              {formatBIF(debt.amount_due)}
                            </td>
                            <td className="p-3 text-right font-semibold text-emerald-600">
                              {formatBIF(debt.amount_paid)}
                            </td>
                            <td className="p-3 text-right font-black text-[#0D1B2A]">
                              {formatBIF(remaining)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPaid 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {isPaid ? 'Régularisée (Payé)' : 'Dette En cours'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {!isPaid ? (
                                <button 
                                  onClick={() => {
                                    setSelectedDebtForPayment(debt);
                                    setRepaymentAmount(remaining);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 mx-auto"
                                  id={`btn_repay_${debt.id}`}
                                >
                                  <Check className="h-3 w-3 inline mr-1" /> Encaisser / Régulariser
                                </button>
                              ) : (
                                <span className="text-emerald-600 font-semibold text-[10px] inline-flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Terminé
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* =======================================================
              5. TAB: SOURCE CODE DEVELOPMENT PHP / MYSQL
              ======================================================= */}
          {activeTab === 'code' && (
            <div className="space-y-6" id="view_developer_code">
              
              <div className="border-b border-gray-200 pb-5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
                  Code Source de Production PHP 8+ / MySQLi
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Accédez et copiez directement le code backend hautement sécurisé conçu par FLODELIXA Technologies. Conforme à la roadmap de validation terrain XAMPP.
                </p>
              </div>

              {/* SELECTION TABS FOR FILES */}
              <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3" id="code_file_selector">
                <button 
                  onClick={() => setSelectedCodeFile('schemaSql')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'schemaSql'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  schema.sql (Structure MySQL)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('dbConnectPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'dbConnectPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  db_connect.php
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('authPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'authPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  auth.php (Session Sec.)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('stockPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'stockPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  stock.php (CRUD Sec.)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('posPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'posPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  pos.php (Transactions)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('dettesPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'dettesPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  dettes.php (Remboursements)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('dashboardPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'dashboardPhp'
                      ? 'bg-slate-900 text-white border-transparent'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  dashboard.php (Calculs KPI)
                </button>
                <button 
                  onClick={() => setSelectedCodeFile('settingsPhp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedCodeFile === 'settingsPhp'
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  settings.php (PDO + UI)
                </button>
              </div>

              {/* SECURITY SUMMARY CARD */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Audit de Sécurité Intégré • FLODELIXA Technologies</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Toutes les requêtes SQL utilisent impérativement les requêtes préparées MySQLi / PDO (Prepared Statements) : 
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">$conn-&gt;prepare()</code> et 
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">$pdo-&gt;prepare()</code>. 
                  Cela protège à 100% l'application contre les attaques de type Injection SQL (OWASP Top 10) sans nécessiter de framework complexe.
                </p>
              </div>

              {/* CODE BLOCK SHOWCASE WITH EASY COPY */}
              <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-950 shadow-inner" id="code_block_viewer">
                
                {/* Panel actions */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center text-xs text-gray-400">
                  <span className="font-mono text-[10px] tracking-wide text-slate-300">
                    Fichier : {
                      selectedCodeFile === 'schemaSql' ? 'schema.sql' :
                      selectedCodeFile === 'dbConnectPhp' ? 'db_connect.php' :
                      selectedCodeFile === 'authPhp' ? 'auth.php' :
                      selectedCodeFile === 'stockPhp' ? 'stock.php' :
                      selectedCodeFile === 'posPhp' ? 'pos.php' :
                      selectedCodeFile === 'dettesPhp' ? 'dettes.php' :
                      selectedCodeFile === 'settingsPhp' ? 'settings.php' : 'dashboard.php'
                    }
                  </span>
                  <button 
                    onClick={() => handleCopyToClipboard(backendFiles[selectedCodeFile])}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {copiedFile ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedFile ? 'Copié !' : 'Copier le code'}</span>
                  </button>
                </div>

                {/* Actual code display area */}
                <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-400/90 max-h-[500px]">
                  <code>{backendFiles[selectedCodeFile]}</code>
                </pre>

              </div>

            </div>
          )}

          {activeTab === 'settings' && currentUser.role === 'Gérant' && (
            <div className="space-y-6 animate-fade-in pb-10" id="settings_tab">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Paramètres du système</h2>
                  <p className="text-xs text-gray-500 mt-1">Configuration modulaire : boutique, reçus POS, règles de stock et droits utilisateurs</p>
                </div>
                <div className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600">
                  Devise active : <span className="text-[#0066FF]">{companySettings.currency || 'BIF'}</span>
                </div>
              </div>

              {/* NAVIGATION DES 4 ONGLETS PARAMÈTRES */}
              <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-wrap gap-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('boutique')}
                  className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    settingsSubTab === 'boutique' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>1. Boutique &amp; Devise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('recus')}
                  className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    settingsSubTab === 'recus' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  <span>2. Reçus &amp; POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('stock')}
                  className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    settingsSubTab === 'stock' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>3. Stock &amp; Alertes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('droits')}
                  className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    settingsSubTab === 'droits' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>4. Utilisateurs &amp; Droits</span>
                </button>
              </div>

              {/* SECTION: PARAMÈTRES GÉNÉRAUX (4 ONGLETS) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5" id="company_settings_card">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    localStorage.setItem('fx_company_settings', JSON.stringify(companySettings));
                    showNotification('success', 'Paramètres enregistrés et appliqués sur toute l\'interface !');
                  }}
                  className="space-y-5"
                  id="form_company_settings"
                >
                  {/* ONGLET 1 : BOUTIQUE & DEVISE */}
                  {settingsSubTab === 'boutique' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Identité du Commerce &amp; Devise</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Coordonnées officielles affichées dans l'interface, les reçus thermiques 80mm et les rapports A4.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nom du commerce / Boutique *
                          </label>
                          <input
                            type="text"
                            id="input_company_name"
                            required
                            value={companySettings.name}
                            onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                            placeholder="ex: Superette du Centre, Boutique..."
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Adresse / Ville *
                          </label>
                          <input
                            type="text"
                            id="input_company_address"
                            required
                            value={companySettings.address}
                            onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                            placeholder="ex: Av. de l'Université, Bujumbura"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Téléphone / Contact *
                          </label>
                          <input
                            type="text"
                            id="input_company_phone"
                            required
                            value={companySettings.phone}
                            onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                            placeholder="ex: +257 22 00 00 00"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Adresse Email
                          </label>
                          <input
                            type="email"
                            id="input_company_email"
                            value={companySettings.email || ''}
                            onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                            placeholder="ex: contact@boutique.bi"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Numéro NIF (Fiscal)
                          </label>
                          <input
                            type="text"
                            id="input_company_nif"
                            value={companySettings.nif || ''}
                            onChange={(e) => setCompanySettings({ ...companySettings, nif: e.target.value })}
                            placeholder="ex: 4000123456"
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Devise principale *
                          </label>
                          <select
                            id="input_company_currency"
                            value={companySettings.currency || 'BIF'}
                            onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold bg-white"
                          >
                            <option value="BIF">BIF — Franc Burundais</option>
                            <option value="USD">USD — Dollar Américain</option>
                            <option value="EUR">EUR — Euro</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ONGLET 2 : REÇUS & POS */}
                  {settingsSubTab === 'recus' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Reçus Thermiques &amp; Point de Vente (POS)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Personnalisez les tickets 80mm, messages WhatsApp et l'impression automatique.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          En-tête du ticket de caisse
                        </label>
                        <input
                          type="text"
                          id="input_company_header_msg"
                          value={companySettings.receiptHeader || ''}
                          onChange={(e) => setCompanySettings({ ...companySettings, receiptHeader: e.target.value })}
                          placeholder="ex: FACTURE OFFICIELLE • DEFFLOX STOCK & FINANCE"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Message de bas de ticket de caisse
                        </label>
                        <input
                          type="text"
                          id="input_company_footer_msg"
                          value={companySettings.receiptFooterMessage}
                          onChange={(e) => setCompanySettings({ ...companySettings, receiptFooterMessage: e.target.value })}
                          placeholder="ex: Merci pour votre visite et à bientôt !"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Ce message apparaîtra au bas de tous les tickets de caisse 80mm et sur WhatsApp.</p>
                      </div>
                      <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">Activer l'impression automatique après encaissement</span>
                          <span className="text-xs text-gray-500">Prépare automatiquement l'impression dès la validation du paiement POS.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(companySettings.autoPrintReceipt)}
                          onChange={(e) => setCompanySettings({ ...companySettings, autoPrintReceipt: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  )}

                  {/* ONGLET 3 : STOCK & ALERTES */}
                  {settingsSubTab === 'stock' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Règles de Stock &amp; Alertes Critiques</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Applicable à tous les conditionnements (Pièce, Sac 50kg, Barre 12m, Boîte de 100...).</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Seuil minimal global pour alerte critique
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={companySettings.criticalStockThreshold ?? 5}
                            onChange={(e) => setCompanySettings({ ...companySettings, criticalStockThreshold: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">Déclenche l'alerte visuelle dès que le stock atteint ce seuil.</p>
                        </div>

                        <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">Autoriser la vente en stock négatif</span>
                            <span className="text-xs text-gray-500">Si désactivé, le POS interdit toute vente lorsque la quantité demandée dépasse le stock.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(companySettings.allowNegativeStock)}
                            onChange={(e) => setCompanySettings({ ...companySettings, allowNegativeStock: e.target.checked })}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ONGLET 4 : UTILISATEURS & DROITS */}
                  {settingsSubTab === 'droits' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">Rôles &amp; Permissions (Admin / Gérant / Caissier)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Contrôlez les droits de remise en caisse et la visibilité des marges bénéficiaires.</p>
                      </div>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                            <tr>
                              <th className="px-4 py-3">Rôle</th>
                              <th className="px-4 py-3 text-center">Accorder des réductions (POS)</th>
                              <th className="px-4 py-3 text-center">Afficher les marges &amp; prix d'achat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-slate-900 block">Admin</span>
                                <span className="text-[11px] text-gray-400">Contrôle total du système</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input type="checkbox" checked disabled className="w-4 h-4 text-blue-600 rounded opacity-60" />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input type="checkbox" checked disabled className="w-4 h-4 text-blue-600 rounded opacity-60" />
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-slate-900 block">Gérant</span>
                                <span className="text-[11px] text-gray-400">Gestion stocks, finances &amp; caisse</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input type="checkbox" checked disabled className="w-4 h-4 text-blue-600 rounded opacity-70" />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input type="checkbox" checked disabled className="w-4 h-4 text-blue-600 rounded opacity-70" />
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-slate-900 block">Caissier / Employé</span>
                                <span className="text-[11px] text-gray-400">Point de vente et consultation stock</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(companySettings.allowEmployeeDiscount)}
                                  onChange={(e) => setCompanySettings({ ...companySettings, allowEmployeeDiscount: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(companySettings.allowEmployeeViewMargins)}
                                  onChange={(e) => setCompanySettings({ ...companySettings, allowEmployeeViewMargins: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      id="btn_save_company_settings"
                      className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Enregistrer les paramètres
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION: ZONE DE DANGER */}
              <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6" id="danger_zone_card">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">Zone de Danger : Réinitialisation Financière</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      Cette action supprimera <strong>l'intégralité</strong> de l'historique des ventes, des dettes, des créances clients et des dépenses.
                      Le catalogue de produits, les clients, les utilisateurs et les paramètres de l'entreprise seront <strong>conservés</strong>.
                    </p>
                    <button
                      id="btn_open_reset_modal"
                      onClick={() => {
                        setResetConfirmationInput('');
                        setIsResetFinancialsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Réinitialiser la caisse et l'historique
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
      {/* =======================================================
          PAYMENT CONFIRMATION MODAL (Step prior to receipt emission)
          ======================================================= */}
      {isPaymentConfirmationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" id="modal-confirmation-paiement">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[95vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-[#0066FF] rounded-xl">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Validation & Confirmation du Paiement</h3>
                    <p className="text-[11px] text-gray-500">Étape obligatoire avant émission et impression du reçu de caisse</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentConfirmationOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sale Financial Recap */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Articles dans la commande :</span>
                <span className="font-bold text-gray-800">{cart.reduce((s, i) => s + i.quantity, 0)} unité(s) ({cart.length} référence(s))</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Client associé :</span>
                <span className="font-bold text-gray-800">
                  {selectedCustomerId === 'new' 
                    ? `${newCustomer.name || 'Nouveau Client'} (${newCustomer.phone || 'N/A'})` 
                    : selectedCustomerId !== '' 
                      ? getCustomerName(Number(selectedCustomerId)) 
                      : 'Client Comptoir (Anonyme)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Montant Total à Percevoir :</span>
                <span className="text-xl font-black text-[#0066FF]">{formatBIF(getCartTotal())}</span>
              </div>
              {paymentStatus === 'Dette' && (
                <div className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg mt-1 flex justify-between">
                  <span>Acompte initial perçu : <strong>{formatBIF(Number(amountPaidInitial) || 0)}</strong></span>
                  <span>Solde restant dû : <strong>{formatBIF(getCartTotal() - (Number(amountPaidInitial) || 0))}</strong></span>
                </div>
              )}
            </div>

            {/* Payment Method Selector / Confirmation */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Mode de Règlement Sélectionné <span className="text-rose-500">*</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('Cash');
                    setPosPaymentMethod('Espèces');
                    if (!paymentReference || paymentReference.startsWith('LUMI-') || paymentReference.startsWith('ECO-') || paymentReference.startsWith('VIR-') || paymentReference.startsWith('BON-')) {
                      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setPaymentReference(`ESP-${dateCode}-${rand}`);
                    }
                  }}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentStatus === 'Cash' && posPaymentMethod === 'Espèces'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="text-[11px]">Espèces</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('Cash');
                    setPosPaymentMethod('Mobile Money');
                    if (paymentReference.startsWith('ESP-') || paymentReference.startsWith('VIR-') || paymentReference.startsWith('BON-')) {
                      setPaymentReference('LUMI-');
                    }
                  }}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentStatus === 'Cash' && posPaymentMethod === 'Mobile Money'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="text-[11px]">Mobile Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('Cash');
                    setPosPaymentMethod('Virement');
                    if (paymentReference.startsWith('ESP-') || paymentReference.startsWith('LUMI-') || paymentReference.startsWith('ECO-') || paymentReference.startsWith('BON-')) {
                      setPaymentReference('VIR-');
                    }
                  }}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentStatus === 'Cash' && posPaymentMethod === 'Virement'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-[11px]">Virement</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('Dette');
                    const rand = Math.floor(100 + Math.random() * 900);
                    setPaymentReference(`BON-DETTE-${rand}`);
                  }}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentStatus === 'Dette'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-[11px]">Crédit / Dette</span>
                </button>
              </div>
            </div>

            {/* MANDATORY PAYMENT REFERENCE FIELD */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="input_payment_reference" className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Référence du paiement / N° Transaction</span>
                  <span className="text-rose-600 font-extrabold">* (Obligatoire)</span>
                </label>
                <span className="text-[10px] text-gray-400">ID SMS / N° Récépissé</span>
              </div>

              <div className="relative">
                <input
                  id="input_payment_reference"
                  type="text"
                  placeholder="Ex: LUMI-984321, ECO-773412, VIR-BCB-4491 ou ESP-240831-102"
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    if (paymentReferenceError) setPaymentReferenceError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono font-bold outline-none transition-all ${
                    paymentReferenceError 
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-200' 
                      : 'border-gray-300 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100'
                  }`}
                  required
                />
              </div>

              {/* Quick Helper buttons for presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-gray-400 font-medium">Préfixes rapides :</span>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100000 + Math.random() * 900000);
                    setPaymentReference(`LUMI-${rand}`);
                    if (paymentReferenceError) setPaymentReferenceError(null);
                  }}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold border border-blue-200 transition-colors"
                >
                  + Lumicash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100000 + Math.random() * 900000);
                    setPaymentReference(`ECO-${rand}`);
                    if (paymentReferenceError) setPaymentReferenceError(null);
                  }}
                  className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-semibold border border-red-200 transition-colors"
                >
                  + EcoCash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(10000 + Math.random() * 90000);
                    setPaymentReference(`VIR-BCB-${rand}`);
                    if (paymentReferenceError) setPaymentReferenceError(null);
                  }}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold border border-indigo-200 transition-colors"
                >
                  + Virement Bancaire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                    const rand = Math.floor(1000 + Math.random() * 9000);
                    setPaymentReference(`ESP-${dateCode}-${rand}`);
                    if (paymentReferenceError) setPaymentReferenceError(null);
                  }}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold border border-emerald-200 transition-colors"
                >
                  + Réf Caisse Espèces
                </button>
              </div>

              {paymentReferenceError && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{paymentReferenceError}</span>
                </div>
              )}
            </div>

            {/* CASHIER CONFIRMATION ATTESTATION */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaymentConfirmedByCashier}
                  onChange={(e) => setIsPaymentConfirmedByCashier(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF]"
                />
                <span className="text-xs text-gray-800 font-medium leading-tight">
                  Je confirme en tant que caissier/opérateur (<strong>{currentUser.username}</strong>) avoir effectivement vérifié et encaissé ce montant.
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-800 font-bold uppercase tracking-wider pl-6">
                <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                <span>Statut généré : PAYÉ - TRANSACTION CONFIRMÉE</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPaymentConfirmationOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all text-center"
              >
                Modifier le Panier
              </button>
              <button
                type="button"
                onClick={handleConfirmAndFinalizePayment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                id="btn_confirm_and_finalize_payment"
              >
                <CheckCircle className="h-4 w-4" />
                <span>VALIDER & ÉMETTRE LE REÇU</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================
          RESET FINANCIALS MODAL
          ======================================================= */}
      {isResetFinancialsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" id="modal-reset-financials">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-red-200 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-red-600 text-base flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Réinitialisation Financière Sécurisée
              </h3>
              <button 
                onClick={() => {
                  setIsResetFinancialsModalOpen(false);
                  setResetConfirmationInput('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-red-900">
                  <ShieldAlert className="h-4 w-4" />
                  Attention : Action irréversible réservée au Gérant
                </p>
                <p>Cette opération efface immédiatement tout l'historique des ventes, dettes, créances et dépenses.</p>
              </div>

              <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                ✓ Le catalogue de produits, les clients et les paramètres d'entreprise restent 100% conservés.
              </p>

              {/* Requirement: Type "SUPPRIMER" to unlock */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Pour confirmer, veuillez saisir <span className="font-mono text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200">SUPPRIMER</span> ci-dessous :
                </label>
                <input
                  type="text"
                  id="input_confirm_supprimer"
                  value={resetConfirmationInput}
                  onChange={(e) => setResetConfirmationInput(e.target.value)}
                  placeholder="Tapez SUPPRIMER ici..."
                  className="w-full px-3.5 py-2.5 text-sm font-bold border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-600 tracking-wider text-red-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                id="btn_cancel_reset"
                onClick={() => {
                  setIsResetFinancialsModalOpen(false);
                  setResetConfirmationInput('');
                }}
                className="flex-1 p-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn_confirm_reset_financials"
                disabled={resetConfirmationInput.trim() !== 'SUPPRIMER'}
                onClick={handleResetFinancials}
                className={`flex-1 p-2.5 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                  resetConfirmationInput.trim() === 'SUPPRIMER'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200 cursor-pointer'
                    : 'bg-red-300 opacity-50 cursor-not-allowed shadow-none'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
                Confirmer l'effacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          DELETE PRODUCT CONFIRMATION MODAL
          ======================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" id="modal-delete-product">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-200 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-rose-600 text-base flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Supprimer le Produit
              </h3>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Confirmez-vous la suppression définitive du produit suivant ?
              </p>
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#0066FF] uppercase tracking-wider block">
                  {productToDelete.code}
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {productToDelete.name}
                </p>
                <p className="text-xs text-slate-600">
                  Stock actuel : <strong className="text-rose-700">{productToDelete.stock_quantity} pièce(s)</strong> • Prix de vente : <strong>{formatBIF(productToDelete.selling_price)}</strong>
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Ce produit sera retiré du catalogue de stock et du panier POS en cours.
              </p>
            </div>

            <div className="pt-1 flex gap-3">
              <button
                type="button"
                id="btn_cancel_delete_product"
                onClick={() => setProductToDelete(null)}
                className="flex-1 p-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn_confirm_delete_product"
                onClick={confirmDeleteProduct}
                className="flex-1 p-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          ADD EXPENSE MODAL
          ======================================================= */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" id="modal-add-expense">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Ajouter une Dépense / Charge</h3>
              <button 
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motif de la dépense *</label>
                <input
                  type="text"
                  required
                  value={newExpense.reason}
                  onChange={(e) => setNewExpense({ ...newExpense, reason: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Achat fournitures, Loyer, Carburant..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Montant (BIF) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full p-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Fournitures">Fournitures</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Salaires">Salaires</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Transport">Transport</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mode de Paiement *</label>
                <select
                  value={newExpense.payment_method}
                  onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value as Expense['payment_method'] })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Espèces">Espèces (Sortie de Caisse)</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Banque">Banque (Virement/Chèque)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="flex-1 p-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 p-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-200"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          RECEIPT MODAL (80mm Thermal Printer Compliant)
          ======================================================= */}
      {receiptData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:block print:p-0" id="modal-recu">
          <div className="bg-white w-full max-w-md rounded-2xl mx-auto p-4 md:p-6 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible" id="carte-recu">
            
            {/* Header / Actions (Hidden on Print) */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Reçu & Facture Thermique</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={imprimerFacture} 
                  className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold" 
                  title="Imprimer le Reçu 80mm"
                  id="btn_print_receipt_modal"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
                <button onClick={envoyerWhatsApp} className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-colors" title="Envoyer sur WhatsApp">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </button>
                <button onClick={fermerModale} className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition-colors" title="Fermer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="text-center mb-3">
              {companySettings?.receiptHeader && (
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-500 mb-0.5">{companySettings.receiptHeader}</p>
              )}
              <h1 className="text-lg font-black text-[#0D1B2A] tracking-tight">{companySettings?.name || 'Nom du Commerce'}</h1>
              <p className="text-[10px] text-gray-500 font-medium">{companySettings?.address || 'Bujumbura, Burundi'}</p>
              <p className="text-[10px] text-gray-500 font-medium">Tél : {companySettings?.phone || '+257 22 00 00 00'}</p>
              {companySettings?.email && (
                <p className="text-[10px] text-gray-500 font-medium">{companySettings.email}</p>
              )}
              {companySettings?.nif && (
                <p className="text-[10px] text-gray-500 font-medium mb-1">NIF : {companySettings.nif}</p>
              )}
              <div className="border-b-2 border-dashed border-gray-300 pb-2 mt-2">
                <p className="text-xs font-mono text-gray-800 font-extrabold">FACTURE N° #FLX-{String(receiptData.sale.id).padStart(4, '0')}</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {new Date(receiptData.sale.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-3 bg-gray-50 p-2.5 rounded-xl print:bg-transparent print:p-0 print:mb-2 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Informations Client</span>
              {receiptData.customer ? (
                <div>
                  <p className="font-bold text-gray-900 capitalize">{receiptData.customer.name}</p>
                  <p className="text-gray-600 text-[11px] flex items-center gap-1"><Phone className="h-3 w-3 inline" /> {receiptData.customer.phone}</p>
                </div>
              ) : (
                <p className="font-semibold text-gray-600 italic">Client Comptoir (Anonyme)</p>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs mb-3">
              <thead>
                <tr className="border-b border-gray-300 text-gray-400 text-[10px] uppercase font-bold">
                  <th className="pb-1.5 font-bold">QTE x Article</th>
                  <th className="pb-1.5 text-right font-bold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receiptData.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1.5">
                      <span className="font-extrabold text-gray-900">{item.quantity}</span><span className="text-gray-400 mx-1">x</span>{item.product_name}
                      <br/>
                      <span className="text-[10px] text-gray-500">@{formatBIF(item.unit_price)}</span>
                    </td>
                    <td className="py-1.5 text-right font-black text-gray-900">
                      {formatBIF(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total General */}
            <div className="border-t-2 border-gray-900 pt-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold uppercase tracking-wider text-xs">Total Facture :</span>
                <span className="text-lg font-black text-[#0D1B2A]">{formatBIF(receiptData.sale.total_amount)}</span>
              </div>
            </div>

            {/* PAYMENT VALIDATION & TRANSACTION CONFIRMATION BOX (Mandatory on 80mm ticket) */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 my-3 bg-gray-50/80 print:bg-white print:border-solid print:border-2 print:border-black space-y-2">
              
              {/* Payment Status Badge */}
              <div className="text-center">
                {receiptData.sale.payment_status === 'Cash' ? (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider print:border-2 print:border-black print:text-black print:bg-white">
                    <CheckCircle className="h-4 w-4 text-emerald-700 print:text-black" />
                    <span>PAYÉ - TRANSACTION CONFIRMÉE</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-black uppercase tracking-wider print:border-2 print:border-black print:text-black print:bg-white">
                    <span>CRÉDIT / DETTE ACTIVE ENREGISTRÉE</span>
                  </div>
                )}
              </div>

              {/* Payment Traceability Details */}
              <div className="text-xs space-y-1.5 font-mono text-gray-800 pt-1">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Mode de Paiement :</span>
                  <span className="font-extrabold text-gray-900">{receiptData.sale.payment_method || 'Espèces'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">N° Transaction / Réf :</span>
                  <span className="font-black text-[#0066FF] print:text-black">{receiptData.sale.payment_reference || 'N/A'}</span>
                </div>

                {receiptData.sale.payment_status === 'Dette' && (
                  <>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200">
                      <span className="text-gray-500 font-medium">Acompte perçu :</span>
                      <span className="font-bold text-emerald-700">{formatBIF(receiptData.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-900 font-bold">Solde restant dû :</span>
                      <span className="font-black text-rose-600">{formatBIF(receiptData.sale.total_amount - receiptData.amount_paid)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-200 pt-1.5 mt-1">
                  <span>Opérateur / Caisse :</span>
                  <span className="font-semibold text-gray-700">{currentUser.username} ({currentUser.role})</span>
                </div>
              </div>

            </div>

            {/* QR Code Placeholder */}
            <div className="text-center border-t border-dashed border-gray-200 pt-3 mb-4">
               <div className="inline-block p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm mb-1">
                 <QrCode className="h-12 w-12 text-gray-800 mx-auto opacity-80" />
               </div>
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{companySettings?.receiptFooterMessage || 'Merci pour votre visite !'}</p>
               <p className="text-[7.5px] text-gray-400 font-semibold tracking-wide mt-2 pt-1 border-t border-dashed border-gray-200">
                 Logiciel édité par FLODELIXA Technologies (AI • Software • Digital Solutions)
               </p>
            </div>

            {/* ACTION BUTTONS (Hidden on Print) */}
            <div className="no-print print:hidden flex gap-2 border-t border-gray-100 pt-3">
              <button 
                onClick={fermerModale}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Nouv. Vente</span>
              </button>
              <button 
                onClick={imprimerFacture}
                className="flex-1 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all flex justify-center items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer Facture</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
