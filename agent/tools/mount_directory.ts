import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export const description =
  'Simulates or performs mounting a host directory path to a sandbox mount point path.';

export const schema = z.object({
  hostPath: z.string().describe('The physical host machine directory path.'),
  sandboxPath: z
    .string()
    .describe('The mount target path inside the sandbox container (e.g. /mnt/data).'),
});

export async function run(sandboxId: string, input: z.infer<typeof schema>) {
  try {
    await sandboxManager.mountDirectory(sandboxId, input.hostPath, input.sandboxPath);
    return {
      success: true,
      message: `Successfully mounted ${input.hostPath} to ${input.sandboxPath}`,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Mount failed' };
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
