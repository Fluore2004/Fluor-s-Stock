/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  username: string;
  role: 'Gérant' | 'Employé';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number;
  code: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  alert_quantity: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export type PaymentMethod = 'Espèces' | 'Mobile Money' | 'Virement';

export interface Sale {
  id: number;
  user_id: number;
  customer_id: number | null;
  total_amount: number;
  payment_status: 'Cash' | 'Dette';
  payment_method?: PaymentMethod;
  payment_reference?: string;
  payment_confirmed?: boolean;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Debt {
  id: number;
  sale_id: number;
  customer_id: number;
  amount_due: number;
  amount_paid: number;
  status: 'Pending' | 'Paid';
  created_at: string;
}

export interface Expense {
  id: number;
  reason: string;
  amount: number;
  category: 'Fournitures' | 'Loyer' | 'Salaires' | 'Taxes' | 'Transport' | 'Autre';
  payment_method: PaymentMethod | 'Banque';
  created_at: string;
  user_id: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email?: string;
  nif?: string;
  currency: string;
  receiptHeader?: string;
  receiptFooterMessage: string;
  autoPrintReceipt?: boolean;
  criticalStockThreshold?: number;
  allowNegativeStock?: boolean;
  allowEmployeeDiscount?: boolean;
  allowEmployeeViewMargins?: boolean;
  defaultUserRole?: 'Admin' | 'Gérant' | 'Caissier';
}
