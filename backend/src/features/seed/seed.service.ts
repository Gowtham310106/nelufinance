// src/features/seed/seed.service.ts
import { Types } from 'mongoose';
import { Product } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';
import { Customer } from '../../models/customer.model';
import { Purchase } from '../../models/purchase.model';
import { Sale } from '../../models/sale.model';
import { Payment } from '../../models/payment.model';
import { Expense } from '../../models/expense.model';
import { Employee } from '../../models/employee.model';
import { WeightReconciliation } from '../../models/weight-reconciliation.model';
import { DailyClosing } from '../../models/daily-closing.model';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { EmployeeAdvance } from '../../models/employee-advance.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { env } from '../../config/env';

export class SeedService {
  async populateDemoData(businessId: string, userId: string) {
    const bId = new Types.ObjectId(businessId);
    const uId = new Types.ObjectId(userId);

    // Seeding wipes the business's records, so only allow it on a business with no real
    // transactions yet — unless explicitly enabled for a demo deployment.
    if (env.ENABLE_DEMO_SEED !== 'true') {
      const [salesCount, purchasesCount] = await Promise.all([
        Sale.countDocuments({ businessId: bId }),
        Purchase.countDocuments({ businessId: bId }),
      ]);
      if (salesCount > 0 || purchasesCount > 0) {
        throw Object.assign(
          new Error(
            'Demo data can only be loaded into a new business with no sales or purchases. Your existing records were not changed.',
          ),
          { status: 409 },
        );
      }
    }

    // 1. Clear previous records for clean seeding
    await Product.deleteMany({ businessId: bId });
    await Supplier.deleteMany({ businessId: bId });
    await Customer.deleteMany({ businessId: bId });
    await Purchase.deleteMany({ businessId: bId });
    await Sale.deleteMany({ businessId: bId });
    await Payment.deleteMany({ businessId: bId });
    await Expense.deleteMany({ businessId: bId });
    await Employee.deleteMany({ businessId: bId });
    await WeightReconciliation.deleteMany({ businessId: bId });
    await DailyClosing.deleteMany({ businessId: bId });
    await InventoryTransaction.deleteMany({ businessId: bId });
    await EmployeeAdvance.deleteMany({ businessId: bId });

    // 2. Realistic Tamil Nadu Products
    const productsData = [
      {
        name: 'Ponni Boiled Rice (Deluxe)',
        nameTamil: 'பொன்னி புழுங்கல் அரிசி (டீலக்ஸ்)',
        category: 'boiled_rice',
        variety: 'Ponni',
        unit: 'kg',
        currentStockKg: 1800,
        minimumStockKg: 300,
        sellingPricePaise: 5400, // ₹54.00
        purchasePricePaise: 4600,
        weightedAvgCostPaisePerKg: 4600, // ₹46.00
        active: true,
      },
      {
        name: 'Deluxe Raw Rice (BPT 5204)',
        nameTamil: 'டீலக்ஸ் பச்சரிசி (பி.பி.டி 5204)',
        category: 'raw_rice',
        variety: 'BPT 5204',
        unit: 'kg',
        currentStockKg: 1200,
        minimumStockKg: 200,
        sellingPricePaise: 5000, // ₹50.00
        purchasePricePaise: 4200,
        weightedAvgCostPaisePerKg: 4200, // ₹42.00
        active: true,
      },
      {
        name: 'IR20 Idly / Tiffin Rice',
        nameTamil: 'ஐ.ஆர்.20 இட்லி / டிபன் அரிசி',
        category: 'idli_rice',
        variety: 'IR20',
        unit: 'kg',
        currentStockKg: 2500,
        minimumStockKg: 400,
        sellingPricePaise: 3800, // ₹38.00
        purchasePricePaise: 3200,
        weightedAvgCostPaisePerKg: 3200, // ₹32.00
        active: true,
      },
      {
        name: 'Tanjore CR 1009 Raw Paddy',
        nameTamil: 'தஞ்சாவூர் சி.ஆர் 1009 நெல்',
        category: 'raw_paddy',
        variety: 'CR 1009',
        unit: 'kg',
        currentStockKg: 4000,
        minimumStockKg: 500,
        sellingPricePaise: 2800, // ₹28.00
        purchasePricePaise: 2400,
        weightedAvgCostPaisePerKg: 2400, // ₹24.00
        active: true,
      },
      {
        name: 'ADT 45 Samba Boiled Paddy',
        nameTamil: 'ஏ.டி.டி 45 சாம்பா புழுங்கல் நெல்',
        category: 'other',
        variety: 'ADT 45',
        unit: 'kg',
        currentStockKg: 3500,
        minimumStockKg: 500,
        sellingPricePaise: 3000, // ₹30.00
        purchasePricePaise: 2600,
        weightedAvgCostPaisePerKg: 2600, // ₹26.00
        active: true,
      },
      {
        name: 'Pure Rice Bran (Thavudu)',
        nameTamil: 'சுத்தமான தவிடு',
        category: 'bran',
        variety: 'Bran',
        unit: 'kg',
        currentStockKg: 600,
        minimumStockKg: 100,
        sellingPricePaise: 1800, // ₹18.00
        purchasePricePaise: 1400,
        weightedAvgCostPaisePerKg: 1400, // ₹14.00
        active: true,
      },
    ];

    const products = await Product.insertMany(
      productsData.map((p) => ({ ...p, businessId: bId }))
    );

    // 3. Suppliers
    const suppliersData = [
      {
        name: 'Thanjavur Farmers Paddy Co-op',
        phone: '9443123456',
        address: 'Main Road, Kumbakonam, Thanjavur',
        currentPayablePaise: 4500000, // ₹45,000
        active: true,
      },
      {
        name: 'Balaji Modern Rice Mill',
        phone: '9842187654',
        address: 'Industrial Estate, Chengalpattu',
        currentPayablePaise: 2250000, // ₹22,500
        active: true,
      },
      {
        name: 'Cauvery Agro Mandi',
        phone: '9789012345',
        address: 'Gandhi Market, Trichy',
        currentPayablePaise: 0,
        active: true,
      },
    ];

    const suppliers = await Supplier.insertMany(
      suppliersData.map((s) => ({ ...s, businessId: bId }))
    );

    // 4. Customers
    const customersData = [
      {
        name: 'Murugan Hotel & Mess',
        phone: '9840123456',
        address: 'Bazaar Street, Town',
        openingBalancePaise: 500000,
        currentBalancePaise: 1490000, // ₹5,000 opening + ₹9,900 credit sale
        interestRate: 2.0,
        active: true,
      },
      {
        name: 'Annapoorna Tiffin Center',
        phone: '9790234567',
        address: 'Bus Stand Road',
        openingBalancePaise: 850000,
        currentBalancePaise: 850000, // ₹8,500
        interestRate: 1.5,
        active: true,
      },
      {
        name: 'Sri Selvi Grocery Store',
        phone: '9444345678',
        address: 'South Car Street',
        openingBalancePaise: 2100000,
        currentBalancePaise: 2100000, // ₹21,000
        interestRate: 2.0,
        active: true,
      },
      {
        name: 'Kaveri Catering Services',
        phone: '9884567890',
        address: 'Railway Station Road',
        openingBalancePaise: 480000,
        currentBalancePaise: 480000, // ₹4,800
        interestRate: 2.0,
        active: true,
      },
    ];

    const customers = await Customer.insertMany(
      customersData.map((c) => ({ ...c, businessId: bId }))
    );

    // 5. Staff Employees
    const employeesData = [
      {
        name: 'Ramesh Kumar',
        phone: '9876500001',
        role: 'cashier',
        salaryType: 'monthly',
        baseSalaryPaise: 1800000, // ₹18,000
        currentAdvancePaise: 200000, // ₹2,000
        active: true,
      },
      {
        name: 'Selvamani M',
        phone: '9876500002',
        role: 'labor',
        salaryType: 'daily',
        baseSalaryPaise: 65000, // ₹650/day
        currentAdvancePaise: 150000, // ₹1,500
        active: true,
      },
      {
        name: 'Palani G',
        phone: '9876500003',
        role: 'driver',
        salaryType: 'daily',
        baseSalaryPaise: 75000, // ₹750/day
        currentAdvancePaise: 50000, // ₹500
        active: true,
      },
    ];

    await Employee.insertMany(
      employeesData.map((e) => ({ ...e, businessId: bId }))
    );

    // 6. Expenses
    const expensesData = [
      { category: 'transport', amountPaise: 350000, notes: 'Lorry Freight (Thanjavur to Shop)' },
      { category: 'loading', amountPaise: 120000, notes: 'Hamali / Loading 200 bags' },
      { category: 'electricity', amountPaise: 280000, notes: 'TNEB Shop Bill' },
      { category: 'fuel', amountPaise: 60000, notes: 'Diesel for delivery auto' },
      { category: 'food', amountPaise: 18000, notes: 'Tea & Snacks for staff' },
    ];

    for (let i = 0; i < expensesData.length; i++) {
      const exp = expensesData[i];
      const expTxn = await generateTransactionNumber(businessId, 'EXP');
      await Expense.create({
        businessId: bId,
        transactionNumber: expTxn,
        category: exp.category as any,
        amountPaise: exp.amountPaise,
        paymentMethod: 'cash',
        notes: exp.notes,
        date: new Date(Date.now() - i * 3600000 * 4),
      });
    }

    // 7. Sample Purchases
    const p1Txn = await generateTransactionNumber(businessId, 'PUR');
    await Purchase.create({
      businessId: bId,
      transactionNumber: p1Txn,
      supplierId: suppliers[0]._id,
      supplierName: suppliers[0].name,
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          inputQuantity: 40,
          inputUnit: 'bag',
          quantityKg: 3000,
          ratePaisePerKg: 4600, // ₹3,450 per 75kg bag (₹46/kg)
          totalAmountPaise: 13800000, // ₹1,38,000
        },
      ],
      totalAmountPaise: 13800000,
      paidAmountPaise: 9300000,
      pendingAmountPaise: 4500000,
      paymentMethod: 'bank_transfer',
      date: new Date(Date.now() - 86400000 * 2),
    });

    // 8. Sample Sales
    const s1Txn = await generateTransactionNumber(businessId, 'SAL');
    await Sale.create({
      businessId: bId,
      transactionNumber: s1Txn,
      customerId: customers[0]._id,
      customerName: customers[0].name,
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          inputQuantity: 4,
          inputUnit: 'bag',
          quantityKg: 300,
          ratePaisePerKg: 5400, // ₹4,050 per bag (₹54/kg)
          costPaisePerKgSnapshot: 4600,
          totalCostPaise: 1380000, // ₹13,800
          totalAmountPaise: 1620000, // ₹16,200
        },
        {
          productId: products[2]._id,
          productName: products[2].name,
          inputQuantity: 2,
          inputUnit: 'bag',
          quantityKg: 150,
          ratePaisePerKg: 3800, // ₹2,850 per bag (₹38/kg)
          costPaisePerKgSnapshot: 3200,
          totalCostPaise: 480000, // ₹4,800
          totalAmountPaise: 570000, // ₹5,700
        },
      ],
      totalAmountPaise: 2190000, // ₹21,900
      totalCostPaise: 1860000, // ₹18,600
      grossProfitPaise: 330000, // ₹3,300 profit
      receivedAmountPaise: 1200000, // ₹12,000 cash
      creditAmountPaise: 990000, // ₹9,900 credit
      paymentMethod: 'cash',
      date: new Date(),
    });

    const s2Txn = await generateTransactionNumber(businessId, 'SAL');
    await Sale.create({
      businessId: bId,
      transactionNumber: s2Txn,
      customerName: 'Cash / Walk-in Customer',
      items: [
        {
          productId: products[1]._id,
          productName: products[1].name,
          inputQuantity: 1,
          inputUnit: 'bag',
          quantityKg: 75,
          ratePaisePerKg: 5000,
          costPaisePerKgSnapshot: 4200,
          totalCostPaise: 315000,
          totalAmountPaise: 375000,
        },
      ],
      totalAmountPaise: 375000,
      totalCostPaise: 315000,
      grossProfitPaise: 60000,
      receivedAmountPaise: 375000,
      creditAmountPaise: 0,
      paymentMethod: 'upi',
      date: new Date(),
    });

    // 9. Lorry Weighbridge Ticket
    const wrcTxn = await generateTransactionNumber(businessId, 'WRC');
    await WeightReconciliation.create({
      businessId: bId,
      transactionNumber: wrcTxn,
      lorryNumber: 'TN-49-Q-7821',
      driverName: 'Senthil',
      driverPhone: '9841239876',
      supplierId: suppliers[0]._id,
      supplierName: suppliers[0].name,
      productId: products[0]._id,
      productName: products[0].name,
      grossWeightKg: 24500,
      tareWeightKg: 9500,
      netWeighbridgeWeightKg: 15000,
      bagCount: 200,
      bagStandardWeightKg: 75,
      bagCalculatedWeightKg: 15000,
      discrepancyKg: 0,
      discrepancyPercentage: 0,
      actionTaken: 'ACCEPT_WEIGHBRIDGE',
      finalAcceptedWeightKg: 15000,
      notes: 'Thanjavur Direct Load - Verified Perfect',
      date: new Date(),
    });

    return {
      message: 'Realistic Tamil Nadu demo shop data loaded successfully!',
      summary: {
        productsCount: products.length,
        suppliersCount: suppliers.length,
        customersCount: customers.length,
        employeesCount: employeesData.length,
        expensesCount: expensesData.length,
      },
    };
  }
}

export const seedService = new SeedService();
