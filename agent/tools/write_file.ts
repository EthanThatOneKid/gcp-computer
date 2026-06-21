import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export default defineTool({
  description: 'Creates a new file or overwrites an existing file inside the sandbox workspace.',
  inputSchema: z.object({
    sandboxId: z.string().describe('The target sandbox instance ID.'),
    filePath: z.string().describe('The target filename or path inside the workspace.'),
    content: z.string().describe('The text content to write to the file.'),
  }),
  async execute(input) {
    try {
      await sandboxManager.writeFile(input.sandboxId, input.filePath, input.content);
      return { success: true, message: `Successfully wrote file to ${input.filePath}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Write failed' };
    }
  },
});
