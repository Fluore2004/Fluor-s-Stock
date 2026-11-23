/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, SaleItem, Product, PaymentMethod, Expense } from '../types';

export interface PeriodMetrics {
  total: number;
  netProfit: number;
  expensesTotal: number;
  realNetProfit: number;
  count: number;
  growth: number; // percentage vs previous period
  profitGrowth: number;
}


export interface PaymentBreakdownItem {
  method: PaymentMethod;
  amount: number;
  count: number;
  percentage: number;
}

export interface TodayPaymentBreakdown {
  total: number;
  especes: PaymentBreakdownItem;
  mobileMoney: PaymentBreakdownItem;
  virement: PaymentBreakdownItem;
  dette: {
    amount: number;
    count: number;
    percentage: number;
  };
}

/**
 * Calculates net profit for a given set of sales:
 * SUM(item.quantity * (item.unit_price - product.purchase_price))
 */
export function calculateSalesProfit(
  salesList: Sale[],
  saleItems: SaleItem[],
  products: Product[]
): number {
  const saleIdSet = new Set(salesList.map(s => s.id));
  const relevantItems = saleItems.filter(item => saleIdSet.has(item.sale_id));
  
  let totalProfit = 0;
  for (const item of relevantItems) {
    const product = products.find(p => p.id === item.product_id);
    if (product) {
      const margin = item.unit_price - product.purchase_price;
      totalProfit += item.quantity * margin;
    }
  }
  return totalProfit;
}

/**
 * Calculates percentage growth between current and previous values.
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Date helpers
 */
export function getStartOfDay(d: Date): Date {
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  return res;
}

export function getEndOfDay(d: Date): Date {
  const res = new Date(d);
  res.setHours(23, 59, 59, 999);
  return res;
}

export function getStartOfWeek(d: Date): Date {
  const res = new Date(d);
  const day = res.getDay();
  // Monday is day 1, Sunday is day 0 (convert Sunday to 7)
  const diff = res.getDate() - (day === 0 ? 6 : day - 1);
  res.setDate(diff);
  res.setHours(0, 0, 0, 0);
  return res;
}

export function getEndOfWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getStartOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function getEndOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getStartOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function getEndOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Filter sales falling within [startDate, endDate]
 */
export function filterSalesByDateRange(salesList: Sale[], start: Date, end: Date): Sale[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return salesList.filter(s => {
    const t = new Date(s.created_at).getTime();
    return t >= startTime && t <= endTime;
  });
}

/**
 * Filter expenses falling within [startDate, endDate]
 */
export function filterExpensesByDateRange(expenses: Expense[], start: Date, end: Date): Expense[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return expenses.filter(e => {
    const t = new Date(e.created_at).getTime();
    return t >= startTime && t <= endTime;
  });
}

/**
 * Computes all 4 financial entry periods (Jour, Semaine, Mois, Année) with their
 * Total CA, Net Profit Subtitle, and Trend Growth % vs previous period.
 */
