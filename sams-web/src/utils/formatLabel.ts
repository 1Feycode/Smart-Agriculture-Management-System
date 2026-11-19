export function formatLabel(value: string): string {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]/g, ' '))
    .map((segment) => segment.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(' / ')
}
