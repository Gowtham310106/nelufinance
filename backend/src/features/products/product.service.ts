// src/features/products/product.service.ts
import { Types } from 'mongoose';
import { Product, IProduct } from '../../models/product.model';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { createAuditLog } from '../../services/audit.service';
import { CreateProductInput, UpdateProductInput } from './product.validators';

export class ProductService {
  async create(businessId: string, userId: string, input: CreateProductInput): Promise<IProduct> {
    const product = await Product.create({
      businessId: new Types.ObjectId(businessId),
      name: input.name,
      nameTamil: input.nameTamil || '',
      category: input.category,
      unit: input.unit,
      purchasePricePaise: input.purchasePricePaise,
      sellingPricePaise: input.sellingPricePaise,
      currentStockKg: input.initialStockKg || 0,
      minimumStockKg: input.minimumStockKg ?? 50,
      weightedAvgCostPaisePerKg: input.purchasePricePaise || 0,
      active: true,
    });

    if (input.initialStockKg && input.initialStockKg > 0) {
      await InventoryTransaction.create({
        businessId: new Types.ObjectId(businessId),
        productId: product._id,
        type: 'ADJUSTMENT_IN',
        quantityKg: input.initialStockKg,
        balanceAfterKg: input.initialStockKg,
        unitRatePaise: input.purchasePricePaise,
        referenceType: 'ManualAdjustment',
        employeeId: new Types.ObjectId(userId),
        reason: 'Initial stock setup on product creation',
        date: new Date(),
      });
    }

    await createAuditLog({
      businessId,
      userId,
      action: 'product.create',
      entityType: 'Product',
      entityId: (product._id as any).toString(),
      changes: [{ field: 'name', oldValue: null, newValue: product.name }],
    });

    return product;
  }

  async getAll(
    businessId: string,
    options: { search?: string; category?: string; activeOnly?: boolean } = {}
  ): Promise<IProduct[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.activeOnly !== false) {
      filter.active = true;
    }

    if (options.category && options.category !== 'all') {
      filter.category = options.category;
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search, 'i');
      filter.$or = [{ name: searchRegex }, { nameTamil: searchRegex }];
    }

    return Product.find(filter).sort({ name: 1 });
  }

  async getById(businessId: string, productId: string): Promise<IProduct | null> {
    return Product.findOne({
      _id: new Types.ObjectId(productId),
      businessId: new Types.ObjectId(businessId),
    });
  }

  async update(
    businessId: string,
    userId: string,
    productId: string,
    input: UpdateProductInput
  ): Promise<IProduct | null> {
    const existing = await Product.findOne({
      _id: new Types.ObjectId(productId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!existing) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      { $set: input },
      { new: true }
    );

    await createAuditLog({
      businessId,
      userId,
      action: 'product.update',
      entityType: 'Product',
      entityId: productId,
      reason: 'Product details updated',
    });

    return updated;
  }

  async delete(businessId: string, userId: string, productId: string): Promise<boolean> {
    const result = await Product.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
        businessId: new Types.ObjectId(businessId),
      },
      { active: false },
      { new: true }
    );

    if (!result) return false;

    await createAuditLog({
      businessId,
      userId,
      action: 'product.delete',
      entityType: 'Product',
      entityId: productId,
      reason: 'Product deactivated',
    });

    return true;
  }
}

export const productService = new ProductService();