export function computePeriodicFinancials(
  sales: Sale[],
  saleItems: SaleItem[],
  products: Product[],
  expenses: Expense[],
  referenceDate: Date = new Date()
) {
  // 1. TODAY & YESTERDAY
  const todayStart = getStartOfDay(referenceDate);
  const todayEnd = getEndOfDay(referenceDate);
  
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = getStartOfDay(yesterday);
  const yesterdayEnd = getEndOfDay(yesterday);

  const todaySales = filterSalesByDateRange(sales, todayStart, todayEnd);
  const yesterdaySales = filterSalesByDateRange(sales, yesterdayStart, yesterdayEnd);
  
  const todayExpenses = filterExpensesByDateRange(expenses, todayStart, todayEnd);
  const yesterdayExpenses = filterExpensesByDateRange(expenses, yesterdayStart, yesterdayEnd);

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const todayProfit = calculateSalesProfit(todaySales, saleItems, products);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const yesterdayProfit = calculateSalesProfit(yesterdaySales, saleItems, products);
  const yesterdayExpensesTotal = yesterdayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayMetrics: PeriodMetrics = {
    total: todayTotal,
    netProfit: todayProfit,
    expensesTotal: todayExpensesTotal,
    realNetProfit: todayProfit - todayExpensesTotal,
    count: todaySales.length,
    growth: calculateGrowth(todayTotal, yesterdayTotal),
    profitGrowth: calculateGrowth(todayProfit - todayExpensesTotal, yesterdayProfit - yesterdayExpensesTotal)
  };

  // 2. THIS WEEK & LAST WEEK
  const thisWeekStart = getStartOfWeek(referenceDate);
  const thisWeekEnd = getEndOfWeek(referenceDate);

  const lastWeekRef = new Date(referenceDate);
  lastWeekRef.setDate(lastWeekRef.getDate() - 7);
  const lastWeekStart = getStartOfWeek(lastWeekRef);
  const lastWeekEnd = getEndOfWeek(lastWeekRef);

  const thisWeekSales = filterSalesByDateRange(sales, thisWeekStart, thisWeekEnd);
  const lastWeekSales = filterSalesByDateRange(sales, lastWeekStart, lastWeekEnd);
  
  const thisWeekExpenses = filterExpensesByDateRange(expenses, thisWeekStart, thisWeekEnd);
  const lastWeekExpenses = filterExpensesByDateRange(expenses, lastWeekStart, lastWeekEnd);

  const thisWeekTotal = thisWeekSales.reduce((sum, s) => sum + s.total_amount, 0);
  const thisWeekProfit = calculateSalesProfit(thisWeekSales, saleItems, products);
  const thisWeekExpensesTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const lastWeekTotal = lastWeekSales.reduce((sum, s) => sum + s.total_amount, 0);
  const lastWeekProfit = calculateSalesProfit(lastWeekSales, saleItems, products);
  const lastWeekExpensesTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

  const thisWeekMetrics: PeriodMetrics = {
    total: thisWeekTotal,
    netProfit: thisWeekProfit,
    expensesTotal: thisWeekExpensesTotal,
    realNetProfit: thisWeekProfit - thisWeekExpensesTotal,
    count: thisWeekSales.length,
    growth: calculateGrowth(thisWeekTotal, lastWeekTotal),
    profitGrowth: calculateGrowth(thisWeekProfit - thisWeekExpensesTotal, lastWeekProfit - lastWeekExpensesTotal)
  };

  // 3. THIS MONTH & LAST MONTH
  const thisMonthStart = getStartOfMonth(referenceDate);
  const thisMonthEnd = getEndOfMonth(referenceDate);

  const lastMonthRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  const lastMonthStart = getStartOfMonth(lastMonthRef);
  const lastMonthEnd = getEndOfMonth(lastMonthRef);

  const thisMonthSales = filterSalesByDateRange(sales, thisMonthStart, thisMonthEnd);
  const lastMonthSales = filterSalesByDateRange(sales, lastMonthStart, lastMonthEnd);
  
  const thisMonthExpenses = filterExpensesByDateRange(expenses, thisMonthStart, thisMonthEnd);
  const lastMonthExpenses = filterExpensesByDateRange(expenses, lastMonthStart, lastMonthEnd);

  const thisMonthTotal = thisMonthSales.reduce((sum, s) => sum + s.total_amount, 0);
  const thisMonthProfit = calculateSalesProfit(thisMonthSales, saleItems, products);
  const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const lastMonthTotal = lastMonthSales.reduce((sum, s) => sum + s.total_amount, 0);
  const lastMonthProfit = calculateSalesProfit(lastMonthSales, saleItems, products);
  const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthMetrics: PeriodMetrics = {
    total: thisMonthTotal,
    netProfit: thisMonthProfit,
    expensesTotal: thisMonthExpensesTotal,
    realNetProfit: thisMonthProfit - thisMonthExpensesTotal,
    count: thisMonthSales.length,
    growth: calculateGrowth(thisMonthTotal, lastMonthTotal),
    profitGrowth: calculateGrowth(thisMonthProfit - thisMonthExpensesTotal, lastMonthProfit - lastMonthExpensesTotal)
  };

  // 4. THIS YEAR & LAST YEAR
  const thisYearStart = getStartOfYear(referenceDate);
  const thisYearEnd = getEndOfYear(referenceDate);

  const lastYearRef = new Date(referenceDate.getFullYear() - 1, 0, 1);
  const lastYearStart = getStartOfYear(lastYearRef);
  const lastYearEnd = getEndOfYear(lastYearRef);

  const thisYearSales = filterSalesByDateRange(sales, thisYearStart, thisYearEnd);
  const lastYearSales = filterSalesByDateRange(sales, lastYearStart, lastYearEnd);
  
  const thisYearExpenses = filterExpensesByDateRange(expenses, thisYearStart, thisYearEnd);
  const lastYearExpenses = filterExpensesByDateRange(expenses, lastYearStart, lastYearEnd);

  const thisYearTotal = thisYearSales.reduce((sum, s) => sum + s.total_amount, 0);
  const thisYearProfit = calculateSalesProfit(thisYearSales, saleItems, products);
  const thisYearExpensesTotal = thisYearExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const lastYearTotal = lastYearSales.reduce((sum, s) => sum + s.total_amount, 0);
  const lastYearProfit = calculateSalesProfit(lastYearSales, saleItems, products);
  const lastYearExpensesTotal = lastYearExpenses.reduce((sum, e) => sum + e.amount, 0);

  const thisYearMetrics: PeriodMetrics = {
    total: thisYearTotal,
    netProfit: thisYearProfit,
    expensesTotal: thisYearExpensesTotal,
    realNetProfit: thisYearProfit - thisYearExpensesTotal,
    count: thisYearSales.length,
    growth: calculateGrowth(thisYearTotal, lastYearTotal),
    profitGrowth: calculateGrowth(thisYearProfit - thisYearExpensesTotal, lastYearProfit - lastYearExpensesTotal)
  };

  return {
    today: todayMetrics,
    thisWeek: thisWeekMetrics,
    thisMonth: thisMonthMetrics,
    thisYear: thisYearMetrics,
    todaySalesList: todaySales,
    thisWeekSalesList: thisWeekSales,
    thisMonthSalesList: thisMonthSales,
    thisYearSalesList: thisYearSales,
    todayExpensesList: todayExpenses,
    thisWeekExpensesList: thisWeekExpenses,
    thisMonthExpensesList: thisMonthExpenses,
    thisYearExpensesList: thisYearExpenses
  };
}

