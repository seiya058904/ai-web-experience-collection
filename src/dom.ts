export function $<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Required page element is missing: ${selector}`);
  return node;
}
export function $$<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function rangeFill(input: HTMLInputElement) {
  input.style.setProperty(
    "--range",
    `${((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100}%`,
  );
}

/** Regular toggle groups remain ordinary buttons; the actual tablist uses roving focus. */
export function setPressed(group: string, active: HTMLElement) {
  $$(group).forEach((button) =>
    button.setAttribute("aria-pressed", String(button === active)),
  );
}
