import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdapterError } from '../adapters/errors';

// Mock the Anthropic SDK before importing the adapter
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

// Import after mock is set up
const { AnthropicAdapter, DEFAULT_MODEL } = await import('../adapters/anthropic');
const Anthropic = (await import('@anthropic-ai/sdk')).default;

describe('AnthropicAdapter', () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate = vi.fn();
    (Anthropic as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  it('uses claude-sonnet-4-6 as default model', () => {
    new AnthropicAdapter('test-key');
    expect(DEFAULT_MODEL).toBe('claude-sonnet-4-6');
  });

  it('returns text content from a successful API call', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Draft spec content here' }],
    });

    const adapter = new AnthropicAdapter('test-key');
    const result = await adapter.generate('write a spec for X');

    expect(result).toBe('Draft spec content here');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'write a spec for X' }],
      })
    );
  });

  it('uses custom model when provided', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'response' }],
    });

    const adapter = new AnthropicAdapter('test-key', 'claude-opus-4-6');
    await adapter.generate('prompt');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-4-6' })
    );
  });

  it('throws AdapterError on auth failure (401)', async () => {
    mockCreate.mockRejectedValue(new Error('401 authentication failed'));

    const adapter = new AnthropicAdapter('bad-key');
    const err = await adapter.generate('prompt').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toContain('authentication failed');
  });

  it('throws AdapterError wrapping generic API errors', async () => {
    mockCreate.mockRejectedValue(new Error('network timeout'));

    const adapter = new AnthropicAdapter('test-key');
    const err = await adapter.generate('prompt').catch(e => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err.message).toContain('network timeout');
  });

  it('throws AdapterError on unexpected response type', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const adapter = new AnthropicAdapter('test-key');
    await expect(adapter.generate('prompt')).rejects.toThrow(AdapterError);
  });
});

describe('AdapterError', () => {
  it('has name AdapterError', () => {
    const err = new AdapterError('test message');
    expect(err.name).toBe('AdapterError');
    expect(err.message).toBe('test message');
  });

  it('preserves cause', () => {
    const cause = new Error('root cause');
    const err = new AdapterError('wrapper', cause);
    expect(err.cause).toBe(cause);
  });
});
