import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
});

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  shippingName: z.string().min(2).max(100),
  shippingPhone: z.string().min(10).max(15),
  shippingAddress: z.string().min(3).max(300),
  shippingCity: z.string().min(2).max(100),
  shippingPincode: z.string().regex(/^\d{6}$/),
  notes: z.string().max(500).optional(),
});

describe('Product validation', () => {
  const validProduct = {
    name: 'Hair Oil',
    description: 'Premium hair oil',
    price: 299,
    category: 'hair-care',
    stock: 50,
  };

  it('accepts a valid product', () => {
    const result = CreateProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateProductSchema.safeParse({ ...validProduct, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative price', () => {
    expect(CreateProductSchema.safeParse({ ...validProduct, price: 0 }).success).toBe(false);
    expect(CreateProductSchema.safeParse({ ...validProduct, price: -10 }).success).toBe(false);
  });

  it('rejects negative stock', () => {
    const result = CreateProductSchema.safeParse({ ...validProduct, stock: -1 });
    expect(result.success).toBe(false);
  });

  it('defaults stock to 0 and isActive to true', () => {
    const minimalInput = { name: 'Test Product', price: 100, category: 'test' };
    const result = CreateProductSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });
});

describe('Order validation', () => {
  const validOrder = {
    items: [{ productId: 'clx1234567890abcdef', quantity: 2 }],
    shippingName: 'Test User',
    shippingPhone: '+919876543210',
    shippingAddress: '123 Main St, Indore',
    shippingCity: 'Indore',
    shippingPincode: '452001',
  };

  it('accepts a valid order', () => {
    const result = CreateOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const result = CreateOrderSchema.safeParse({ ...validOrder, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pincode format', () => {
    const result = CreateOrderSchema.safeParse({ ...validOrder, shippingPincode: '4520' });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'clx1234567890abcdef', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
