import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export const description =
  'Run any shell command inside the secure Linux sandbox. Returns stdout, stderr, and exit code.';

export const schema = z.object({
  command: z.string().describe('The bash/shell command to execute.'),
  workDir: z.string().optional().describe('Optional working directory (relative to /workspace).'),
});

export async function run(sandboxId: string, input: z.infer<typeof schema>) {
  try {
    const result = await sandboxManager.executeCommand(
      sandboxId,
      input.command,
      input.workDir,
    );
    return result;
  } catch (error) {
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Execution failed',
      exitCode: 1,
    };
  }
}

export default defineTool({
  description,
  inputSchema: schema.extend({
    sandboxId: z.string().describe('The target sandbox instance ID to execute the command on.'),
  }),
  async execute(input) {
    const { sandboxId, ...rest } = input;
    return await run(sandboxId, rest);
  },
});
