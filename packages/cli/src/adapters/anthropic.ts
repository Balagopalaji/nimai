import Anthropic from '@anthropic-ai/sdk';
import type { ModelAdapter } from './types';
import { AdapterError } from './errors';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

export class AnthropicAdapter implements ModelAdapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = message.content[0];
      if (block.type !== 'text') {
        throw new AdapterError('Unexpected response type from Anthropic API');
      }
      return block.text;
    } catch (err) {
      if (err instanceof AdapterError) throw err;

      const message = err instanceof Error ? err.message : String(err);
      // Surface auth errors clearly
      if (message.includes('401') || message.includes('authentication')) {
        throw new AdapterError(
          'Anthropic API authentication failed. Check your ANTHROPIC_API_KEY.',
          err
        );
      }
      throw new AdapterError(`Anthropic API error: ${message}`, err);
    }
  }
}
