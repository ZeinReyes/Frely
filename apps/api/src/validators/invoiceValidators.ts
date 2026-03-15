import { z } from 'zod';

export const lineItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity:    z.number().positive(),
  unitPrice:   z.number().positive(),
  amount:      z.number().positive(),
});

export const createInvoiceSchema = z.object({
  clientId:    z.string().uuid('Invalid client ID'),
  projectId:   z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  title:       z.string().min(1).max(200).trim(),
  lineItems:   z.array(lineItemSchema).min(1, 'At least one line item required'),
  currency:    z.string().length(3).default('USD'),
  taxRate:     z.number().min(0).max(100).default(0),
  discount:    z.number().min(0).default(0),
  dueDate:     z.string().datetime().optional(),
  notes:       z.string().max(2000).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const markPaidSchema = z.object({
  paidAt: z.string().datetime().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type MarkPaidInput      = z.infer<typeof markPaidSchema>;
