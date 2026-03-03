/**
 * ModelAdapter interface — Milestone 2 stub.
 * Implement this to add --standalone mode with a specific LLM provider.
 */
export interface ModelAdapter {
  /** Send a prompt and return the model's text response */
  generate(prompt: string): Promise<string>;
}
