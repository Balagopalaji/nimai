import { lintSpec } from 'nimai-core';
import { ForgeValidateInput, ForgeValidateOutput } from '../contract';
import { z } from 'zod';

export async function toolValidate(
  input: z.infer<typeof ForgeValidateInput>
): Promise<ForgeValidateOutput> {
  const issues = lintSpec(input.specPath);
  return { issues, passed: issues.length === 0 };
}
