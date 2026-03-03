/**
 * E2E test: spawns the MCP server as a subprocess, performs the JSON-RPC
 * initialize handshake, calls tools/list, asserts 4 tools, then shuts down cleanly.
 */
import { describe, it, expect } from 'vitest';
import * as cp from 'child_process';
import * as path from 'path';
import * as readline from 'readline';

// packages/mcp/dist/index.js — 2 levels up from src/__tests__/
const SERVER_PATH = path.join(__dirname, '../../dist/index.js');

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface SpawnedServer {
  proc: cp.ChildProcessWithoutNullStreams;
  request: (id: number, method: string, params?: unknown) => Promise<JsonRpcResponse>;
  notify: (method: string, params?: unknown) => void;
  shutdown: () => Promise<void>;
}

function spawnServer(): SpawnedServer {
  const proc = cp.spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const rl = readline.createInterface({ input: proc.stdout });
  const waiters = new Map<number, (msg: JsonRpcResponse) => void>();

  rl.on('line', line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: JsonRpcResponse;
    try {
      msg = JSON.parse(trimmed) as JsonRpcResponse;
    } catch {
      return; // ignore non-JSON lines
    }
    if (msg.id !== undefined && waiters.has(msg.id)) {
      waiters.get(msg.id)!(msg);
      waiters.delete(msg.id);
    }
  });

  function send(payload: unknown): void {
    proc.stdin.write(JSON.stringify(payload) + '\n');
  }

  function request(id: number, method: string, params: unknown = {}): Promise<JsonRpcResponse> {
    return new Promise(resolve => {
      waiters.set(id, resolve);
      send({ jsonrpc: '2.0', id, method, params });
    });
  }

  function notify(method: string, params: unknown = {}): void {
    send({ jsonrpc: '2.0', method, params });
  }

  function shutdown(): Promise<void> {
    return new Promise(resolve => {
      proc.on('close', () => resolve());
      proc.kill('SIGTERM');
    });
  }

  return { proc, request, notify, shutdown };
}

describe('MCP server E2E', () => {
  it('starts, lists exactly 4 tools with correct names, then exits cleanly', async () => {
    const server = spawnServer();

    // 1. Initialize handshake
    const initRes = await server.request(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'nimai-e2e-test', version: '0.0.1' },
    });
    expect(initRes.error).toBeUndefined();

    // 2. Initialized notification (no response expected)
    server.notify('notifications/initialized');

    // 3. List tools
    const toolsRes = await server.request(2, 'tools/list');
    expect(toolsRes.error).toBeUndefined();

    const tools = (toolsRes.result as { tools: Array<{ name: string }> }).tools;
    expect(tools).toHaveLength(4);

    const names = tools.map(t => t.name);
    expect(names).toContain('nimai_spec');
    expect(names).toContain('nimai_review');
    expect(names).toContain('nimai_validate');
    expect(names).toContain('nimai_new');

    // 4. Clean shutdown
    await server.shutdown();
  }, 15_000);
});
