import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { sandboxManager } from '../../src/services/sandbox/manager';

export default defineTool({
  description: 'Simulates or performs mounting a host directory path to a sandbox mount point path.',
  inputSchema: z.object({
    sandboxId: z.string().description('The target sandbox instance ID.'),
    hostPath: z.string().description('The physical host machine directory path.'),
    sandboxPath: z.string().description('The mount target path inside the sandbox container (e.g. /mnt/data).'),
  }),
  async execute(input) {
    try {
      await sandboxManager.mountDirectory(input.sandboxId, input.hostPath, input.sandboxPath);
      return { success: true, message: `Successfully mounted ${input.hostPath} to ${input.sandboxPath}` };
    } catch (error: any) {
      return { success: false, error: error.message || 'Mount failed' };
    }
  },
});
