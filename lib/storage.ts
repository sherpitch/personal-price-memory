// lib/storage.ts

const STORAGE_VERSION = 'v1_';
const KEYS = {
  PRODUCTS: STORAGE_VERSION + 'products',
  PRICES: STORAGE_VERSION + 'prices',
  RECEIPTS: STORAGE_VERSION + 'receipts',
  PRICE_TAGS: STORAGE_VERSION + 'price_tags',
  TRANSACTIONS: STORAGE_VERSION + 'transactions',
  FLOWER_INCOME: STORAGE_VERSION + 'flower_income',
  SETTINGS: STORAGE_VERSION + 'settings',
};

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  currency: 'USD' | 'CHF' | 'THB';
  source_type: 'manual' | 'flower_income' | 'receipt';
  source_id?: string;
  note?: string;
  created_at: string;
}

export interface Settings {
  language: 'th' | 'en';
  defaultCurrency: 'USD' | 'CHF' | 'THB';
  usdToThb: number;
  usdToChf: number;
  googleSheetUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  language: 'th',
  defaultCurrency: 'USD',
  usdToThb: 33,
  usdToChf: 2300,
  googleSheetUrl: '',
};

export const storage = {
  getSettings(): Settings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error reading settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getTransactions(): Transaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading transactions', e);
      return [];
    }
  },

  saveTransactions(transactions: Transaction[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now() + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    return newTx;
  },

  deleteTransaction(id: string) {
    const transactions = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(transactions);
  },

  updateTransaction(updatedTx: Transaction) {
    let transactions = this.getTransactions();
    transactions = transactions.map(t => (t.id === updatedTx.id ? updatedTx : t));
    this.saveTransactions(transactions);
  }
};