import { createGame } from '../engine.js';
// Dedicated entry point for the Find The Match template.
export function mount(ctx) { return createGame('find-the-match', ctx); }
