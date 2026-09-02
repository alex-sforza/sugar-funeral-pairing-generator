/** Sugar Funeral Pairing Matcher v2 */
const DIMENSIONS = ['romance','passion','obsession','danger','tenderness','tragedy','chaos'];

function affinityForType(type, songTypes, affinity = {}) {
  let best = 0;
  let matched = null;
  for (const songType of songTypes) {
    const value = songType === type ? (affinity.exact ?? 50) : (affinity.related?.[type]?.[songType] ?? 0);
    if (value > best) { best = value; matched = songType; }
  }
  return { score: best, matched };
}

export function scoreSong(song, profile, answers = {}, affinity = {}) {
  const songTypes = song.pairing_types || [];
  const songThemes = new Set(song.themes || []);
  let semantic = 0;
  const reasons = [];

  for (const type of answers.pairing_types || []) {
    const hit = affinityForType(type, songTypes, affinity);
    semantic += hit.score;
    if (hit.score > 0) reasons.push(hit.score === (affinity.exact ?? 50) ? `точная динамика: ${type}` : `близкая динамика: ${hit.matched}`);
  }
  semantic = Math.min(50, semantic);

  let detail = 0;
  for (const theme of answers.themes || []) {
    if (songThemes.has(theme)) detail = Math.min(20, detail + 20);
  }
  if (detail) reasons.push('сюжетная деталь совпала');

  let emotional = 0;
  let matches = 0;
  for (const key of DIMENSIONS) {
    if (typeof answers[key] !== 'number' || typeof profile[key] !== 'number') continue;
    emotional += Math.max(0, 10 - Math.abs(answers[key] - profile[key]));
    matches++;
  }
  emotional = matches ? Math.min(30, emotional * (30 / (matches * 10))) : 0;
  if (matches) reasons.push('эмоциональный профиль сопоставлен');

  const score = semantic + detail + emotional;
  return { song, score: Number(score.toFixed(2)), breakdown: { semantic, detail, emotional }, reasons };
}

export function rankSongs(songs, profiles, answers = {}, affinity = {}) {
  const byTitle = new Map(profiles.map(p => [p.title, p]));
  return songs.map(song => {
    const profile = byTitle.get(song.title);
    return profile ? scoreSong(song, profile, answers, affinity) : null;
  }).filter(Boolean).sort((a,b) => b.score - a.score);
}

export function pickSong(songs, profiles, answers = {}, affinity = {}) {
  return rankSongs(songs, profiles, answers, affinity)[0] || null;
}
