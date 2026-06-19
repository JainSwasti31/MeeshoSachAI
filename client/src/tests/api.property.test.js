// Feature: sachai-trust-engine, Property 5: API error toast displays the server's message
// Validates: Requirements 3.1

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Mock react-hot-toast BEFORE importing the api module
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), loading: vi.fn(), success: vi.fn() },
}));

import toast from 'react-hot-toast';
import MockAdapter from 'axios-mock-adapter';
import api from '../api/index.js';

describe("Property 5: API error toast displays the server's message", () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('toast.error is called with the exact server message from data.message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // arbitrary non-empty message
        async (message) => {
          vi.clearAllMocks();
          // Mock ANY GET to return 500 with { message }
          mockAxios.onGet('/products').reply(500, { message });

          try {
            await api.get('/products');
          } catch (_) {
            // expected — the interceptor re-throws
          }

          // toast.error must have been called with exactly the generated message
          const calls = toast.error.mock.calls;
          if (calls.length === 0) return false;
          if (calls[calls.length - 1][0] !== message) return false;
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
