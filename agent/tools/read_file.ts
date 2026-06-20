import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export default defineTool({
  description: 'Reads the text content of a file from the sandbox workspace.',
  inputSchema: z.object({
    sandboxId: z.string().description('The target sandbox instance ID.'),
    filePath: z.string().description('The filename or path to read.'),
  }),
  async execute(input) {
    try {
      const content = await sandboxManager.readFile(input.sandboxId, input.filePath);
      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message || 'Read failed' };
    }
  },
});
