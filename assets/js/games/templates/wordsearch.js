import { createGame } from '../engine.js';
// Dedicated entry point for the Wordsearch template.
export function mount(ctx) { return createGame('wordsearch', ctx); }
