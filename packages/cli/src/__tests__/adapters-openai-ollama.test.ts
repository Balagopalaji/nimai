import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdapterError } from '../adapters/errors';

// ─── Mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  } as unknown as Response;
}

function errorResponse(status: number, statusText: string): Response {
  return { ok: false, status, statusText, json: async () => ({}) } as unknown as Response;
}

beforeEach(() => vi.clearAllMocks());

// ─── OpenAIAdapter ─────────────────────────────────────────────────────────────

const { OpenAIAdapter } = await import('../adapters/openai');

describe('OpenAIAdapter', () => {
  it('returns text from a successful API response', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({ choices: [{ message: { content: 'Draft spec here' } }] })
    );
    const adapter = new OpenAIAdapter('test-key', 'gpt-4o');
    expect(await adapter.generate('prompt')).toBe('Draft spec here');
  });

  it('calls the correct endpoint with Bearer auth', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({ choices: [{ message: { content: 'ok' } }] })
    );
    await new OpenAIAdapter('my-key', 'gpt-4o').generate('p');
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/chat/completions');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-key');
  });

  it('uses custom baseUrl for OpenAI-compatible APIs (e.g. z.ai)', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({ choices: [{ message: { content: 'ok' } }] })
    );
    await new OpenAIAdapter('key', 'model', 'https://api.z.ai/v1').generate('p');
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api.z.ai/v1');
  });

  it('throws AdapterError on 401', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'));
    const err = await new OpenAIAdapter('bad-key').generate('p').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toContain('authentication failed');
  });

  it('throws AdapterError on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const err = await new OpenAIAdapter('key').generate('p').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toContain('network error');
  });

  it('throws AdapterError on unexpected response shape', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ choices: [] }));
    const err = await new OpenAIAdapter('key').generate('p').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
  });
});

// ─── OllamaAdapter ────────────────────────────────────────────────────────────

const { OllamaAdapter } = await import('../adapters/ollama');

describe('OllamaAdapter', () => {
  it('returns text from a successful local response', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ response: 'Local draft spec' }));
    const adapter = new OllamaAdapter('http://localhost:11434', 'llama3');
    expect(await adapter.generate('prompt')).toBe('Local draft spec');
  });

  it('calls the Ollama generate endpoint', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ response: 'ok' }));
    await new OllamaAdapter().generate('p');
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/generate');
  });

  it('throws AdapterError with helpful message on connection failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const err = await new OllamaAdapter().generate('p').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toContain('Is Ollama running?');
  });

  it('throws AdapterError on unexpected response shape', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ result: 'wrong key' }));
    const err = await new OllamaAdapter().generate('p').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
  });
});
