import { ZodTypeAny } from 'zod';

export const parseFormError = (schema: ZodTypeAny, values: unknown) => {
  const result = schema.safeParse(values);
  if (!result.success) {
    return result.error.flatten().fieldErrors;
  }
  return {};
};
