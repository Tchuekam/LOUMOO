/**
 * LOUMOO Commerce Core — Order Input Validation Schemas
 * ---------------------------------------------------------------------------
 * Zod schemas with strict key rejection to enforce the input trust boundary.
 * Rejects client attempts to inject privileged fields (status, sellerId, buyerId).
 */

const { z } = require('zod');

const OrderItemInputSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing ID is required').max(128).optional(),
  productId: z.string().trim().min(1).max(128).optional(),
  id: z.string().trim().min(1).max(128).optional(),
  variantId: z.string().trim().max(128).optional().nullable(),
  // Strict integer quantity validation
  quantity: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = Number(val);
      return Number.isInteger(parsed) ? parsed : NaN;
    }
    return val;
  }, z.number().int({ message: 'Quantity must be an integer' }).min(1, 'Quantity must be at least 1').max(1000, 'Quantity cannot exceed 1,000 units per line')),
  // Optional client price fields (for discrepancy check; never trusted as source of truth)
  unitPriceXaf: z.number().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  unitPriceMinor: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  title: z.string().trim().max(255).optional()
}).strict().refine(data => data.listingId || data.productId || data.id, {
  message: 'Each item must specify a listingId or productId'
});

const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient full name is required').max(120).optional().nullable(),
  phone: z.string().trim().min(6, 'Valid phone number is required').max(32).optional().nullable(),
  street: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  neighbourhood: z.string().trim().max(120).optional().nullable(),
  postalCode: z.string().trim().max(32).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable()
}).optional().nullable();

const CreateOrderInputSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, 'Cannot place an order with an empty bag').max(50, 'Order cannot exceed 50 distinct items'),
  shippingAddress: ShippingAddressSchema,
  deliveryMethod: z.enum(['HOME_DELIVERY', 'STORE_PICKUP']).default('HOME_DELIVERY'),
  // Optional client total fields (checked for discrepancy by server, never trusted directly)
  totalAmountXaf: z.number().optional().nullable(),
  totalXaf: z.number().optional().nullable(),
  subtotalXaf: z.number().optional().nullable(),
  idempotencyKey: z.string().trim().max(128).optional().nullable(),
  orderNumber: z.string().trim().max(64).optional().nullable(), // accepted for idempotency/reference comparison only
  notes: z.string().trim().max(500).optional().nullable()
}).strict({
  message: 'Unexpected field in order request. Privileged fields (sellerId, buyerId, status) are prohibited.'
});

const CancelOrderInputSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable()
}).strict();

module.exports = {
  OrderItemInputSchema,
  CreateOrderInputSchema,
  CancelOrderInputSchema
};
