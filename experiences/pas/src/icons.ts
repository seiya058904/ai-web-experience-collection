const paths: Record<string, string> = {
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  down: '<path d="M12 3v17m-5-5 5 5 5-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  sound: '<path d="M4 10v4h4l5 4V6l-5 4ZM17 8c3 2 3 6 0 8M20 5c5 4 5 10 0 14"/>',
  mute: '<path d="M4 10v4h4l5 4V6l-5 4ZM17 9l5 6m0-6-5 6"/>',
  back: '<path d="M20 12H5m5-5-5 5 5 5"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/>',
};
export const icon = (name: string, className = '') => `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.arrow}</svg>`;
