import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

export const itemFormSchema = z.object({
  category: z.string().min(1, 'Selecione a categoria'),
  subcategory: z.string().min(1, 'Selecione a subcategoria'),
  name: z.string().trim().min(1, 'Informe o nome'),
  unit: z.string().trim().min(1, 'Informe a unidade'),
  min_quantity: z.coerce.number().min(0, 'Não pode ser negativo'),
  protocol_amount: optionalPositiveInt,
  protocol_unit: z.enum(['days', 'months']),
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
