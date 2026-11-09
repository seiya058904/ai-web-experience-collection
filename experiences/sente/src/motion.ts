import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { TRANSITIONS } from './story.ts';
import { softText, steppedIndex } from '../../shared/soft-swap.ts';

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Stateless local progress. Direct jumps and reverse scroll evaluate identically. */
export function boundaryProgress(top: number, height: number, viewport: number): number {
  return clamp((viewport - top) / (viewport + height));
}

export class StoryMotion {
  private lenis: Lenis | null = null;
  private frame = 0;
  private dirty = true;
  private preference: 'system' | 'reduced' | 'full';
  private media = matchMedia('(prefers-reduced-motion: reduce)');
  private transitions = [...document.querySelectorAll<HTMLElement>('[data-transition]')];
  private chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  private previousSteps = Array(9).fill(-1);
  private observer: ResizeObserver;

  constructor(preference: 'system' | 'reduced' | 'full') {
    this.preference = preference;
    this.observer = new ResizeObserver(() => { this.dirty = true; this.lenis?.resize(); });
    this.observer.observe(document.body);
    this.media.addEventListener('change', this.onPreference);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    window.addEventListener('popstate', this.onHistory);
    window.addEventListener('hashchange', this.onHistory);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('pageshow', this.onPageShow);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.configure();
    this.start();
    if (location.hash) requestAnimationFrame(() => this.navigate(location.hash, false, true));
  }

  private configure(): void {
    this.lenis?.destroy();
    this.lenis = null;
    const reduced = this.preference === 'reduced' || (this.preference === 'system' && this.media.matches);
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    if (!reduced) {
      this.lenis = new Lenis({ autoRaf: false, lerp: 0.15, smoothWheel: true, syncTouch: false, anchors: false, respectReducedMotion: false });
      this.lenis.on('scroll', this.onScroll);
    }
    this.dirty = true;
  }

  setPreference(preference: 'system' | 'reduced' | 'full'): void {
    this.preference = preference;
    this.configure();
  }

  private onPreference = (): void => { if (this.preference === 'system') this.configure(); };
  private onScroll = (): void => { this.dirty = true; };
  private onHistory = (): void => { this.navigate(location.hash || '#before', false, true); };
  private onPageHide = (): void => { cancelAnimationFrame(this.frame); this.frame = 0; };
  private onPageShow = (): void => { this.dirty = true; this.lenis?.resize(); this.start(); };
  private onVisibility = (): void => {
    if (document.hidden) this.onPageHide();
    else { this.lenis?.scrollTo(window.scrollY, { immediate: true }); this.onPageShow(); }
  };

  private start(): void {
    if (!this.frame && !document.hidden) this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (time: number): void => {
    this.lenis?.raf(time);
    if (this.dirty) this.evaluate();
    this.frame = requestAnimationFrame(this.tick);
  };

  private evaluate(): void {
    this.dirty = false;
    const height = window.innerHeight;
    const y = window.scrollY;
    const full = Math.max(1, document.documentElement.scrollHeight - height);
    document.getElementById('reading-progress')!.style.transform = `scaleX(${clamp(y / full)})`;
    document.getElementById('site-header')!.classList.toggle('scrolled', y > 45);
    let active = '1';
    for (const chapter of this.chapters) {
      if (chapter.getBoundingClientRect().top < height * 0.5) active = chapter.dataset.chapter!;
    }
    document.documentElement.dataset.chapter = active;
    for (let i = 0; i < this.transitions.length; i++) {
      const element = this.transitions[i];
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -height || rect.top > height * 2) continue;
      const p = boundaryProgress(rect.top, rect.height, height);
      element.style.setProperty('--p', String(p));
      element.dataset.progress = p.toFixed(4);
      const previous = this.previousSteps[i];
      const step = Math.min(4, Math.max(0, steppedIndex(p * 4, previous < 0 ? undefined : previous)));
      if (step !== previous) {
        this.previousSteps[i] = step;
        // The step words fade out and in; a dead band keeps a resting reader on one step.
        softText(document.getElementById(`tr-${i + 1}-step`), TRANSITIONS[i].steps[step], { instant: previous < 0 || document.documentElement.dataset.motion === 'reduced' });
        element.querySelectorAll('.step-marks i').forEach((mark, j) => mark.classList.toggle('is-active', j === step));
      }
    }
  }

  navigate(hash: string, push = true, immediate = false): void {
    if (!/^#[a-z0-9-]+$/.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    const offset = hash === '#before' ? 0 : -88;
    if (this.lenis) this.lenis.scrollTo(target, { offset, immediate, duration: 0.8 });
    else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY + offset), behavior: 'instant' });
    if (push) {
      const focusTarget = target.querySelector<HTMLElement>('h1,h2') ?? target;
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
    this.dirty = true;
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lenis?.destroy();
    this.observer.disconnect();
    this.media.removeEventListener('change', this.onPreference);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    window.removeEventListener('popstate', this.onHistory);
    window.removeEventListener('hashchange', this.onHistory);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('pageshow', this.onPageShow);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}
