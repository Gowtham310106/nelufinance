// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { json, urlencoded } from 'express';
import { errorHandler } from './middleware/error-handler.middleware';
import { generalLimiter } from './middleware/rate-limit.middleware';
import authRouter from './features/auth/auth.routes';
import businessRouter from './features/business/business.routes';
import productsRouter from './features/products/product.routes';
import suppliersRouter from './features/suppliers/supplier.routes';
import purchasesRouter from './features/purchases/purchase.routes';
import inventoryRouter from './features/inventory/inventory.routes';
import customersRouter from './features/customers/customer.routes';
import salesRouter from './features/sales/sale.routes';
import paymentsRouter from './features/payments/payment.routes';
import expensesRouter from './features/expenses/expense.routes';
import dashboardRouter from './features/dashboard/dashboard.routes';
import reportsRouter from './features/reports/reports.routes';
import weightReconciliationRouter from './features/weight-reconciliation/weight-reconciliation.routes';
import dailyClosingRouter from './features/daily-closing/daily-closing.routes';
import employeesRouter from './features/employees/employee.routes';
import auditRouter from './features/audit/audit.routes';
import seedRouter from './features/seed/seed.routes';
import adakuRouter from './features/adaku/adaku.routes';

const app = express();

// Security & parsing middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan('dev'));
app.use(json({ limit: '20mb' }));
app.use(urlencoded({ extended: true, limit: '20mb' }));
app.use(generalLimiter);

// Serve static uploaded photos (fallback local storage)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Vetrinel API is running', timestamp: new Date().toISOString() });
});

// Feature routes
app.use('/api/auth', authRouter);
app.use('/api/business', businessRouter);
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/weight-reconciliation', weightReconciliationRouter);
app.use('/api/daily-closing', dailyClosingRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/seed', seedRouter);
app.use('/api/adaku', adakuRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Centralized error handler
app.use(errorHandler);

export default app;
