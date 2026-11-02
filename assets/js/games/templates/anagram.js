import { createGame } from '../engine.js';
// Dedicated entry point for the Anagram template.
export function mount(ctx) { return createGame('anagram', ctx); }
