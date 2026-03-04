import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DESCRIPTORS, ForgeSpecInput, ForgeReviewInput, ForgeValidateInput, ForgeNewInput, ForgeSpecReviewInput } from './contract';
import { toolSpec } from './tools/spec';
import { toolReview } from './tools/review';
import { toolValidate } from './tools/validate';
import { toolNew } from './tools/new';
import { toolSpecReview } from './tools/spec-review';

export function createServer(): Server {
  const server = new Server(
    { name: 'nimai', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(TOOL_DESCRIPTORS).map(descriptor => ({
      name: descriptor.name,
      description: descriptor.description,
      inputSchema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries(descriptor.inputSchema.shape).map(([key, schema]) => [
            key,
            { type: 'string', description: (schema as { description?: string }).description ?? '' },
          ])
        ),
        required: Object.keys(descriptor.inputSchema.shape),
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'nimai_spec': {
          const input = ForgeSpecInput.parse(args);
          result = await toolSpec(input);
          break;
        }
        case 'nimai_review': {
          const input = ForgeReviewInput.parse(args);
          result = await toolReview(input);
          break;
        }
        case 'nimai_validate': {
          const input = ForgeValidateInput.parse(args);
          result = await toolValidate(input);
          break;
        }
        case 'nimai_new': {
          const input = ForgeNewInput.parse(args);
          result = await toolNew(input);
          break;
        }
        case 'nimai_spec_review': {
          const input = ForgeSpecReviewInput.parse(args);
          result = await toolSpecReview(input);
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
