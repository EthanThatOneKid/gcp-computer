import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export const description = 'Reads the text content of a file from the sandbox workspace.';

export const schema = z.object({
  filePath: z.string().describe('The filename or path to read.'),
});

export async function run(sandboxId: string, input: z.infer<typeof schema>) {
  try {
    const content = await sandboxManager.readFile(sandboxId, input.filePath);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Read failed' };
  }
}

export default defineTool({
  description,
  inputSchema: schema.extend({
    sandboxId: z.string().describe('The target sandbox instance ID.'),
  }),
  async execute(input) {
    const { sandboxId, ...rest } = input;
    return await run(sandboxId, rest);
  },
});
