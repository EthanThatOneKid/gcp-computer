import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export default defineTool({
  description:
    'Run any shell command inside the secure Linux sandbox. Returns stdout, stderr, and exit code.',
  inputSchema: z.object({
    sandboxId: z.string().describe('The target sandbox instance ID to execute the command on.'),
    command: z.string().describe('The bash/shell command to execute.'),
    workDir: z.string().optional().describe('Optional working directory (relative to /workspace).'),
  }),
  async execute(input) {
    try {
      const result = await sandboxManager.executeCommand(
        input.sandboxId,
        input.command,
        input.workDir,
      );
      return result;
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message || 'Execution failed',
        exitCode: 1,
      };
    }
  },
});
