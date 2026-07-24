import { Component, type ReactNode } from 'react';

/**
 * Isolates a WebGL/Three.js subtree. If the GPU context is lost or WebGL init
 * throws (common on memory-constrained mobile Safari), this catches the error
 * and renders nothing instead of letting it crash the whole React tree — which
 * is what surfaces as iOS Safari's "a problem repeatedly occurred" reload loop.
 */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.warn('NeuralCanvas subtree failed, hiding it:', error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
