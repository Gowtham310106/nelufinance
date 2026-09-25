// src/features/suppliers/supplier.service.ts
import { Types } from 'mongoose';
import { Supplier, ISupplier } from '../../models/supplier.model';
import { createAuditLog } from '../../services/audit.service';
import { CreateSupplierInput, UpdateSupplierInput } from './supplier.validators';
import { searchRegex } from '../../utils/query';

export class SupplierService {
  async create(businessId: string, userId: string, input: CreateSupplierInput): Promise<ISupplier> {
    const supplier = await Supplier.create({
      businessId: new Types.ObjectId(businessId),
      name: input.name,
      phone: input.phone,
      address: input.address || '',
      notes: input.notes || '',
      currentPayablePaise: 0,
      active: true,
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'supplier.create',
      entityType: 'Supplier',
      entityId: (supplier._id as any).toString(),
      changes: [{ field: 'name', oldValue: null, newValue: supplier.name }],
    });

    return supplier;
  }

  async getAll(businessId: string, search?: string): Promise<ISupplier[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId), active: true };

    if (search) {
      const regex = searchRegex(search);
      filter.$or = [{ name: regex }, { phone: regex }];
    }

    return Supplier.find(filter).sort({ name: 1 });
  }

  async getById(businessId: string, supplierId: string): Promise<ISupplier | null> {
    return Supplier.findOne({
      _id: new Types.ObjectId(supplierId),
      businessId: new Types.ObjectId(businessId),
    });
  }

  async update(
    businessId: string,
    userId: string,
    supplierId: string,
    input: UpdateSupplierInput
  ): Promise<ISupplier | null> {
    const updated = await Supplier.findOneAndUpdate(
      {
        _id: new Types.ObjectId(supplierId),
        businessId: new Types.ObjectId(businessId),
      },
      { $set: input },
      { returnDocument: 'after' }
    );

    if (updated) {
      await createAuditLog({
        businessId,
        userId,
        action: 'supplier.update',
        entityType: 'Supplier',
        entityId: supplierId,
        reason: 'Supplier details updated',
      });
    }

    return updated;
  }
}

export const supplierService = new SupplierService();
