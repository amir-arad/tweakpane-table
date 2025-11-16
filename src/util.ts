/**
 * Apply width styling to an element using flex-basis
 * @param element - The HTML element to apply width to
 * @param width - The width value (e.g., "100px", "50%", "10em")
 */
export function applyWidth(element: HTMLElement, width: string | undefined): void {
	if (width && width.trim()) {
		element.style.flex = `0 0 ${width}`;
	}
}
