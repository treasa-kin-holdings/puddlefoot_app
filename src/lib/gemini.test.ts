import { describe, it, expect } from 'vitest';
import { BRAMBLE_SYSTEM_PROMPT } from './gemini';
import { BRAND } from './brand';

describe('Bramble Persona', () => {
    it('should have the correct tone keywords', () => {
        expect(BRAMBLE_SYSTEM_PROMPT).toContain('meticulous');
        expect(BRAMBLE_SYSTEM_PROMPT).toContain(BRAND.assistantSpecies);
        expect(BRAMBLE_SYSTEM_PROMPT).toContain('Indeed');
    });
});
