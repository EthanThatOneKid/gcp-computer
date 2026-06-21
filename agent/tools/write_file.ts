import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export const description =
  'Creates a new file or overwrites an existing file inside the sandbox workspace.';

export const schema = z.object({
  filePath: z.string().describe('The target filename or path inside the workspace.'),
  content: z.string().describe('The text content to write to the file.'),
});

export async function run(sandboxId: string, input: z.infer<typeof schema>) {
  try {
    await sandboxManager.writeFile(sandboxId, input.filePath, input.content);
    return { success: true, message: `Successfully wrote file to ${input.filePath}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Write failed' };
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
