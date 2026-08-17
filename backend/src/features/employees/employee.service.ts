// src/features/employees/employee.service.ts
import { Types } from 'mongoose';
import { Employee, IEmployee } from '../../models/employee.model';
import { EmployeeAdvance, IEmployeeAdvance } from '../../models/employee-advance.model';
import { Expense } from '../../models/expense.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RecordEmployeeTransactionInput,
} from './employee.validators';

export class EmployeeService {
  async create(businessId: string, userId: string, input: CreateEmployeeInput): Promise<IEmployee> {
    const employee = await Employee.create({
      businessId: new Types.ObjectId(businessId),
      name: input.name,
      phone: input.phone,
      role: input.role,
      salaryType: input.salaryType,
      baseSalaryPaise: input.baseSalaryPaise,
      currentAdvancePaise: 0,
      active: true,
      notes: input.notes || '',
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'employee.create',
      entityType: 'Employee',
      entityId: (employee._id as any).toString(),
      changes: [{ field: 'name', oldValue: null, newValue: employee.name }],
    });

    return employee;
  }

  async getAll(businessId: string): Promise<IEmployee[]> {
    return Employee.find({
      businessId: new Types.ObjectId(businessId),
      active: true,
    }).sort({ name: 1 });
  }

  async getById(businessId: string, employeeId: string): Promise<{
    employee: IEmployee;
    transactions: IEmployeeAdvance[];
  } | null> {
    const employee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!employee) return null;

    const transactions = await EmployeeAdvance.find({
      businessId: new Types.ObjectId(businessId),
      employeeId: new Types.ObjectId(employeeId),
    }).sort({ date: -1 });

    return { employee, transactions };
  }

  async update(
    businessId: string,
    userId: string,
    employeeId: string,
    input: UpdateEmployeeInput
  ): Promise<IEmployee | null> {
    const updated = await Employee.findOneAndUpdate(
      {
        _id: new Types.ObjectId(employeeId),
        businessId: new Types.ObjectId(businessId),
      },
      { $set: input },
      { new: true }
    );

    if (updated) {
      await createAuditLog({
        businessId,
        userId,
        action: 'employee.update',
        entityType: 'Employee',
        entityId: employeeId,
        reason: 'Updated employee profile',
      });
    }

    return updated;
  }

  async recordTransaction(
    businessId: string,
    userId: string,
    employeeId: string,
    input: RecordEmployeeTransactionInput
  ): Promise<IEmployeeAdvance> {
    const employee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!employee) {
      throw Object.assign(new Error('Employee not found'), { status: 404 });
    }

    const txnNumber = await generateTransactionNumber(businessId, 'ETR');
    const txnDate = input.date ? new Date(input.date) : new Date();

    // 1. Create EmployeeAdvance record
    const txn = await EmployeeAdvance.create({
      businessId: new Types.ObjectId(businessId),
      transactionNumber: txnNumber,
      employeeId: employee._id,
      employeeName: employee.name,
      type: input.type,
      amountPaise: input.amountPaise,
      paymentMethod: input.paymentMethod,
      notes: input.notes || '',
      date: txnDate,
      recordedBy: new Types.ObjectId(userId),
    });

    // 2. Update employee advance balance
    if (input.type === 'ADVANCE_GIVEN') {
      await Employee.findByIdAndUpdate(employeeId, {
        $inc: { currentAdvancePaise: input.amountPaise },
      });
    } else if (input.type === 'ADVANCE_DEDUCTED') {
      await Employee.findByIdAndUpdate(employeeId, {
        $inc: { currentAdvancePaise: -input.amountPaise },
      });
    } else if (input.type === 'SALARY_PAID') {
      // Auto-record in shop expenses under 'salary'
      const expTxnNumber = await generateTransactionNumber(businessId, 'EXP');
      await Expense.create({
        businessId: new Types.ObjectId(businessId),
        transactionNumber: expTxnNumber,
        category: 'salary',
        amountPaise: input.amountPaise,
        paymentMethod: input.paymentMethod,
        notes: `Salary to ${employee.name} (${input.notes || ''})`,
        employeeId: new Types.ObjectId(userId),
        date: txnDate,
      });
    }

    await createAuditLog({
      businessId,
      userId,
      action: 'employee.transaction',
      entityType: 'EmployeeAdvance',
      entityId: (txn._id as any).toString(),
      changes: [{ field: 'type', oldValue: null, newValue: input.type }],
      reason: `Recorded ${input.type} of ₹${(input.amountPaise / 100).toFixed(2)} for ${employee.name}`,
    });

    return txn;
  }
}

export const employeeService = new EmployeeService();
