/* Sugar Funeral — Samply loader
   Loads the complete track -> Samply map and upgrades the player after each generation.
   Production cleanup: hides the temporary 10-random test control and starts with a clean form.
*/
(function(){
  'use strict';
  const DB_URL = './data/samply-links.json';
  let tracks = [];
  let ready = false;

  function hideTestControls(root=document){
    const legacy = document.getElementById('random10');
    if(legacy) legacy.style.display = 'none';

    root.querySelectorAll('button').forEach(btn => {
      const text = String(btn.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      if(text.includes('10 случайных вариантов')){
        btn.style.display = 'none';
      }
    });
  }

  function clearForm(){
    document.querySelectorAll('.choice.selected').forEach(btn => btn.classList.remove('selected'));

    document.querySelectorAll('input, textarea').forEach(el => {
      if(!el.matches('[type="button"],[type="submit"],[type="reset"]')){
        el.value = '';
      }
    });

    document.querySelectorAll('select').forEach(select => {
      if(select.options.length) select.selectedIndex = 0;
    });
  }

  function clearGeneratedResults(){
    const results = document.getElementById('results');
    if(results) results.innerHTML = '';
  }

  function prepareCleanStart(){
    hideTestControls();
    clearForm();
    clearGeneratedResults();
  }

  function normalize(s){
    return String(s || '').toLowerCase().replace(/[–—−]/g,'-').replace(/\s+/g,' ').trim();
  }

  function findTrack(title){
    const key = normalize(title);
    return tracks.find(t => normalize(t.title) === key) ||
           tracks.find(t => key && (normalize(t.title).includes(key) || key.includes(normalize(t.title))));
  }

  function patchResultNames(root=document){
    const results = root.querySelector('#results');
    if(!results) return;

    const name1 = String(document.getElementById('name1')?.value || '').trim();
    const name2 = String(document.getElementById('name2')?.value || '').trim();
    if(!name1 && !name2) return;

    const walker = document.createTreeWalker(results, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      let text = textNode.nodeValue;
      if(name1) text = text.replace(/Первое впечатление\s*№1/g, `Первое впечатление ${name1}`);
      if(name2) text = text.replace(/Первое впечатление\s*№2/g, `Первое впечатление ${name2}`);
      if(text !== textNode.nodeValue) textNode.nodeValue = text;
    });
  }

  function upgrade(root=document){
    hideTestControls(root);
    patchResultNames(root);
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

  function patchExportedForumHtml(){
    const box = document.getElementById('htmlCode');
    if(!box || !ready || !box.value) return;

    const titleMatch = box.value.match(/ИХ ПЕСНЯ<\/div><h3[^>]*>([\s\S]*?)<\/h3>/i);
    if(!titleMatch) return;

    const title = titleMatch[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
    const track = findTrack(title);
    if(!track || !track.embed) return;

    const iframe = `<iframe src="${track.embed}" frameborder="0" allowtransparency="true" style="width:100%;border-radius:16px;border:1px solid rgba(255,255,255,0.12);min-height:150px"></iframe>`;
    const noticeRe = /<div style="[^>]*">Samply-плеер для этой песни пока не подключён\.<\/div>/i;
    if(noticeRe.test(box.value)){
      box.value = box.value.replace(noticeRe, iframe);
    }
  }

  prepareCleanStart();

  fetch(DB_URL, {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error('Samply database: '+r.status); return r.json(); })
    .then(db => {
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

  document.addEventListener('click', event => {
    const btn = event.target.closest && event.target.closest('#exportHtml');
    if(btn){
      setTimeout(patchExportedForumHtml, 0);
    }
  });
})();
