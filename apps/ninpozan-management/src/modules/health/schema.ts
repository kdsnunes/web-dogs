import { z } from 'zod';
import { isStockCategory } from '@/modules/taxonomy';

const optionalPositiveNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().positive().optional(),
);

export const healthEventFormSchema = z
  .object({
    dog_id: z.string().uuid('Selecione um cão'),
    category: z.string().min(1, 'Selecione a categoria'),
    subcategory: z.string().min(1, 'Selecione a subcategoria'),
    item_id: z.string().optional(),
    quantity: optionalPositiveNumber,
    event_date: z.string().min(1, 'Informe a data'),
    description: z.string().trim().optional(),
    next_due_date: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (isStockCategory(values.category)) {
      if (!values.item_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['item_id'], message: 'Selecione o item' });
      }
      if (!values.quantity || values.quantity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantity'],
          message: 'Informe a quantidade',
        });
      }
    }
  });

export type HealthEventFormValues = z.infer<typeof healthEventFormSchema>;
