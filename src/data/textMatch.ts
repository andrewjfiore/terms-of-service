export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Anchored title equality: identical slugs, or one slug is a prefix of the
// other (e.g. "Hades" -> "Hades II"). Deliberately not a free substring match,
// which would mis-pair unrelated titles that merely share a word.
export function titlesMatch(a: string, b: string): boolean {
  const x = slug(a);
  const y = slug(b);
  return x === y || x.startsWith(y) || y.startsWith(x);
}
