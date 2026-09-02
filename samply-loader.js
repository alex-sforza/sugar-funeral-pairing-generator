/* Sugar Funeral — Samply loader
   Loads the complete track -> Samply map and upgrades the player after each generation.
*/
(function(){
  'use strict';
  const DB_URL = './data/samply-links.json';
  let tracks = [];
  let ready = false;

  function normalize(s){
    return String(s || '').toLowerCase().replace(/[–—−]/g,'-').replace(/\s+/g,' ').trim();
  }

  function findTrack(title){
    const key = normalize(title);
    return tracks.find(t => normalize(t.title) === key) ||
           tracks.find(t => key && (normalize(t.title).includes(key) || key.includes(normalize(t.title))));
  }

  function upgrade(root=document){
    if(!ready) return;
    const candidates = [...root.querySelectorAll('.songbox, .result, .aesthetic')];
    candidates.forEach(box => {
      const heading = box.querySelector('.songbox h3');
      if(!heading) return;
      const track = findTrack(heading.textContent);
      if(!track || !track.embed) return;

      const player = box.querySelector('.player');
      if(player){
        let iframe = player.querySelector('iframe');
        if(!iframe){
          iframe = document.createElement('iframe');
          iframe.setAttribute('frameborder','0');
          iframe.setAttribute('allowtransparency','true');
          iframe.style.cssText='width:100%;border-radius:16px;border:1px solid rgba(255,255,255,.12);min-height:150px';
          player.replaceChildren(iframe);
        }
        if(iframe.src !== track.embed) iframe.src = track.embed;
      }

      const link = box.querySelector('.open-song');
      if(link){
        link.href = track.page || track.url || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Открыть песню на Samply ↗';
      }
    });
  }

  fetch(DB_URL, {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error('Samply database: '+r.status); return r.json(); })
    .then(db => {
      // The database stores tracks as an object keyed by song title.
      // Convert it to the array expected by findTrack(), preserving the title.
      if(Array.isArray(db)){
        tracks = db;
      }else if(db && db.tracks && typeof db.tracks === 'object'){
        tracks = Object.entries(db.tracks).map(([title, data]) => ({title, ...data}));
      }else{
        tracks = [];
      }
      ready = true;
      upgrade();
      const observer = new MutationObserver(() => upgrade());
      observer.observe(document.body, {childList:true, subtree:true});
      window.SugarFuneralSamply = {tracks, findTrack, upgrade};
    })
    .catch(err => console.warn('[Sugar Funeral] Samply database unavailable:', err));
})();
