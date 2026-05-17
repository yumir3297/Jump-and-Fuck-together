function hash(seed) {
  let value = seed >>> 0;
  value = (value ^ 61) ^ (value >>> 16);
  value += value << 3;
  value ^= value >>> 4;
  value *= 0x27d4eb2d;
  value ^= value >>> 15;
  return value >>> 0;
}

function deterministicFloat(seed) {
  return hash(seed) / 0xffffffff;
}

function deterministicRange(seed, min, max) {
  return min + (max - min) * deterministicFloat(seed);
}

function pickOne(seed, list) {
  if (!list.length) {
    return null;
  }
  const index = Math.floor(deterministicFloat(seed) * list.length) % list.length;
  return list[index];
}

module.exports = {
  deterministicFloat,
  deterministicRange,
  pickOne
};
