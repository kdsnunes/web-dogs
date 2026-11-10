import { z } from 'zod';

export const healthEventFormSchema = z.object({
  dog_id: z.string().uuid('Selecione um cão'),
  event_type: z.enum(['vacina', 'vermifugo', 'medicamento', 'consulta', 'cio', 'peso', 'outro']),
  event_date: z.string().min(1, 'Informe a data'),
  description: z.string().trim().optional(),
  next_due_date: z.string().optional(),
});

export type HealthEventFormValues = z.infer<typeof healthEventFormSchema>;
