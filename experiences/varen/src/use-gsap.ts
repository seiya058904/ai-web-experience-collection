import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import gsap from 'gsap';

// The supplied components use only scoped effects with cleanup on dependency change.
export function useGSAP(callback: () => void | (() => void), options: {
  scope: RefObject<HTMLElement | null>; dependencies?: DependencyList; revertOnUpdate?: boolean;
}) {
  useLayoutEffect(() => {
    const context = gsap.context(callback, options.scope.current ?? undefined);
    return () => context.revert();
  }, options.dependencies ?? []);
}