/**
 * Computes breakdown of today's sales by payment method: Espèces, Mobile Money, Virement
 */
export function computeTodayPaymentBreakdown(todaySales: Sale[]): TodayPaymentBreakdown {
  const total = todaySales.reduce((sum, s) => sum + s.total_amount, 0);

  let especesAmount = 0;
  let especesCount = 0;

  let mobileMoneyAmount = 0;
  let mobileMoneyCount = 0;

  let virementAmount = 0;
  let virementCount = 0;

  let detteAmount = 0;
  let detteCount = 0;

  for (const s of todaySales) {
    if (s.payment_status === 'Dette') {
      detteAmount += s.total_amount;
      detteCount += 1;
    } else {
      // Cash payment
      const method = s.payment_method || 'Espèces';
      if (method === 'Mobile Money') {
        mobileMoneyAmount += s.total_amount;
        mobileMoneyCount += 1;
      } else if (method === 'Virement') {
        virementAmount += s.total_amount;
        virementCount += 1;
      } else {
        especesAmount += s.total_amount;
        especesCount += 1;
      }
    }
  }

  const safeTotal = total > 0 ? total : 1;

  return {
    total,
    especes: {
      method: 'Espèces',
      amount: especesAmount,
      count: especesCount,
      percentage: total > 0 ? (especesAmount / safeTotal) * 100 : 0
    },
    mobileMoney: {
      method: 'Mobile Money',
      amount: mobileMoneyAmount,
      count: mobileMoneyCount,
      percentage: total > 0 ? (mobileMoneyAmount / safeTotal) * 100 : 0
    },
    virement: {
      method: 'Virement',
      amount: virementAmount,
      count: virementCount,
      percentage: total > 0 ? (virementAmount / safeTotal) * 100 : 0
    },
    dette: {
      amount: detteAmount,
      count: detteCount,
      percentage: total > 0 ? (detteAmount / safeTotal) * 100 : 0
    }
  };
}
