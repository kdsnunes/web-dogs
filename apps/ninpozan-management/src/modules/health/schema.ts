import { z } from 'zod';
import { typeRequiresProduct } from './catalog';

export const healthEventFormSchema = z
  .object({
    dog_id: z.string().uuid('Selecione um cão'),
    event_type: z.enum([
      'vacina',
      'vermifugo',
      'antiparasitario',
      'medicamento',
      'consulta',
      'cio',
      'peso',
      'outro',
    ]),
    product: z.string().trim().optional(),
    event_date: z.string().min(1, 'Informe a data'),
    description: z.string().trim().optional(),
    next_due_date: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (typeRequiresProduct(values.event_type) && !values.product?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['product'],
        message: 'Selecione o produto',
      });
    }
  });

export type HealthEventFormValues = z.infer<typeof healthEventFormSchema>;
