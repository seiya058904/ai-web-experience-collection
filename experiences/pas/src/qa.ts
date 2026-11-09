const review = document.querySelector<HTMLIFrameElement>('#review-frame')!;
const width = document.querySelector<HTMLInputElement>('#width')!;
const height = document.querySelector<HTMLInputElement>('#height')!;
const moment = document.querySelector<HTMLInputElement>('#moment')!;
const fault = document.querySelector<HTMLSelectElement>('#fault')!;
const resize = () => { review.style.width = `${Number(width.value)}px`; review.style.height = `${Number(height.value)}px`; };
document.querySelector('#resize')!.addEventListener('click', resize);
document.querySelector<HTMLSelectElement>('#preset')!.addEventListener('change', event => { const [w, h] = (event.target as HTMLSelectElement).value.split('x'); width.value = w; height.value = h; resize(); });
document.querySelector('#seek')!.addEventListener('click', () => review.contentWindow?.postMessage({ type: 'pas-qa-seek', t: Number(moment.value) }, location.origin));
document.querySelector('#reload')!.addEventListener('click', () => { review.src = `./?qa=1${fault.value ? `&fault=${fault.value}` : ''}`; });
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== review.contentWindow || event.data?.type !== 'pas-qa-status') return;
  document.querySelector('#status')!.textContent = event.data.text;
});
export {};
