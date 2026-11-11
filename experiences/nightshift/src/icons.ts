const paths: Record<string, string> = {
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  down: '<path d="M12 4v15M6 13l6 6 6-6"/>',
  up: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sound: '<path d="m4 10 4 0 5-4v12l-5-4H4zM17 9a5 5 0 0 1 0 6M20 6a9 9 0 0 1 0 12"/>',
  compare: '<path d="M12 3v18M8 7l-4 5 4 5M16 7l4 5-4 5"/>',
  window: '<path d="M5 3h14v18H5zM12 3v18M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
export const icon = (name: string, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
