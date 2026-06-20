import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export default defineTool({
  description: 'Creates a new file or overwrites an existing file inside the sandbox workspace.',
  inputSchema: z.object({
    sandboxId: z.string().description('The target sandbox instance ID.'),
    filePath: z.string().description('The target filename or path inside the workspace.'),
    content: z.string().description('The text content to write to the file.'),
  }),
  async execute(input) {
    try {
      await sandboxManager.writeFile(input.sandboxId, input.filePath, input.content);
      return { success: true, message: `Successfully wrote file to ${input.filePath}` };
    } catch (error: any) {
      return { success: false, error: error.message || 'Write failed' };
    }
  },
});
