import { Component, type ReactNode } from 'react';

/**
 * Isolates a subtree that is allowed to fail without taking the page with it.
 *
 * Originally for WebGL/Three.js — if the GPU context is lost or init throws
 * (common on memory-constrained mobile Safari), this renders nothing instead
 * of crashing the whole React tree, which is what surfaces as iOS Safari's
 * "a problem repeatedly occurred" reload loop. Also used for the chat widget,
 * where the same reasoning applies: a broken widget should be invisible, not
 * fatal.
 */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.warn(`${this.props.label ?? 'NeuralCanvas'} subtree failed, hiding it:`, error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
