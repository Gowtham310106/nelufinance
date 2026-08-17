// src/features/dashboard/dashboard.service.ts
import { Types } from 'mongoose';
import { Sale } from '../../models/sale.model';
import { Purchase } from '../../models/purchase.model';
import { Expense } from '../../models/expense.model';
import { Customer } from '../../models/customer.model';
import { Supplier } from '../../models/supplier.model';
import { Product } from '../../models/product.model';
import { Payment } from '../../models/payment.model';

export interface DashboardMetrics {
  today: {
    salesAmountPaise: number;
    salesWeightKg: number;
    salesCount: number;
    cashReceivedPaise: number;
    creditSalesPaise: number;
    grossProfitPaise: number;
    purchasesAmountPaise: number;
    purchasesWeightKg: number;
    purchasesCount: number;
    expensesAmountPaise: number;
    netProfitPaise: number;
  };
  overall: {
    totalCustomerPendingPaise: number;
    totalSupplierPayablePaise: number;
    totalStockKg: number;
    totalValuationPaise: number;
    lowStockCount: number;
    lowStockProducts: {
      id: string;
      name: string;
      nameTamil?: string;
      currentStockKg: number;
      minimumStockKg: number;
    }[];
  };
  recentTransactions: {
    id: string;
    type: 'SALE' | 'PURCHASE' | 'PAYMENT_RECEIVED' | 'EXPENSE';
    transactionNumber: string;
    partyName: string;
    amountPaise: number;
    weightKg?: number;
    date: Date;
  }[];
}

export class DashboardService {
  async getMetrics(businessId: string): Promise<DashboardMetrics> {
    const bId = new Types.ObjectId(businessId);

    // Today's date range (midnight to midnight local)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Sales
    const todaySales = await Sale.find({
      businessId: bId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    let todaySalesAmount = 0;
    let todaySalesWeight = 0;
    let todayCashReceived = 0;
    let todayCreditSales = 0;
    let todayGrossProfit = 0;

    for (const s of todaySales) {
      todaySalesAmount += s.totalAmountPaise;
      todayCashReceived += s.receivedAmountPaise;
      todayCreditSales += s.creditAmountPaise;
      todayGrossProfit += s.grossProfitPaise || 0;
      for (const item of s.items) {
        todaySalesWeight += item.quantityKg;
      }
    }

    // 2. Today's Purchases
    const todayPurchases = await Purchase.find({
      businessId: bId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    let todayPurchasesAmount = 0;
    let todayPurchasesWeight = 0;

    for (const p of todayPurchases) {
      todayPurchasesAmount += p.totalAmountPaise;
      for (const item of p.items) {
        todayPurchasesWeight += item.quantityKg;
      }
    }

    // 3. Today's Expenses
    const todayExpenses = await Expense.find({
      businessId: bId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    const todayExpensesAmount = todayExpenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const todayNetProfit = todayGrossProfit - todayExpensesAmount;

    // 4. Total Customer Udhar / Outstanding
    const customers = await Customer.find({ businessId: bId, active: true });
    const totalCustomerPending = customers.reduce(
      (sum, c) => sum + Math.max(0, c.currentBalancePaise || 0),
      0
    );

    // 5. Total Supplier Payables
    const suppliers = await Supplier.find({ businessId: bId, active: true });
    const totalSupplierPayable = suppliers.reduce(
      (sum, s) => sum + Math.max(0, s.currentPayablePaise || 0),
      0
    );

    // 6. Total Stock & Valuation
    const products = await Product.find({ businessId: bId, active: true });
    let totalStockKg = 0;
    let totalValuation = 0;
    const lowStockProducts: DashboardMetrics['overall']['lowStockProducts'] = [];

    for (const prod of products) {
      const stock = prod.currentStockKg || 0;
      const minStock = prod.minimumStockKg || 50;
      const wac = prod.weightedAvgCostPaisePerKg || 0;

      totalStockKg += stock;
      totalValuation += Math.round(stock * wac);

      if (stock <= minStock) {
        lowStockProducts.push({
          id: (prod._id as any).toString(),
          name: prod.name,
          nameTamil: prod.nameTamil,
          currentStockKg: stock,
          minimumStockKg: minStock,
        });
      }
    }

    // 7. Recent activities (combined latest 6 items)
    const recentSales = await Sale.find({ businessId: bId }).sort({ date: -1 }).limit(4);
    const recentPurchases = await Purchase.find({ businessId: bId }).sort({ date: -1 }).limit(3);
    const recentPayments = await Payment.find({ businessId: bId }).sort({ date: -1 }).limit(3);
    const recentExpenses = await Expense.find({ businessId: bId }).sort({ date: -1 }).limit(3);

    const recentTxns: DashboardMetrics['recentTransactions'] = [];

    for (const s of recentSales) {
      const weight = s.items.reduce((sum, i) => sum + i.quantityKg, 0);
      recentTxns.push({
        id: (s._id as any).toString(),
        type: 'SALE',
        transactionNumber: s.transactionNumber,
        partyName: s.customerName || 'Cash Customer',
        amountPaise: s.totalAmountPaise,
        weightKg: weight,
        date: s.date,
      });
    }

    for (const p of recentPurchases) {
      const weight = p.items.reduce((sum, i) => sum + i.quantityKg, 0);
      recentTxns.push({
        id: (p._id as any).toString(),
        type: 'PURCHASE',
        transactionNumber: p.transactionNumber,
        partyName: p.supplierName || 'Cash Supplier',
        amountPaise: p.totalAmountPaise,
        weightKg: weight,
        date: p.date,
      });
    }

    for (const pay of recentPayments) {
      recentTxns.push({
        id: (pay._id as any).toString(),
        type: 'PAYMENT_RECEIVED',
        transactionNumber: pay.transactionNumber,
        partyName: pay.partyName,
        amountPaise: pay.amountPaise,
        date: pay.date,
      });
    }

    for (const exp of recentExpenses) {
      recentTxns.push({
        id: (exp._id as any).toString(),
        type: 'EXPENSE',
        transactionNumber: exp.transactionNumber,
        partyName: exp.category.toUpperCase(),
        amountPaise: exp.amountPaise,
        date: exp.date,
      });
    }

    // Sort descending by date
    recentTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      today: {
        salesAmountPaise: todaySalesAmount,
        salesWeightKg: todaySalesWeight,
        salesCount: todaySales.length,
        cashReceivedPaise: todayCashReceived,
        creditSalesPaise: todayCreditSales,
        grossProfitPaise: todayGrossProfit,
        purchasesAmountPaise: todayPurchasesAmount,
        purchasesWeightKg: todayPurchasesWeight,
        purchasesCount: todayPurchases.length,
        expensesAmountPaise: todayExpensesAmount,
        netProfitPaise: todayNetProfit,
      },
      overall: {
        totalCustomerPendingPaise: totalCustomerPending,
        totalSupplierPayablePaise: totalSupplierPayable,
        totalStockKg,
        totalValuationPaise: totalValuation,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
      },
      recentTransactions: recentTxns.slice(0, 8),
    };
  }
}

export const dashboardService = new DashboardService();
