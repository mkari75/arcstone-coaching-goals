import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiCoachingService } from '@/services/aiCoachingService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

describe('AI Coaching Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('suggestPowerMoves', () => {
    it('returns array of suggestions', async () => {
      const suggestions = await aiCoachingService.suggestPowerMoves('test-user-id');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('includes call suggestion for low call count', async () => {
      const suggestions = await aiCoachingService.suggestPowerMoves('test-user-id');
      const hasCallSuggestion = suggestions.some(s =>
        s.toLowerCase().includes('call')
      );
      expect(hasCallSuggestion).toBe(true);
    });
  });
});
