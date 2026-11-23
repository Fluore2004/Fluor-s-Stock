import { Category, Product, Customer, Sale, SaleItem, Debt } from '../types';

export const initialCategories: Category[] = [
  { id: 1, name: 'Quincaillerie & Matériaux' },
  { id: 2, name: 'Santé & Pharmacie' },
  { id: 3, name: 'Alimentation & Boutique' }
];

export const initialProducts: Product[] = [
  // Quincaillerie
  { id: 1, category_id: 1, code: 'CIM-01', name: 'Ciment Dangote 42.5R (Sac 50kg)', purchase_price: 28000, selling_price: 33000, stock_quantity: 45, alert_quantity: 10 },
  { id: 2, category_id: 1, code: 'TOL-02', name: 'Tôle Galvanisée BG28 (Pièce)', purchase_price: 18500, selling_price: 21500, stock_quantity: 8, alert_quantity: 15 }, // Stock bas!
  { id: 3, category_id: 1, code: 'FER-03', name: 'Fer à béton Ø12 (Barre 12m)', purchase_price: 15000, selling_price: 17500, stock_quantity: 35, alert_quantity: 8 },
  
  // Pharmacie
  { id: 4, category_id: 2, code: 'PAR-04', name: 'Paracétamol 500mg (Boîte de 100)', purchase_price: 2500, selling_price: 4000, stock_quantity: 12, alert_quantity: 5 },
  { id: 5, category_id: 2, code: 'AMO-05', name: 'Amoxicilline 500mg (Boîte)', purchase_price: 4500, selling_price: 6500, stock_quantity: 3, alert_quantity: 10 }, // Stock bas!
  
  // Alimentation
  { id: 6, category_id: 3, code: 'HUI-06', name: 'Huile de Palme (Bidon 5L)', purchase_price: 14000, selling_price: 16500, stock_quantity: 20, alert_quantity: 5 },
  { id: 7, category_id: 3, code: 'RIZ-07', name: 'Riz Super Birashika (Sac 25kg)', purchase_price: 62000, selling_price: 69000, stock_quantity: 14, alert_quantity: 4 }
];

export const initialCustomers: Customer[] = [
  { id: 1, name: 'Jean-Marie NDUWIMANA', phone: '+257 79 920 110' },
  { id: 2, name: 'Claver GAKIZA', phone: '+257 61 245 789' },
  { id: 3, name: 'Marie-Rose BUZOYA', phone: '+257 75 882 334' },
  { id: 4, name: 'Elysée NKURUNZIZA', phone: '+257 71 505 101' },
  { id: 5, name: 'IGIRANEZA Fluoré', phone: '+257 76 123 456' }
];

export const initialDebts: Debt[] = [];

// Helper to get ISO date string offset from now
const getOffsetDate = (daysAgo: number, hoursAgo = 0, minutesAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString();
};

