export function getInitials(name: string) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map(word => word[0].toUpperCase())
    .join('');
}

export function capitalizeFirstLetter(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}