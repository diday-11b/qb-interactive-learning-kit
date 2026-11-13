export function randomIndex(size, crypto = globalThis.crypto) {
  if (!Number.isSafeInteger(size) || size < 1 || size > 2 ** 32) throw new RangeError('Invalid group size');
  if (!crypto?.getRandomValues) return Math.floor(Math.random() * size);
  const limit = 2 ** 32 - (2 ** 32 % size);
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
  return sample[0] % size;
}

export function eligibleMembers(members, history, mode) {
  const winners = new Set(mode === 'unique' ? history.map(entry => entry.id) : []);
  return members.filter(member => !winners.has(member.id));
}

export function targetRotation(current, index, size) {
  const angle = 360 - (index + 0.5) * 360 / size;
  const remainder = ((angle - current) % 360 + 360) % 360;
  return current + 360 * 6 + remainder;
}
