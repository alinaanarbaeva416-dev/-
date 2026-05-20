export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number; // percentage, e.g., 5, 10, 15
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'debt';
  debtorName?: string;
  cashierName: string;
  taxAmount?: number;
  taxRate?: number;
}

export interface Debt {
  id: string;
  debtorName: string;
  phone: string;
  amount: number;
  date: string;
  dueDate: string;
  transactions: string[]; // Transaction IDs
}

export interface DebtPayment {
  id: string;
  debtorName: string;
  amount: number;
  date: string;
  type: 'payment' | 'new_debt';
  cashierName: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'rent' | 'electricity' | 'stock' | 'utility' | 'other';
  amount: number;
  date: string;
  cashierName?: string;
}

export interface Return {
  id: string;
  transactionId: string;
  itemName?: string;
  quantity?: number;
  amount: number;
  date: string;
  cashierName: string;
}

export type View = 'pos' | 'dashboard' | 'inventory' | 'debts' | 'reports' | 'settings';

export interface ProductMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'incoming' | 'outgoing' | 'sale' | 'return' | 'adjust';
  quantity: number; // positive for intake/restock, negative for sale/disposal
  prevStock: number;
  newStock: number;
  cashierName: string;
  notes?: string;
}

