import { createGame } from '../engine.js';
// Dedicated entry point for the Complete The Sentence template.
export function mount(ctx) { return createGame('complete-the-sentence', ctx); }
