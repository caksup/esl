import { createGame } from '../engine.js';
// Dedicated entry point for the Hangman template.
export function mount(ctx) { return createGame('hangman', ctx); }
