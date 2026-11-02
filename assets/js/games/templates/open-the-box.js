import { createGame } from '../engine.js';
// Dedicated entry point for the Open The Box template.
export function mount(ctx) { return createGame('open-the-box', ctx); }
