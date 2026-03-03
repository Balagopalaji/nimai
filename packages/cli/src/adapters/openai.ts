import type { ModelAdapter } from './types';
import { AdapterError } from './errors';

export class OpenAIAdapter implements ModelAdapter {
  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o',
    private baseUrl: string = 'https://api.openai.com/v1'
  ) {}

  async generate(prompt: string): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (err) {
      throw new AdapterError(`OpenAI API network error: ${(err as Error).message}`, err);
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new AdapterError('OpenAI API authentication failed. Check your OPENAI_API_KEY.');
      }
      throw new AdapterError(`OpenAI API error: ${res.status} ${res.statusText}`);
    }

    type OpenAIResponse = { choices: { message: { content: string } }[] };
    const data = await res.json() as OpenAIResponse;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new AdapterError('Unexpected response shape from OpenAI API');
    return content;
  }
}
