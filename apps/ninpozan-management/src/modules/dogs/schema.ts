import { z } from 'zod';

export const dogFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome'),
  registered_name: z.string().trim().optional(),
  breed: z.string().trim().min(1, 'Informe a raça'),
  sex: z.enum(['macho', 'femea']),
  birth_date: z.string().optional(),
  color: z.string().trim().optional(),
  microchip: z.string().trim().optional(),
  registration_number: z.string().trim().optional(),
  status: z.enum(['ativo', 'aposentado', 'vendido', 'falecido']),
  notes: z.string().trim().optional(),
});

export type DogFormValues = z.infer<typeof dogFormSchema>;
