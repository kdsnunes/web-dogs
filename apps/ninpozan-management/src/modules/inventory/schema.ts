import { z } from 'zod';

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome'),
  category: z.string().trim().optional(),
  unit: z.string().trim().min(1, 'Informe a unidade'),
  min_quantity: z.coerce.number().min(0, 'Não pode ser negativo'),
  notes: z.string().trim().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const movementFormSchema = z.object({
  kind: z.enum(['entrada', 'saida']),
  quantity: z.coerce.number().positive('Informe uma quantidade maior que zero'),
  movement_date: z.string().min(1, 'Informe a data'),
  note: z.string().trim().optional(),
});

export type MovementFormValues = z.infer<typeof movementFormSchema>;
