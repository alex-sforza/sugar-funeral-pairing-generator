/**
 * Sugar Funeral Pairing Generator — song matcher
 *
 * Input: questionnaire answers already normalized into relationship tags.
 * Output: ranked Sugar Funeral songs.
 *
 * The matcher deliberately separates:
 *   1. hard relationship archetypes;
 *   2. supporting themes;
 *   3. emotional intensity.
 *
 * This keeps one incidental answer from overpowering the actual relationship.
 */

const DEFAULT_WEIGHTS = {
  pairingType: 8,
  theme: 3,
  intensity: 1,
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ё]/g, "е");
}

function toSet(values) {
  return new Set((Array.isArray(values) ? values : [values]).filter(Boolean).map(normalize));
}

function intersectionSize(a, b) {
  let count = 0;
  for (const item of a) if (b.has(item)) count++;
  return count;
}

/**
 * profile example:
 * {
 *   pairingTypes: ["enemies-to-lovers", "rivals-to-lovers"],
 *   themes: ["jealousy", "danger", "tension"],
 *   intensity: { romance: 8, passion: 7, obsession: 4, danger: 6, tenderness: 3, tragedy: 2, chaos: 5 }
 * }
 *
 * song example:
 * {
 *   title, album, pairing_types, themes,
 *   scores: { romance, passion, obsession, danger, tenderness, tragedy, chaos }
 * }
 */
export function scoreSong(profile, song, weights = DEFAULT_WEIGHTS) {
  const wantedTypes = toSet(profile.pairingTypes);
  const wantedThemes = toSet(profile.themes);
  const songTypes = toSet(song.pairing_types);
  const songThemes = toSet(song.themes);

  const typeMatches = intersectionSize(wantedTypes, songTypes);
  const themeMatches = intersectionSize(wantedThemes, songThemes);

  let score =
    typeMatches * weights.pairingType +
    themeMatches * weights.theme;

  if (profile.intensity && song.scores) {
    for (const [axis, wanted] of Object.entries(profile.intensity)) {
      const actual = Number(song.scores[axis]);
      if (!Number.isFinite(actual)) continue;
      const distance = Math.abs(Number(wanted) - actual);
      score += Math.max(0, 10 - distance) * weights.intensity * 0.1;
    }
  }

  return {
    ...song,
    score: Number(score.toFixed(3)),
    matches: {
      pairingTypes: [...wantedTypes].filter((x) => songTypes.has(x)),
      themes: [...wantedThemes].filter((x) => songThemes.has(x)),
    },
  };
}

export function rankSongs(profile, songs, options = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const limit = options.limit || 10;

  return songs
    .map((song) => scoreSong(profile, song, weights))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function pickWinner(profile, songs, options = {}) {
  return rankSongs(profile, songs, { ...options, limit: 1 })[0] || null;
}

export default { scoreSong, rankSongs, pickWinner };
