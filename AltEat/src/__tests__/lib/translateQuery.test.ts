import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { containsThai, translateToEnglish } from '../../lib/translateQuery'

describe('translateQuery', () => {
  describe('containsThai', () => {
    it('should return true for string with Thai characters', () => {
      expect(containsThai('สวัสดี')).toBe(true)
      expect(containsThai('hello สวัสดี')).toBe(true)
    })

    it('should return false for string without Thai characters', () => {
      expect(containsThai('hello world')).toBe(false)
      expect(containsThai('12345')).toBe(false)
      expect(containsThai('!@#$')).toBe(false)
    })
  })

  describe('translateToEnglish', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    })

    afterEach(() => {
      vi.unstubAllGlobals();
      globalThis.fetch = originalFetch;
    })

    it('should return original query if it does not contain Thai', async () => {
      const result = await translateToEnglish('hello');
      expect(result).toBe('hello');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    })

    it('should translate Thai query via fetch API', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          responseData: {
            translatedText: 'hello',
          },
        }),
      };
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as any);

      const result = await translateToEnglish('สวัสดี');
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent('สวัสดี')}&langpair=th|en`
      );
      expect(result).toBe('hello');
    })

    it('should return original query if translation fails', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));
      
      // Spy on console.warn to keep test output clean
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await translateToEnglish('สวัสดี');
      
      expect(result).toBe('สวัสดี');
      expect(consoleSpy).toHaveBeenCalledWith('Translation failed, using original query:', 'สวัสดี');
      
      consoleSpy.mockRestore();
    })

    it('should return original query if translation matches original', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          responseData: {
            translatedText: 'สวัสดี', // same as original
          },
        }),
      };
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as any);

      const result = await translateToEnglish('สวัสดี');
      
      expect(result).toBe('สวัสดี');
    })
  })
})
