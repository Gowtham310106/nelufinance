// src/features/reports/reports.service.ts
import { Types } from 'mongoose';
import { Sale } from '../../models/sale.model';
import { Purchase } from '../../models/purchase.model';
import { Expense } from '../../models/expense.model';
import { parseDateBound, todayIst } from '../../utils/query';

export interface ProfitLossReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenuePaise: number;
  cogsPaise: number;
  grossProfitPaise: number;
  grossMarginPercentage: number;
  expensesByCategory: {
    category: string;
    amountPaise: number;
    percentageOfExpenses: number;
  }[];
  totalExpensesPaise: number;
  netProfitPaise: number;
  netMarginPercentage: number;
}

export interface SalesAnalyticsReport {
  totalRevenuePaise: number;
  totalQuantityKg: number;
  totalGrossProfitPaise: number;
  salesCount: number;
  byProduct: {
    productId: string;
    productName: string;
    quantityKg: number;
    revenuePaise: number;
    profitPaise: number;
  }[];
  byCustomer: {
    customerId?: string;
    customerName: string;
    totalAmountPaise: number;
    paidAmountPaise: number;
    creditAmountPaise: number;
  }[];
}

/** Report period: explicit bounds, or the current calendar month in IST by default. */
function resolveReportRange(startDateStr?: string, endDateStr?: string) {
  const today = todayIst(); // YYYY-MM-DD
  const [y, m] = today.split('-').map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${today.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`;

  return {
    startDate: parseDateBound(startDateStr || monthStart, 'start'),
    endDate: parseDateBound(endDateStr || monthEnd, 'end'),
  };
}

export class ReportsService {
  async getProfitLoss(
    businessId: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<ProfitLossReport> {
    const bId = new Types.ObjectId(businessId);

    // Default: this month
    const { startDate, endDate } = resolveReportRange(startDateStr, endDateStr);

    const dateFilter = { $gte: startDate, $lte: endDate };

    // 1. Sales & COGS
    const sales = await Sale.find({ businessId: bId, date: dateFilter });

    let revenuePaise = 0;
    let cogsPaise = 0;
    let grossProfitPaise = 0;

    for (const s of sales) {
      revenuePaise += s.totalAmountPaise;
      cogsPaise += s.totalCostPaise || 0;
      grossProfitPaise += s.grossProfitPaise || 0;
    }

    const grossMargin = revenuePaise > 0 ? (grossProfitPaise / revenuePaise) * 100 : 0;

    // 2. Expenses grouped by category
    const expenses = await Expense.find({ businessId: bId, date: dateFilter });
    const catMap = new Map<string, number>();
    let totalExpensesPaise = 0;

    for (const exp of expenses) {
      const current = catMap.get(exp.category) || 0;
      catMap.set(exp.category, current + exp.amountPaise);
      totalExpensesPaise += exp.amountPaise;
    }

    const expensesByCategory = Array.from(catMap.entries()).map(([category, amountPaise]) => ({
      category,
      amountPaise,
      percentageOfExpenses: totalExpensesPaise > 0 ? (amountPaise / totalExpensesPaise) * 100 : 0,
    }));

    const netProfitPaise = grossProfitPaise - totalExpensesPaise;
    const netMargin = revenuePaise > 0 ? (netProfitPaise / revenuePaise) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenuePaise,
      cogsPaise,
      grossProfitPaise,
      grossMarginPercentage: Math.round(grossMargin * 10) / 10,
      expensesByCategory,
      totalExpensesPaise,
      netProfitPaise,
      netMarginPercentage: Math.round(netMargin * 10) / 10,
    };
  }

  async getSalesAnalytics(
    businessId: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<SalesAnalyticsReport> {
    const bId = new Types.ObjectId(businessId);

    const { startDate, endDate } = resolveReportRange(startDateStr, endDateStr);

    const sales = await Sale.find({
      businessId: bId,
      date: { $gte: startDate, $lte: endDate },
    });

    let totalRevenuePaise = 0;
    let totalQuantityKg = 0;
    let totalGrossProfitPaise = 0;

    const prodMap = new Map<string, { name: string; quantityKg: number; revenuePaise: number; profitPaise: number }>();
    const custMap = new Map<string, { name: string; totalPaise: number; paidPaise: number; creditPaise: number }>();

    for (const s of sales) {
      totalRevenuePaise += s.totalAmountPaise;
      totalGrossProfitPaise += s.grossProfitPaise || 0;

      // Group by product
      for (const item of s.items) {
        totalQuantityKg += item.quantityKg;
        const pId = item.productId.toString();
        const existingP = prodMap.get(pId) || {
          name: item.productName,
          quantityKg: 0,
          revenuePaise: 0,
          profitPaise: 0,
        };

        const itemProfit = item.totalAmountPaise - (item.totalCostPaise || 0);
        existingP.quantityKg += item.quantityKg;
        existingP.revenuePaise += item.totalAmountPaise;
        existingP.profitPaise += itemProfit;
        prodMap.set(pId, existingP);
      }

      // Group by customer
      const cKey = s.customerId ? s.customerId.toString() : 'cash_customer';
      const cName = s.customerName || 'Cash / Walk-in';
      const existingC = custMap.get(cKey) || {
        name: cName,
        totalPaise: 0,
        paidPaise: 0,
        creditPaise: 0,
      };
      existingC.totalPaise += s.totalAmountPaise;
      existingC.paidPaise += s.receivedAmountPaise;
      existingC.creditPaise += s.creditAmountPaise;
      custMap.set(cKey, existingC);
    }

    const byProduct = Array.from(prodMap.entries()).map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantityKg: data.quantityKg,
      revenuePaise: data.revenuePaise,
      profitPaise: data.profitPaise,
    }));

    const byCustomer = Array.from(custMap.entries()).map(([cKey, data]) => ({
      customerId: cKey !== 'cash_customer' ? cKey : undefined,
      customerName: data.name,
      totalAmountPaise: data.totalPaise,
      paidAmountPaise: data.paidPaise,
      creditAmountPaise: data.creditPaise,
    }));

    return {
      totalRevenuePaise,
      totalQuantityKg,
      totalGrossProfitPaise,
      salesCount: sales.length,
      byProduct: byProduct.sort((a, b) => b.revenuePaise - a.revenuePaise),
      byCustomer: byCustomer.sort((a, b) => b.totalAmountPaise - a.totalAmountPaise),
    };
  }
}

export const reportsService = new ReportsService();
