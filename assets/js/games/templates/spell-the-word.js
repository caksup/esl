import { createGame } from '../engine.js';
// Dedicated entry point for the Spell The Word template.
export function mount(ctx) { return createGame('spell-the-word', ctx); }
