import * as z from 'zod';
import type { Service } from '../hooks/useServices';

import { SERVICE_CATEGORIES } from '../../supabase/functions/_shared/pricing.ts';
export { SERVICE_CATEGORIES };
const PRICING_TYPES = ['fixed', 'per_child'] as const;

// Keep a legacy value available while editing it, but never offer it for a new service.
const withCurrentValue = (options: readonly string[], current?: string): string[] =>
  current && !options.includes(current) ? [...options, current] : [...options];

export const getServiceCategoryOptions = (current?: string) =>
  withCurrentValue(SERVICE_CATEGORIES, current);

export const getServicePricingOptions = (current?: string) =>
  withCurrentValue(PRICING_TYPES, current);

const monetaryAmount = z.number({
  required_error: 'Ingresa un importe numérico',
  invalid_type_error: 'Ingresa un importe numérico',
}).finite('Ingresa un importe válido')
  .int('El importe debe ser un número entero')
  .min(0, 'El importe no puede ser negativo')
  .max(2147483647, 'El importe supera el máximo permitido');

export const createServiceFormSchema = (initialData?: Service) => z.object({
  id: z.string().min(1, 'ID es requerido'),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  // Display copy is deliberately independent of the numeric quotation inputs.
  price: z.string().min(1, 'Precio mostrado es requerido'),
  base_price: monetaryAmount,
  hora_extra: monetaryAmount,
  pricing_type: z.string().refine(
    value => getServicePricingOptions(initialData?.pricing_type).includes(value),
    'Selecciona un tipo de precio válido',
  ),
  category: z.string().refine(
    value => getServiceCategoryOptions(initialData?.category).includes(value),
    'Selecciona una categoría válida',
  ),
  icon: z.string().min(1, 'Icono es requerido'),
  features: z.array(z.string()).optional(),
  duration: z.string().optional(),
  max_participants: z.number().finite().int('Ingresa un número entero').min(1).max(2147483647).optional(),
  age_range: z.string().optional(),
  space_requirements: z.string().optional(),
});

export type ServiceFormData = z.infer<ReturnType<typeof createServiceFormSchema>>;

export const getServiceFormDefaults = (initialData?: Service): Partial<ServiceFormData> => ({
  id: initialData?.id ?? '',
  title: initialData?.title ?? '',
  description: initialData?.description ?? '',
  price: initialData?.price ?? '',
  // Do not guess a numeric price from display copy, and preserve intentional zeroes.
  base_price: initialData?.base_price ?? undefined,
  hora_extra: initialData?.hora_extra ?? 0,
  pricing_type: initialData?.pricing_type ?? 'fixed',
  category: initialData?.category ?? '',
  icon: initialData?.icon ?? '',
  features: [...(initialData?.features ?? [])],
  duration: initialData?.duration ?? '2 horas',
  max_participants: initialData?.max_participants ?? 8,
  age_range: initialData?.age_range ?? '4-12 años',
  space_requirements: initialData?.space_requirements ?? '',
});

export const buildServiceSubmission = (
  data: unknown,
  features: string[],
  initialData?: Service,
): ServiceFormData => {
  const validated = createServiceFormSchema(initialData).parse(data);
  return { ...validated, features: [...features] };
};
