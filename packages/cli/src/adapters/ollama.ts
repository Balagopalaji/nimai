import type { ModelAdapter } from './types';
import { AdapterError } from './errors';

export class OllamaAdapter implements ModelAdapter {
  constructor(
    private baseUrl: string = 'http://localhost:11434',
    private model: string = 'llama3'
  ) {}

  async generate(prompt: string): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, prompt, stream: false }),
      });
    } catch (err) {
      throw new AdapterError(
        `Ollama connection failed at ${this.baseUrl}. Is Ollama running? (${(err as Error).message})`,
        err
      );
    }

    if (!res.ok) {
      throw new AdapterError(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    type OllamaResponse = { response: string };
    const data = await res.json() as OllamaResponse;
    if (!data?.response) throw new AdapterError('Unexpected response shape from Ollama API');
    return data.response;
  }
}
