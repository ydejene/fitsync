export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function getRequiredFieldMessage(label: string): string {
  return `${label} is required.`;
}
