import { useState, useMemo, useEffect, FormEvent, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  TrendingUp, 
  Clock, 
  Sparkles,
  ChevronRight,
  User,
  Coffee,
  Store,
  DollarSign,
  Globe,
  MessageCircle,
  Download,
  QrCode,
  FileText,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { cn, formatCurrency } from '@/src/lib/utils';
import { Product, CartItem, Transaction, View, Debt, DebtPayment, Expense, Return } from './types';
import { Language, translations } from './translations';

// Mock Initial Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', barcode: '400123000001', name: 'Кара суу чайы', price: 120, costPrice: 85, category: 'Суусундуктар', stock: 50, image: 'https://images.unsplash.com/photo-1544787210-22c66810f393?auto=format&fit=crop&q=80&w=200' },
  { id: '2', barcode: '400123000002', name: 'Таттуу нан', price: 45, costPrice: 30, category: 'Нан азыктары', stock: 30, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200' },
  { id: '3', barcode: '400123000003', name: 'Кофе Латте', price: 150, costPrice: 110, category: 'Суусундуктар', stock: 40, image: 'https://images.unsplash.com/photo-1570968015848-d9bf22498263?auto=format&fit=crop&q=80&w=200' },
  { id: '4', barcode: '400123000004', name: 'Лагман', price: 280, costPrice: 200, category: 'Тамактар', stock: 15, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=200' },
  { id: '5', barcode: '400123000005', name: 'Самсы', price: 65, costPrice: 45, category: 'Тамактар', stock: 100, image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=200' },
  { id: '6', barcode: '400123000006', name: 'Минералдык суу', price: 35, costPrice: 22, category: 'Суусундуктар', stock: 60, image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=200' },
];

const generateBarcode = () => {
  return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
};

export default function App() {
  const [language, setLanguage] = useState<Language>('ky');
  const t = translations[language];

  const [view, setView] = useState<View>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtHistory, setDebtHistory] = useState<DebtPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [shopInfo, setShopInfo] = useState({
    name: 'Заманбап Веб Касса',
    header: 'Кош келиңиз!',
    footer: 'Сатып алганыңыз үчүн рахмат! \n Кайра келиңиз!',
    pin: '1234'
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtorDueDate, setDebtorDueDate] = useState('');
  const [search, setSearch] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [reportRange, setReportRange] = useState<'day' | 'week' | 'month'>('day');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentCashier, setCurrentCashier] = useState('');
  const [cashierPin, setCashierPin] = useState('');
  const [showCashierModal, setShowCashierModal] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('other');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Focus barcode input on mount and view change
  useEffect(() => {
    if (view === 'pos') {
      barcodeInputRef.current?.focus();
    }
  }, [view]);

  // Handle outside focus to return to barcode input
  useEffect(() => {
    const handleGlobalFocus = () => {
      if (view === 'pos' && !document.activeElement?.closest('input, button, select')) {
        barcodeInputRef.current?.focus();
      }
    };
    document.addEventListener('click', handleGlobalFocus);
    return () => document.removeEventListener('click', handleGlobalFocus);
  }, [view]);

  // New Product State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    costPrice: '',
    category: 'Суусундуктар',
    stock: '',
    barcode: ''
  });

  // Handle Barcode Scan
  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcodeSearch.trim();
    if (!cleanBarcode) return;

    const product = products.find(p => p.barcode === cleanBarcode);
    if (product) {
      addToCart(product);
      setBarcodeSearch('');
    } else {
      alert(`${t.pos.notFound}: ${cleanBarcode}`);
      setBarcodeSearch('');
    }
    barcodeInputRef.current?.focus();
  };

  const handleAddProduct = (e: FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: uuidv4(),
      name: newProduct.name,
      price: Number(newProduct.price),
      costPrice: Number(newProduct.costPrice),
      category: newProduct.category,
      stock: Number(newProduct.stock),
      barcode: newProduct.barcode || generateBarcode(),
      image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=200'
    };
    setProducts(prev => [...prev, product]);
    setShowAddProduct(false);
    setNewProduct({ name: '', price: '', costPrice: '', category: 'Суусундуктар', stock: '', barcode: '' });
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(current => current.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'debt' && (!debtorName.trim() || !debtorPhone.trim() || !debtorDueDate)) {
      alert(language === 'ky' ? 'Кардардын атын, номерин жана убактысын толтуруңуз' : 'Заполните имя, телефон и дату');
      return;
    }
    
    const tid = uuidv4();
    const newTransaction: Transaction = {
      id: tid,
      items: [...cart],
      total: cartTotal,
      date: new Date().toISOString(),
      paymentMethod,
      debtorName: paymentMethod === 'debt' ? debtorName : undefined,
      cashierName: currentCashier
    };

    setTransactions(prev => [newTransaction, ...prev]);

    if (paymentMethod === 'debt') {
      setDebts(prev => {
        const existing = prev.find(d => d.debtorName.toLowerCase() === debtorName.toLowerCase());
        if (existing) {
          return prev.map(d => d.debtorName.toLowerCase() === debtorName.toLowerCase() ? {
            ...d,
            amount: d.amount + cartTotal,
            phone: debtorPhone,
            date: new Date().toISOString(),
            dueDate: debtorDueDate,
            transactions: [...d.transactions, tid]
          } : d);
        }
        return [...prev, {
          id: uuidv4(),
          debtorName,
          phone: debtorPhone,
          amount: cartTotal,
          date: new Date().toISOString(),
          dueDate: debtorDueDate,
          transactions: [tid]
        }];
      });

      setDebtHistory(prev => [{
        id: uuidv4(),
        debtorName,
        amount: cartTotal,
        date: new Date().toISOString(),
        type: 'new_debt',
        cashierName: currentCashier
      }, ...prev]);
    }
    
    // Update Stock
    setProducts(current => current.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
    }));

    setCart([]);
    setDebtorName('');
    setDebtorPhone('');
    setDebtorDueDate('');
    setPaymentMethod('cash');
    
    // Print receipt
    setTimeout(() => {
      window.print();
    }, 100);

    alert(t.cart.checkoutSuccess);
  };

  // Dashboard Stats
  const revenueData = useMemo(() => {
    const daily: Record<string, number> = {};
    transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString();
      daily[day] = (daily[day] || 0) + t.total;
    });
    return Object.entries(daily).map(([name, total]) => ({ name, total }));
  }, [transactions]);

  // AI Insights
  const getAIInsights = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          salesData: transactions.slice(0, 50),
          expenseData: expenses,
          returnsData: returns,
          productData: products.filter(p => p.stock < 10) // Only relevant low stock
        })
      });
      const data = await res.json();
      setInsight(data.text);
    } catch (err) {
      setInsight(language === 'ky' ? 'AI аналитикасын алууда ката кетти.' : language === 'ru' ? 'Ошибка при получении AI аналитики.' : 'Error getting AI insights.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleRepayDebt = (id: string, amount?: number) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        const repayAmount = amount !== undefined ? amount : d.amount;
        const newAmount = Math.max(0, d.amount - repayAmount);
        return { ...d, amount: newAmount };
      }
      return d;
    }).filter(d => d.amount > 0));

    setDebtHistory(prev => [{
      id: uuidv4(),
      debtorName: debt.debtorName,
      amount: amount !== undefined ? amount : debt.amount,
      date: new Date().toISOString(),
      type: 'payment',
      cashierName: currentCashier
    }, ...prev]);

    alert(t.debts.repaySuccess);
  };

  const exportToCSV = () => {
    const headers = [
      t.inventory.name, 
      t.inventory.barcode, 
      t.inventory.category, 
      t.inventory.cost, 
      t.inventory.price, 
      t.inventory.stock
    ];
    
    const rows = products.map(p => [
      p.name,
      p.barcode,
      p.category,
      p.costPrice.toString(),
      p.price.toString(),
      p.stock.toString()
    ]);
    
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle QR Scan Result
  const handleQrSuccess = (decodedText: string) => {
    const product = products.find(p => p.barcode === decodedText);
    if (product) {
      addToCart(product);
      setQrModalOpen(false);
    } else {
      alert(`${t.pos.notFound}: ${decodedText}`);
    }
  };

  useEffect(() => {
    if (qrModalOpen) {
      const scanner = new Html5Qrcode("qr-reader");
      qrScannerRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleQrSuccess,
        () => {}
      ).catch(err => {
        console.error("QR Scanner start error:", err);
      });
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().then(() => {
          qrScannerRef.current = null;
        }).catch(err => console.error("QR Scanner stop error:", err));
      }
    }
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, [qrModalOpen]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleReturnItem = (transaction: Transaction, item: CartItem, returnQty: number) => {
    if (returnQty <= 0 || returnQty > item.quantity) return;

    // 1. Add to returns list
    const returnAmount = item.price * returnQty;
    setReturns(prev => [{
      id: uuidv4(),
      transactionId: transaction.id,
      itemName: item.name,
      quantity: returnQty,
      amount: returnAmount,
      date: new Date().toISOString(),
      cashierName: currentCashier
    }, ...prev]);

    // 2. Update stock
    setProducts(prev => prev.map(p => 
      p.id === item.id ? { ...p, stock: p.stock + returnQty } : p
    ));
    
    alert(t.settings.success);
    setSelectedTransaction(null);
  };

  const filteredStats = useMemo(() => {
    const now = new Date();
    const isWithinRange = (dateStr: string) => {
      const date = new Date(dateStr);
      if (reportRange === 'day') {
        return date.toDateString() === now.toDateString();
      } else if (reportRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      } else {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return date >= monthAgo;
      }
    };

    const periodTransactions = transactions.filter(tr => isWithinRange(tr.date));
    const periodDebts = debtHistory.filter(h => isWithinRange(h.date));
    const periodExpenses = expenses.filter(e => isWithinRange(e.date));
    const periodReturns = returns.filter(r => isWithinRange(r.date));

    // Cashier Sales
    const cashierStats: Record<string, number> = {};
    periodTransactions.forEach(tr => {
      cashierStats[tr.cashierName] = (cashierStats[tr.cashierName] || 0) + tr.total;
    });
    const cashierRank = Object.entries(cashierStats).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total);

    // Best Sellers
    const productSales: Record<string, { qty: number; total: number; name: string }> = {};
    periodTransactions.forEach(tr => {
      tr.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { qty: 0, total: 0, name: item.name };
        }
        productSales[item.id].qty += item.quantity;
        productSales[item.id].total += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 10);

    // Slow Moving
    const lastSold: Record<string, string> = {};
    transactions.forEach(tr => {
      tr.items.forEach(item => {
        if (!lastSold[item.id] || new Date(tr.date) > new Date(lastSold[item.id])) {
          lastSold[item.id] = tr.date;
        }
      });
    });
    const slowProducts = products
      .filter(p => p.stock > 0)
      .map(p => ({
        ...p,
        lastSoldDate: lastSold[p.id] || null,
        daysSinceSold: lastSold[p.id] ? Math.floor((now.getTime() - new Date(lastSold[p.id]).getTime()) / (1000 * 3600 * 24)) : 999
      }))
      .sort((a, b) => b.daysSinceSold - a.daysSinceSold)
      .slice(0, 10);

    return {
      transactions: periodTransactions,
      debtHistory: periodDebts,
      expenses: periodExpenses,
      returns: periodReturns,
      topProducts,
      slowProducts,
      cashierRank
    };
  }, [transactions, debtHistory, expenses, returns, reportRange, products, currentCashier]);

  return (
    <div className="h-screen bg-[#F3F4F6] flex overflow-hidden font-sans text-slate-900 print:bg-white print:block">
      {/* Mini Sidebar */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-6 shrink-0 z-20 print:hidden">
        <div className="bg-indigo-600 p-2.5 rounded-xl text-white mb-8 shadow-lg shadow-indigo-600/20">
          <Store size={22} />
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <button 
            onClick={() => setView('pos')}
            title={t.sidebar.pos}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'pos' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <ShoppingCart size={22} />
          </button>
          <button 
            onClick={() => setView('dashboard')}
            title={t.sidebar.analytics}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'dashboard' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <LayoutDashboard size={22} />
          </button>
          <button 
            onClick={() => setView('inventory')}
            title={t.sidebar.inventory}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'inventory' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Package size={22} />
          </button>
          <button 
            onClick={() => setView('debts')}
            title={t.sidebar.debts}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'debts' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <User size={22} />
          </button>
          <button 
            onClick={() => setView('reports')}
            title={t.reports.title}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'reports' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <FileText size={22} />
          </button>
          <button 
            onClick={() => setView('settings')}
            title={t.settings.title}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'settings' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Settings size={22} />
          </button>
        </nav>
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
          АК
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tight text-slate-800">Aqilli Kassa <span className="text-indigo-600 font-medium">v2.0</span></h1>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <span className="text-xs font-bold text-green-500 flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t.header.shiftOpen}
            </span>
          </div>

          <div className="flex-1 max-w-md mx-8 flex items-center gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder={t.header.search}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {view === 'pos' && (
              <form onSubmit={handleBarcodeSubmit} className="relative group w-48">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                </div>
                <input 
                  type="text" 
                  placeholder={t.pos.scanBarcode}
                  ref={barcodeInputRef}
                  autoFocus
                  className="w-full bg-indigo-50 border border-indigo-100 rounded-lg py-2 pl-10 pr-12 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none text-xs font-bold transition-all"
                  value={barcodeSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBarcodeSearch(val);
                    // Instant match for common barcode lengths
                    if (val.length >= 8) {
                      const product = products.find(p => p.barcode === val);
                      if (product) {
                        addToCart(product);
                        setBarcodeSearch('');
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-all"
                  title={t.pos.scanQr}
                >
                  <QrCode size={16} />
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              {(['ky', 'ru', 'en'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase transition-all",
                    language === lang ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700">{currentCashier || t.header.cashier}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">{t.header.terminal}: 041</span>
            </div>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'pos' && (
              <motion.div 
                key="pos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex h-full overflow-hidden"
              >
                {/* Product Area */}
                <div className="flex-1 flex flex-col h-full bg-slate-50">
                  {/* Category Bar */}
                  <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
                    {[
                      t.pos.all, 
                      t.pos.beverages, 
                      t.pos.food, 
                      t.pos.bakery, 
                      t.pos.sweets
                    ].map((cat, idx) => (
                      <button 
                        key={cat}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredProducts.map(product => (
                        <motion.button
                          key={product.id}
                          whileHover={{ y: -4, shadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className={cn(
                            "bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all text-left flex flex-col group",
                            product.stock <= 0 && "opacity-50 grayscale"
                          )}
                        >
                          <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-slate-50 relative">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {product.stock <= 0 && (
                              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">{t.pos.noStock}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-indigo-500 mb-1 uppercase tracking-tight">{product.category}</p>
                            <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 h-10">{product.name}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-black text-indigo-600 text-base">{formatCurrency(product.price)}</span>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              product.stock < 10 ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-700"
                            )}>
                              {product.stock} {t.pos.units}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Dark Status Bar */}
                  <div className="h-10 bg-slate-900 text-slate-400 px-6 flex items-center justify-between shrink-0 text-[10px] uppercase tracking-wider font-bold">
                    <div className="flex gap-6">
                      <span className="text-slate-300">{t.footer.dailySales}: {formatCurrency(transactions.reduce((s,t) => s+t.total, 0))}</span>
                      <span>{t.footer.receiptsCount}: {transactions.length}</span>
                    </div>
                    <div>{t.footer.systemStatus}</div>
                  </div>
                </div>

                {/* Fixed Cart Side Panel */}
                <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                       {t.cart.title}
                       <span className="bg-indigo-100 text-indigo-700 text-[10px] py-0.5 px-2 rounded-full">{cart.reduce((a,b) => a+b.quantity, 0)}</span>
                    </h2>
                    <button onClick={() => setCart([])} className="text-red-500 text-xs font-bold hover:underline py-1 px-2 rounded-lg hover:bg-red-50 transition-colors">
                      {t.cart.clear}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50 px-12 text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <ShoppingCart size={32} />
                        </div>
                        <p className="text-sm font-medium">{t.cart.empty}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {cart.map((item, idx) => (
                          <div key={item.id} className="p-4 flex gap-3 items-start animate-in slide-in-from-right duration-200">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center font-black text-slate-400 text-xs">{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-indigo-600"><Minus size={12} /></button>
                                  <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-indigo-600"><Plus size={12} /></button>
                                </div>
                                <p className="text-sm font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{t.cart.subtotal}:</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{t.cart.discount}:</span>
                        <span className="text-red-500">-0,00 сом</span>
                      </div>
                      <div className="flex justify-between items-end pt-2">
                        <span className="text-sm font-black text-slate-800">{t.cart.total}:</span>
                        <span className="text-3xl font-black text-indigo-600 leading-none">{formatCurrency(cartTotal)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button 
                          onClick={() => setPaymentMethod('cash')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all",
                            paymentMethod === 'cash' ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-600"
                          )}
                        >
                          <DollarSign size={18} className={cn("mb-1", paymentMethod === 'cash' ? "text-indigo-600" : "text-slate-400")} />
                          <span className="text-[10px] font-black uppercase">{t.cart.cash}</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('card')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all",
                            paymentMethod === 'card' ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-600"
                          )}
                        >
                          <div className={cn("mb-1", paymentMethod === 'card' ? "text-indigo-600" : "text-indigo-600")}>
                            <Store size={18} />
                          </div>
                          <span className="text-[10px] font-black uppercase">{t.cart.card}</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('debt')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all",
                            paymentMethod === 'debt' ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-600"
                          )}
                        >
                          <Clock size={18} className={cn("mb-1", paymentMethod === 'debt' ? "text-indigo-600" : "text-slate-400")} />
                          <span className="text-[10px] font-black uppercase">{t.cart.debt}</span>
                        </button>
                    </div>

                    {paymentMethod === 'debt' && (
                      <div className="mb-4 space-y-2 animate-in slide-in-from-top duration-200">
                        <input 
                          type="text" 
                          placeholder={t.debts.debtorName}
                          className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={debtorName}
                          onChange={(e) => setDebtorName(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder={t.debts.phone + " (996...)"}
                          className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={debtorPhone}
                          onChange={(e) => setDebtorPhone(e.target.value)}
                        />
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400 pl-1">{t.debts.dueDate}</label>
                          <input 
                            type="date" 
                            className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={debtorDueDate}
                            onChange={(e) => setDebtorDueDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl text-lg font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all uppercase tracking-widest"
                    >
                      {t.cart.pay}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black text-slate-800">{t.dashboard.title}</h2>
                   <button 
                    onClick={getAIInsights}
                    disabled={loadingInsight || transactions.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {loadingInsight ? t.dashboard.aiAnalyzing : t.dashboard.aiButton}
                  </button>
                </div>

                {insight && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 text-indigo-300 p-6 rounded-2xl border-l-4 border-indigo-500 shadow-xl flex gap-4 items-start"
                  >
                    <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0">
                      <Sparkles size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">{t.dashboard.aiHint}</p>
                      <p className="text-sm font-medium leading-relaxed italic whitespace-pre-line">{insight}</p>
                    </div>
                    <button onClick={() => setInsight(null)} className="ml-auto text-indigo-500 hover:text-white transition-colors">
                      <Minus size={16} />
                    </button>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.dashboard.dailyRevenue}</p>
                    <p className="text-3xl font-black text-slate-900">{formatCurrency(transactions.reduce((s,t) => s+t.total, 0))}</p>
                    <div className="absolute -right-4 -bottom-4 bg-indigo-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.dashboard.netProfit}</p>
                    <p className="text-3xl font-black text-green-600">
                      {formatCurrency(transactions.reduce((sum, t) => {
                        return sum + t.items.reduce((itemSum, item) => {
                          const p = products.find(prod => prod.id === item.id);
                          const cost = p ? p.costPrice : item.price * 0.7; // Fallback if product deleted
                          return itemSum + (item.price - cost) * item.quantity;
                        }, 0);
                      }, 0))}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.dashboard.avgCheck}</p>
                    <p className="text-3xl font-black text-slate-900">
                       {formatCurrency(transactions.length ? transactions.reduce((a,b)=>a+b.total,0)/transactions.length : 0)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.dashboard.salesCount}</p>
                    <p className="text-3xl font-black text-slate-900">{transactions.length}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grow min-h-[400px]">
                   <h3 className="font-bold text-slate-800 mb-6">{t.dashboard.chartTitle}</h3>
                   <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="total" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </motion.div>
            )}

            {view === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-hidden p-8 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black">{t.inventory.title}</h2>
                    <p className="text-sm text-slate-500 font-medium">{t.inventory.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Download size={20} className="text-indigo-600" />
                      {t.inventory.exportCsv}
                    </button>
                    <button 
                      onClick={() => setShowAddProduct(!showAddProduct)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Plus size={20} />
                      {t.inventory.addBtn}
                    </button>
                  </div>
                </div>

                {showAddProduct && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    onSubmit={handleAddProduct}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden"
                  >
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.name} *</label>
                        <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Мисалы: Алма" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.cost} (сом) *</label>
                        <input required type="number" value={newProduct.costPrice} onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.price} (сом) *</label>
                        <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.category}</label>
                        <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="Суусундуктар">{t.pos.beverages}</option>
                          <option value="Тамактар">{t.pos.food}</option>
                          <option value="Нан азыктары">{t.pos.bakery}</option>
                          <option value="Таттуулар">{t.pos.sweets}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.stock} *</label>
                        <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">{t.inventory.barcode}</label>
                        <input value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder={t.inventory.generateBarcodeHint} />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full bg-slate-900 text-white rounded-lg p-3 font-bold hover:bg-slate-800 transition-colors uppercase tracking-widest text-xs">
                          {t.inventory.formTitle}
                        </button>
                    </div>
                  </motion.form>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.name}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.barcode}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.category}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.cost}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.price}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-center">{t.inventory.stock}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.inventory.status}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">{t.inventory.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[...products].reverse().map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={p.image} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                <span className="font-bold text-sm text-slate-800">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{p.barcode}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{p.category}</td>
                            <td className="px-6 py-4 font-bold text-slate-500 text-sm">{formatCurrency(p.costPrice)}</td>
                            <td className="px-6 py-4 font-black text-sm text-indigo-600">{formatCurrency(p.price)}</td>
                            <td className="px-6 py-4 text-center font-bold text-sm">{p.stock}</td>
                            <td className="px-6 py-4">
                              <div className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                                p.stock > 10 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                              )}>
                                {p.stock > 10 ? t.inventory.sufficient : t.inventory.lowStock}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => {
                                  if (confirm(`"${p.name}" ${t.inventory.deleteConfirm}`)) {
                                    setProducts(prev => prev.filter(prod => prod.id !== p.id));
                                  }
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'debts' && (
              <motion.div 
                key="debts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-hidden p-8 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black">{t.debts.title}</h2>
                    <p className="text-sm text-slate-500 font-medium">{t.debts.subtitle}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  {debts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-4">
                       <User size={48} className="opacity-20" />
                       <p className="font-bold">{t.debts.noDebts}</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.debts.debtorName}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.debts.phone}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.debts.totalDebt}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{t.debts.dueDate}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-right">{t.debts.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...debts].sort((a,b) => b.amount - a.amount).map(d => {
                            const isOverdue = new Date(d.dueDate) < new Date();
                            const isToday = new Date(d.dueDate).toDateString() === new Date().toDateString();
                            
                            return (
                              <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{d.debtorName}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(d.date).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-600">{d.phone}</td>
                                <td className="px-6 py-4 font-black text-red-600 text-lg">{formatCurrency(d.amount)}</td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "text-xs font-bold",
                                    isOverdue ? "text-red-500" : isToday ? "text-orange-500" : "text-slate-500"
                                  )}>
                                    {new Date(d.dueDate).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                  <a 
                                    href={`https://wa.me/${d.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t.debts.reminderText + formatCurrency(d.amount))}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                    title={t.debts.sendReminder}
                                  >
                                    <MessageCircle size={18} />
                                  </a>
                                  <button 
                                    onClick={() => {
                                      setSelectedDebtId(d.id);
                                      setPartialAmount('');
                                      setPartialModalOpen(true);
                                    }}
                                    className="text-indigo-600 px-3 py-2 rounded-lg text-xs font-black hover:bg-indigo-50 transition-all"
                                  >
                                    {t.debts.payPartial}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (confirm(t.debts.payFull + '?')) {
                                        handleRepayDebt(d.id);
                                      }
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-green-700 transition-all shadow-md shadow-green-600/20"
                                  >
                                    {t.debts.payFull}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Debt History Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[300px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.debts.historyTitle}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.debts.debtorName}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.debts.type}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.inventory.price}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.debts.time}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {debtHistory.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3 font-bold text-slate-700 text-sm">{h.debtorName}</td>
                            <td className="px-6 py-3">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                                h.type === 'payment' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {h.type === 'payment' ? t.debts.payment : t.debts.newDebt}
                              </span>
                            </td>
                            <td className={cn(
                              "px-6 py-3 font-black text-sm",
                              h.type === 'payment' ? "text-green-600" : "text-red-600"
                            )}>
                              {h.type === 'payment' ? '+' : '-'}{formatCurrency(h.amount)}
                            </td>
                            <td className="px-6 py-3 text-right text-[10px] font-bold text-slate-400">
                              {new Date(h.date).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 overflow-y-auto p-8 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black">{t.reports.title}</h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                      {(['day', 'week', 'month'] as const).map(range => (
                        <button
                          key={range}
                          onClick={() => setReportRange(range)}
                          className={cn(
                            "px-4 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                            reportRange === range ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {t.reports[range === 'day' ? 'daily' : range === 'week' ? 'weekly' : 'monthly']}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={getAIInsights}
                      disabled={loadingInsight || transactions.length === 0}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl h-10 font-bold text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      {loadingInsight ? t.dashboard.aiAnalyzing : t.dashboard.aiButton}
                    </button>
                    <button 
                      onClick={() => {
                        const amount = Number(prompt(t.reports.amount));
                        if (amount) {
                          setReturns(prev => [{ id: uuidv4(), transactionId: 'MANUAL', amount, date: new Date().toISOString() }, ...prev]);
                        }
                      }}
                      className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-orange-100 transition-all border border-orange-100"
                    >
                      + {t.reports.addReturn}
                    </button>
                    <button 
                      onClick={() => setExpenseModalOpen(true)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-all border border-red-100"
                    >
                      + {t.reports.addExpense}
                    </button>
                  </div>
                </div>

                {insight && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 text-indigo-300 p-6 rounded-2xl border-l-4 border-indigo-500 shadow-xl flex gap-4 items-start"
                  >
                    <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0">
                      <Sparkles size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">{t.dashboard.aiHint}</p>
                      <p className="text-sm font-medium leading-relaxed italic whitespace-pre-line">{insight}</p>
                    </div>
                    <button onClick={() => setInsight(null)} className="ml-auto text-indigo-500 hover:text-white transition-colors">
                      <Minus size={16} />
                    </button>
                  </motion.div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { 
                      label: t.reports.dailySales, 
                      value: filteredStats.transactions.reduce((sum, tr) => sum + tr.total, 0),
                      color: "text-slate-800"
                    },
                    { 
                      label: t.reports.issuedDebts, 
                      value: filteredStats.debtHistory.filter(h => h.type === 'new_debt').reduce((sum, h) => sum + h.amount, 0),
                      color: "text-red-600"
                    },
                    { 
                      label: t.reports.totalRevenue, 
                      value: filteredStats.transactions.filter(tr => tr.paymentMethod !== 'debt').reduce((sum, tr) => sum + tr.total, 0) + 
                             filteredStats.debtHistory.filter(h => h.type === 'payment').reduce((sum, h) => sum + h.amount, 0) -
                             filteredStats.returns.reduce((sum, r) => sum + r.amount, 0),
                      color: "text-green-600"
                    },
                    { 
                      label: t.reports.returns, 
                      value: filteredStats.returns.reduce((sum, r) => sum + r.amount, 0),
                      color: "text-orange-600"
                    },
                    { 
                      label: t.reports.expenses, 
                      value: filteredStats.expenses.reduce((sum, e) => sum + e.amount, 0),
                      color: "text-red-500"
                    },
                    { 
                      label: t.reports.netProfit, 
                      value: (filteredStats.transactions.reduce((sum, tr) => {
                        const cogs = tr.items.reduce((s, item) => s + (item.costPrice * item.quantity), 0);
                        return sum + (tr.total - cogs);
                      }, 0)) - filteredStats.expenses.reduce((sum, e) => sum + e.amount, 0) - filteredStats.returns.reduce((sum, r) => sum + r.amount, 0),
                      color: "text-indigo-600"
                    }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{stat.label}</p>
                      <p className={cn("text-2xl font-black", stat.color)}>{formatCurrency(stat.value)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Selling Products */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.topProducts}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.inventory.name}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.qty}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.cart.total}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStats.topProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-700 text-sm truncate max-w-[120px]">{p.name}</td>
                              <td className="px-6 py-3 text-xs font-black text-slate-900">{p.qty}</td>
                              <td className="px-6 py-3 text-right font-black text-indigo-600">{formatCurrency(p.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cashier Sales */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.cashierSales}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.cashier}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.cart.total}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStats.cashierRank.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-700 text-sm">{c.name || 'N/A'}</td>
                              <td className="px-6 py-3 text-right font-black text-green-600">{formatCurrency(c.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Slow Moving Products */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.slowMoving}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.inventory.name}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.stock}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.reports.lastSale}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStats.slowProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-700 text-sm truncate max-w-[120px]">{p.name}</td>
                              <td className="px-6 py-3 text-xs font-black text-slate-900">{p.stock}</td>
                              <td className="px-6 py-3 text-right text-[10px] font-bold text-slate-400">
                                {p.lastSoldDate ? new Date(p.lastSoldDate).toLocaleDateString() : (language === 'ky' ? 'Сатылган эмес' : 'Нет продаж')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Category Breakdown List */}
                  <div className="lg:col-span-1 space-y-4">
                    {(['rent', 'electricity', 'stock', 'utility', 'other'] as const).map(cat => {
                      const amount = filteredStats.expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                      const totalExpenses = filteredStats.expenses.reduce((sum, e) => sum + e.amount, 0);
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                      
                      return (
                        <div key={cat} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                             <span>{t.reports.categories[cat]}</span>
                             <span className="text-slate-800">{formatCurrency(amount)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={cn(
                                  "h-full rounded-full",
                                  cat === 'rent' ? "bg-amber-500" :
                                  cat === 'electricity' ? "bg-yellow-400" :
                                  cat === 'stock' ? "bg-indigo-500" :
                                  cat === 'utility' ? "bg-cyan-500" : "bg-slate-400"
                                )}
                             />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Profitability Visualization or Chart Placeholder */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
                    {filteredStats.expenses.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                           <PieChart>
                              <Pie
                                data={(['rent', 'electricity', 'stock', 'utility', 'other'] as const).map(cat => ({
                                  name: t.reports.categories[cat],
                                  value: filteredStats.expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
                                })).filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {(['rent', 'electricity', 'stock', 'utility', 'other'] as const).map((cat, index) => (
                                  <Cell 
                                    key={index} 
                                    fill={
                                      cat === 'rent' ? "#f59e0b" :
                                      cat === 'electricity' ? "#facc15" :
                                      cat === 'stock' ? "#6366f1" :
                                      cat === 'utility' ? "#06b6d4" : "#94a3b8"
                                    } 
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center gap-2">
                         <FileText size={48} className="opacity-20" />
                         <p className="font-bold uppercase tracking-widest text-[10px]">{t.reports.expenses} {language === 'ky' ? 'жок' : language === 'ru' ? 'нет' : 'none'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales History */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.salesHistory}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.debts.time}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.pos.terminal}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.cart.total}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStats.transactions.map((tr, i) => (
                            <tr 
                              key={tr.id} 
                              onClick={() => setSelectedTransaction(tr)}
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-3">
                                <div className="text-sm font-bold text-slate-700">{new Date(tr.date).toLocaleTimeString()}</div>
                                <div className="text-[10px] text-slate-400">{new Date(tr.date).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-black uppercase",
                                  tr.paymentMethod === 'cash' ? "bg-green-50 text-green-600" :
                                  tr.paymentMethod === 'card' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                                )}>
                                  {t.cart[tr.paymentMethod]}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right font-black text-slate-900">{formatCurrency(tr.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.returns}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.inventory.name}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.qty}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.amount}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{t.debts.time}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStats.returns.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold">Кайтаруулар жок</td></tr>
                          ) : (
                            filteredStats.returns.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 font-bold text-slate-700 text-sm">{r.itemName || (r.transactionId === 'MANUAL' ? 'Manual Return' : 'Transaction Return')}</td>
                                <td className="px-6 py-3 text-xs font-black text-slate-900">{r.quantity ? `x${r.quantity}` : '-'}</td>
                                <td className="px-6 py-3 font-black text-orange-600">{formatCurrency(r.amount)}</td>
                                <td className="px-6 py-3 text-right text-[10px] font-bold text-slate-400">
                                  {new Date(r.date).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">{t.reports.expenses}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.inventory.name}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.category}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500">{t.reports.amount}</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 text-right">{language === 'ky' ? 'Убактысы' : language === 'ru' ? 'Время' : 'Time'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStats.expenses.length === 0 ? (
                          <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold">Чыгымдар жок</td></tr>
                        ) : (
                          filteredStats.expenses.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-700">{e.title}</td>
                              <td className="px-6 py-3 text-xs font-bold text-slate-500">
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  {t.reports.categories[e.category]}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-black text-red-600">{formatCurrency(e.amount)}</td>
                              <td className="px-6 py-3 text-right text-[10px] font-bold text-slate-400">
                                {new Date(e.date).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
            )}

            {view === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 overflow-hidden p-8 flex flex-col items-center justify-center"
              >
                <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-2xl font-black text-slate-800">{t.settings.title}</h2>
                    <p className="text-sm text-slate-500 font-medium">{t.settings.subtitle}</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.settings.shopName}</label>
                       <input 
                         type="text"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                         value={shopInfo.name}
                         onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.settings.receiptHeader}</label>
                       <textarea 
                         rows={2}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                         value={shopInfo.header}
                         onChange={(e) => setShopInfo({ ...shopInfo, header: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.settings.receiptFooter}</label>
                       <textarea 
                         rows={3}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                         value={shopInfo.footer}
                         onChange={(e) => setShopInfo({ ...shopInfo, footer: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.reports.enterPin}</label>
                       <input 
                         type="text"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                         value={shopInfo.pin}
                         onChange={(e) => setShopInfo({ ...shopInfo, pin: e.target.value })}
                       />
                    </div>
                    <button 
                      onClick={() => {
                        alert(t.settings.success);
                        setView('pos');
                      }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-widest"
                    >
                      {t.settings.saveBtn}
                    </button>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Online & Ready</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Partial Payment Modal */}
          <AnimatePresence>
            {partialModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-black">{t.debts.confirmPayment}</h3>
                    <button onClick={() => setPartialModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus size={20} className="rotate-45" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{t.debts.debtorName}</p>
                      <p className="font-bold text-slate-800">{debts.find(d => d.id === selectedDebtId)?.debtorName}</p>
                      <div className="mt-3 flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t.debts.totalDebt}</p>
                            <p className="text-xl font-black text-red-600">{formatCurrency(debts.find(d => d.id === selectedDebtId)?.amount || 0)}</p>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">{t.debts.enterAmount} (сом)</label>
                      <input 
                        type="number" 
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const amount = Number(partialAmount);
                            if (amount > 0 && selectedDebtId) {
                               handleRepayDebt(selectedDebtId, amount);
                               setPartialModalOpen(false);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 flex gap-3">
                    <button 
                      onClick={() => setPartialModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                    >
                      {t.debts.cancel}
                    </button>
                    <button 
                      onClick={() => {
                        const amount = Number(partialAmount);
                        if (amount > 0 && selectedDebtId) {
                           handleRepayDebt(selectedDebtId, amount);
                           setPartialModalOpen(false);
                           setPartialAmount('');
                        }
                      }}
                      className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
                    >
                      {t.debts.payPartial}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Transaction Detail Modal */}
          <AnimatePresence>
            {selectedTransaction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                       <h3 className="text-xl font-black">{t.reports.transactionDetail}</h3>
                       <p className="text-xs text-slate-400 font-bold">{new Date(selectedTransaction.date).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                      <Plus size={24} className="rotate-45" />
                    </button>
                  </div>
                  <div className="p-8 overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-left">
                      <thead className="border-b border-slate-100">
                        <tr>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400">{t.inventory.name}</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 text-center">{t.reports.qty}</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 text-right">{t.cart.total}</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 text-right">{t.inventory.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedTransaction.items.map((item, idx) => (
                          <tr key={idx} className="group">
                            <td className="py-4">
                               <div className="font-bold text-slate-700">{item.name}</div>
                               <div className="text-[10px] text-slate-400">{formatCurrency(item.price)}</div>
                            </td>
                            <td className="py-4 text-center font-black text-slate-900">x{item.quantity}</td>
                            <td className="py-4 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                            <td className="py-4 text-right">
                               <button 
                                 onClick={() => {
                                   const qty = Number(prompt(t.reports.qty, '1'));
                                   if (qty > 0) handleReturnItem(selectedTransaction, item, qty);
                                 }}
                                 className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 bg-orange-50 px-2 py-1 rounded transition-all"
                               >
                                 {t.reports.returnItem}
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">{t.cart.total}</span>
                        <span className="text-2xl font-black text-indigo-600">{formatCurrency(selectedTransaction.total)}</span>
                     </div>
                     <span className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest",
                        selectedTransaction.paymentMethod === 'cash' ? "bg-green-100 text-green-700" :
                        selectedTransaction.paymentMethod === 'card' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      )}>
                        {t.cart[selectedTransaction.paymentMethod]}
                      </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Expense Modal */}
          <AnimatePresence>
            {expenseModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-black">{t.reports.addExpense}</h3>
                    <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                      <Plus size={24} className="rotate-45" />
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.reports.expenseTitle}</label>
                      <input 
                        type="text" 
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.reports.amount} (сом)</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-2xl font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t.reports.category}</label>
                       <div className="grid grid-cols-2 gap-2">
                          {(['rent', 'electricity', 'stock', 'utility', 'other'] as const).map(cat => (
                            <button
                              key={cat}
                              onClick={() => setExpenseCategory(cat)}
                              className={cn(
                                "py-3 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all",
                                expenseCategory === cat 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                            >
                              {t.reports.categories[cat]}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => setExpenseModalOpen(false)}
                      className="flex-1 py-4 rounded-xl font-black text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                    >
                      {t.debts.cancel}
                    </button>
                    <button 
                      onClick={() => {
                        const amount = Number(expenseAmount);
                        if (expenseTitle && amount > 0) {
                          setExpenses(prev => [{ 
                            id: uuidv4(), 
                            title: expenseTitle, 
                            amount, 
                            category: expenseCategory,
                            date: new Date().toISOString() 
                          }, ...prev]);
                          setExpenseModalOpen(false);
                          setExpenseTitle('');
                          setExpenseAmount('');
                          setExpenseCategory('other');
                        }
                      }}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
                    >
                      {t.settings.saveBtn}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {qrModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-black">{t.pos.scanQr}</h3>
                    <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-all">
                      <Plus size={24} className="rotate-45" />
                    </button>
                  </div>
                  <div className="p-8">
                    <div id="qr-reader" className="w-full aspect-square rounded-2xl overflow-hidden border-4 border-indigo-600/30 bg-slate-900 shadow-inner"></div>
                    <p className="text-center text-sm font-bold text-slate-400 mt-6 animate-pulse uppercase tracking-widest">{t.pos.scanQr}...</p>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={() => setQrModalOpen(false)}
                      className="w-full py-4 rounded-xl font-black text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                    >
                      {t.debts.cancel}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Printable Receipt (Customizable via Settings) */}
          <div id="printable-receipt" className="hidden print:block p-8 text-black font-mono text-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold uppercase">{shopInfo.name}</h2>
              <p className="whitespace-pre-line">{shopInfo.header}</p>
              <p className="text-xs">{new Date().toLocaleString()}</p>
            </div>
            <div className="border-b-2 border-black border-dashed my-4"></div>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1 uppercase">{t.inventory.name}</th>
                  <th className="text-center py-1">QTY</th>
                  <th className="text-right py-1 uppercase">{t.inventory.price}</th>
                </tr>
              </thead>
              <tbody>
                {transactions[0]?.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-1">{item.name}</td>
                    <td className="text-center py-1">x{item.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-b-2 border-black border-dashed my-4"></div>
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>{t.cart.total}:</span>
              <span>{formatCurrency(transactions[0]?.total || 0)}</span>
            </div>
            <div className="text-center mt-8 pt-4 border-t border-black">
              <p className="text-[10px] uppercase font-bold mb-2">{t.reports.cashier}: {currentCashier}</p>
              <p className="whitespace-pre-line font-bold">{shopInfo.footer}</p>
            </div>
          </div>

          {/* Cashier Shift Modal */}
          <AnimatePresence>
            {showCashierModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center"
                >
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-600/30">
                    <User size={40} />
                  </div>
                  <h3 className="text-2xl font-black mb-2">{t.reports.startShift}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-8 uppercase tracking-widest">{t.reports.enterCashier}</p>
                  
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder={t.reports.cashier}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-lg font-black focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none text-center transition-all"
                      value={currentCashier}
                      onChange={(e) => setCurrentCashier(e.target.value)}
                    />

                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder={t.reports.enterPin}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-2xl font-black focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none text-center transition-all tracking-[1em]"
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && currentCashier.trim() && cashierPin === shopInfo.pin) {
                          setShowCashierModal(false);
                          setCashierPin('');
                        } else if (e.key === 'Enter' && cashierPin !== shopInfo.pin) {
                          alert(t.reports.invalidPin);
                        }
                      }}
                    />
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (currentCashier.trim() && cashierPin === shopInfo.pin) {
                        setShowCashierModal(false);
                        setCashierPin('');
                      } else {
                        alert(t.reports.invalidPin);
                      }
                    }}
                    disabled={!currentCashier.trim() || cashierPin.length < 4}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest mt-8"
                  >
                    {t.reports.startShift}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

