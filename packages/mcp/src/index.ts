#!/usr/bin/env node
export { FORGE_ROOT } from './prompts';
export { createServer, startServer } from './server';

// Start server when run directly
if (require.main === module) {
  const { startServer: start } = require('./server');
  start().catch((err: Error) => {
    console.error('FORGE MCP server failed to start:', err);
    process.exit(1);
  });
}
