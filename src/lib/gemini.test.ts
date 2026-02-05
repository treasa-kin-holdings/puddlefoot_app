import { describe, it, expect } from 'vitest';
import { PUDDLEFOOT_SYSTEM_PROMPT } from '../lib/gemini';

describe('Puddlefoot Persona', () => {
    it('should have the correct tone keywords', () => {
        expect(PUDDLEFOOT_SYSTEM_PROMPT).toContain('meticulous');
        expect(PUDDLEFOOT_SYSTEM_PROMPT).toContain('penguin');
        expect(PUDDLEFOOT_SYSTEM_PROMPT).toContain('Indeed');
    });
});
