export function maskPan(pan: string): string {
  const digits = pan.replace(/\D/g, '');
  if (digits.length < 10) return '****';
  return digits.slice(0, 4) + '*'.repeat(digits.length - 8) + digits.slice(-4);
}
