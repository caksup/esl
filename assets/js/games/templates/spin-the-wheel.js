import { createGame } from '../engine.js';
// Dedicated entry point for the Spin The Wheel template.
export function mount(ctx) { return createGame('spin-the-wheel', ctx); }
