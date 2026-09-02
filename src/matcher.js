/** Sugar Funeral Pairing Matcher */
export function scoreSong(song, profile, answers = {}) {
  const songTypes = new Set(song.pairing_types || []);
  const songThemes = new Set(song.themes || []);
  let score = 0;
  const reasons = [];
  for (const type of answers.pairing_types || []) {
    if (songTypes.has(type)) { score += 30; reasons.push(`совпадает динамика: ${type}`); }
  }
  for (const theme of answers.themes || []) {
    if (songThemes.has(theme)) { score += 10; reasons.push(`совпадает тема: ${theme}`); }
  }
  const dimensions = ['romance','passion','obsession','danger','tenderness','tragedy','chaos'];
  let matches = 0;
  for (const key of dimensions) {
    if (typeof answers[key] !== 'number' || typeof profile[key] !== 'number') continue;
    const distance = Math.abs(answers[key] - profile[key]);
    score += Math.max(0, 10 - distance) * 1.5;
    matches++;
  }
  if (matches) reasons.push('эмоциональный профиль совпадает');
  return { song, score: Number(score.toFixed(2)), reasons };
}

export function rankSongs(songs, profiles, answers = {}) {
  const byTitle = new Map(profiles.map(p => [p.title, p]));
  return songs.map(song => {
    const profile = byTitle.get(song.title);
    return profile ? scoreSong(song, profile, answers) : null;
  }).filter(Boolean).sort((a,b) => b.score - a.score);
}

export function pickSong(songs, profiles, answers = {}) {
  return rankSongs(songs, profiles, answers)[0] || null;
}
