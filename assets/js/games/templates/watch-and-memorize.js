import { createGame } from '../engine.js';
// Dedicated entry point for the Watch And Memorize template.
export function mount(ctx) { return createGame('watch-and-memorize', ctx); }
