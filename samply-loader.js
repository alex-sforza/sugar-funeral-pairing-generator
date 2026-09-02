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
      if(text.includes('10 случайных вариантов')) btn.style.display = 'none';
    });
  }

  function clearForm(){
    document.querySelectorAll('.choice.selected').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('input, textarea').forEach(el => {
      if(!el.matches('[type="button"],[type="submit"],[type="reset"]')) el.value = '';
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

  /* Расширенный фандомный слой. В каждой эстетике остаются 2 отзыва о героях + 1 о песне. */
  window.reviewTexts = function(p, top){
    const a=p.p1, b=p.p2;
    const r1=[
      `${a} может сколько угодно делать вид, что ${b} его/её раздражает, но стоит ${b} исчезнуть — всё, маска слетает.`,
      `${a} явно знает про ${b} больше, чем готов(а) признать. Это уже не «случайная забота».`,
      `У ${a} абсолютно подозрительная суперсила: замечать настроение ${b} раньше всех остальных.`,
      p.firstThought1 ? `Первое впечатление «${p.firstThought1}» было явно ложной тревогой, потому что теперь ${a} слишком много чувствует рядом с ${b}.` : `Мне особенно нравится, что ${a} явно воспринимал(а) ${b} совсем иначе в начале этой истории.`,
      p.loss1 ? `После того, как ${a} боится лишиться «${p.loss1}», я вообще не верю, что он/она способен(на) относиться к ${b} как к чему-то временному.` : `${a} может отрицать чувства сколько угодно, но рядом с ${b} всё становится подозрительно серьёзным.`,
      `${a} — это тот человек, который первым скажет «всё нормально», а через минуту уже будет выяснять, почему ${b} молчит.`,
      `Я обожаю, как ${a} пытается рационализировать всё, что происходит с ${b}. Спойлер: не получается.`,
      `${a} слишком хорошо умеет читать ${b}. И меня совершенно не интересует, как именно они дошли до этой степени взаимной осведомлённости.`,
      `Мне кто-нибудь объяснит, почему ${a} ведёт себя рядом с ${b} так, будто это единственный человек, чьё мнение действительно имеет значение?`,
      `Самое подозрительное в ${a} — то, как быстро «мне всё равно» превращается в «где ${b}?».`,
      `Если ${a} ещё раз скажет, что просто помогает ${b}, я начну считать это официальным признанием.`,
      `У ${a} очень странная форма заботы: сначала спорить, потом спасать, потом снова спорить. Я всё поняла.`
    ];
    const r2=[
      `${b} выглядит как человек, который никогда не признается первым. И именно поэтому я жду тот самый момент, когда он/она сломается.`,
      `Мне нравится, что ${b} рядом с ${a} становится совсем другим человеком — даже если оба делают вид, что этого не происходит.`,
      `${b} может отрицать что угодно, но вот это «мне всё равно» рядом с ${a} уже никого не обманет.`,
      p.firstThought2 ? `Ирония в том, что первое впечатление «${p.firstThought2}» теперь звучит как начало очень плохой идеи. Я за.` : `${b} явно не рассчитывал(а), что эта история зайдёт настолько далеко.`,
      p.loss2 ? `После признания про «${p.loss2}» я теперь смотрю на каждую сцену с ${a} совсем иначе.` : `${b} рядом с ${a} слишком явно перестаёт быть тем человеком, которым привык(ла) казаться.`,
      `${b} может сколько угодно изображать спокойствие, но рядом с ${a} эта стратегия разваливается буквально по швам.`,
      `Мне нравится, что ${b} замечает всё, что делает ${a}, даже когда делает вид, что вообще не смотрит.`,
      `${b} явно уже выбрал(а) ${a}, просто пока не сообщил(а) об этом самому/самой себе.`,
      `Вот этот взгляд ${b} в сторону ${a}? Это не дружба. Я отказываюсь это обсуждать.`,
      `Если ${b} ещё раз скажет «это ничего не значит», пожалуйста, кто-нибудь напомните ему/ей, что мы всё видели.`,
      `${b} рядом с ${a} слишком быстро забывает собственные правила. И это, пожалуй, самая интересная часть всей истории.`,
      `Я пришла посмотреть на ${b}, а в итоге получила полноценную драму о том, как один человек делает вид, что ему всё равно.`
    ];
    const r3=[
      `Эта песня настолько попала в ${a} × ${b}, что теперь я слышу их в каждом припеве. Особенно вот это настроение: ${top.title}.`,
      `Кто вообще разрешил этой песне настолько точно описать ${a} × ${b}? Я пришла послушать трек и осталась страдать по пейрингу.`,
      `Я не знаю, что сильнее — химия ${a} × ${b} или то, насколько идеально им подходит ${top.title}.`,
      `Вот эта песня буквально звучит как их отношения: ${p.songEnding || 'финал'} и ни капли шансов остаться эмоционально невредимой.`,
      `Я включила ${top.title} один раз и теперь почему-то знаю слишком много о личной жизни ${a} и ${b}.`,
      `${top.title} — это не просто песня для них. Это уже официальная причина, по которой я снова пересматриваю все их сцены.`,
      `Мне кажется, ${top.title} каким-то образом знает про ${a} и ${b} больше, чем они сами.`,
      `Вот теперь попробуйте убедить меня, что ${top.title} случайно настолько идеально попала именно в эту пару. Не получится.`
    ];
    const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
    return [pick(r1),pick(r2),pick(r3)];
  };

  /* Большой пул канонных желаний. Первое место всегда получает тематически подходящее желание, если оно есть. */
  window.wishPool = function(p,type){
    const a=p.p1,b=p.p2,sc=p.scenes||[],dyn=p.dyn||[];
    const pool=[];

    if(dyn.includes('slow-burn')||dyn.includes('friends-to-lovers')||sc.includes('пусть наконец перестанут тормозить'))
      pool.push(`А давайте ${a} и ${b} наконец перестанут тормозить и сделают то, что весь фандом уже понял.`);
    if(dyn.includes('hurt-comfort')||sc.includes('уход за раненым')||sc.includes('один защищает другого'))
      pool.push(`А давайте ${a} впервые позволит ${b} увидеть себя слабым — и ${b} не испугается, а останется.`);
    if(dyn.includes('protective-romance'))
      pool.push(`А давайте в тот момент, когда ${b} окажется в опасности, ${a} забудет обо всех правилах и просто пойдёт за ним/ней.`);
    if(dyn.includes('partners-in-crime'))
      pool.push(`А давайте они совершат ещё одну ужасно хорошую идею — только теперь официально вместе.`);
    if(dyn.includes('doomed-romance')||dyn.includes('forbidden-attraction'))
      pool.push(`А давайте им дадут хотя бы одну ночь без правил, прежде чем судьба снова напомнит, почему им нельзя быть вместе.`);
    if(dyn.includes('toxic-attraction')||dyn.includes('mutual-obsession'))
      pool.push(`А давайте они наконец признают, что уже давно не умеют нормально жить друг без друга.`);
    if(dyn.includes('enemies-to-lovers'))
      pool.push(`А давайте после очередной ссоры один из них первым перестанет драться и просто скажет: «Останься».`);
    if(dyn.includes('secret-relationship'))
      pool.push(`А давайте кто-нибудь почти поймает их — и им придётся решить, готовы ли они больше не скрываться.`);
    if(dyn.includes('opposites-attract'))
      pool.push(`А давайте они впервые выберут друг друга вслух — несмотря на все различия.`);
    if(dyn.includes('complicated-friendship'))
      pool.push(`А давайте кто-нибудь наконец задаст им прямой вопрос: «Так вы встречаетесь или нет?»`);
    if(dyn.includes('mutual-pining'))
      pool.push(`А давайте один из них наконец поймёт, что второй всё это время ждал именно этих слов.`);

    const generic=[
      `А давайте их запрут в одном месте на ночь. Желательно без свидетелей и без возможности сбежать от разговора.`,
      `А давайте будет тот самый ночной разговор, после которого ни один из них уже не сможет вернуться к прежнему «мы просто друзья».`,
      `А давайте один из них приревнует настолько нелепо, что весь фандом одновременно закроет лицо руками.`,
      `А давайте один из них действительно соберётся уйти — и второй впервые не позволит ему/ей.`,
      `А давайте они поссорятся так сильно, что впервые скажут друг другу именно то, чего боялись сказать всё это время.`,
      `А давайте один из них случайно услышит, что второй говорит о нём/ней, когда думает, что его/её никто не слышит.`,
      `А давайте один из них заболеет или получит травму, и второй слишком быстро забудет, что вообще-то собирался держать дистанцию.`,
      `А давайте они останутся вдвоём после какого-нибудь события, когда весь ад уже закончился, и впервые просто помолчат рядом.`,
      `А давайте один из них скажет «я тебе доверяю» — и второй поймёт, насколько много на самом деле значат эти слова.`,
      `А давайте они случайно заснут рядом, а утром оба будут делать вид, что это совершенно ничего не значит.`,
      `А давайте один из них впервые увидит второго действительно испуганным — и поймёт, насколько сильно тот/та переживает.`,
      `А давайте им придётся сделать вид, что они пара, и весь фандом получит тот самый спектакль, который давно заслужил.`,
      `А давайте один из них впервые позволит второму увидеть свою настоящую слабость — без шуток, масок и попыток всё контролировать.`,
      `А давайте после особенно тяжёлого дня один просто молча останется рядом. Без советов. Без вопросов. Просто останется.`,
      `А давайте один из них впервые скажет: «Мне страшно тебя потерять», — и второй не станет делать вид, что не услышал.`,
      `А давайте они попробуют провести совершенно обычный вечер и поймут, что именно эта бытовая близость пугает их сильнее всего.`,
      `А давайте кто-нибудь со стороны наконец заметит очевидное и скажет им это в лицо.`,
      `А давайте один из них получит шанс уйти от этой истории — и добровольно вернётся к другому.`
    ];

    while(pool.length<8){
      const x=generic[Math.floor(Math.random()*generic.length)];
      if(!pool.includes(x)) pool.push(x);
    }
    return pool.sort(()=>Math.random()-.5).slice(0,4);
  };

  function upgrade(root=document){
    hideTestControls(root);
    patchResultNames(root);
    if(!ready) return;
    const candidates=[...root.querySelectorAll('.songbox, .result, .aesthetic')];
    candidates.forEach(box=>{
      const heading=box.querySelector('.songbox h3');
      if(!heading) return;
      const track=findTrack(heading.textContent);
      if(!track || !track.embed) return;
      const player=box.querySelector('.player');
      if(player){
        let iframe=player.querySelector('iframe');
        if(!iframe){
          iframe=document.createElement('iframe');
          iframe.setAttribute('frameborder','0');
          iframe.setAttribute('allowtransparency','true');
          iframe.style.cssText='width:100%;border-radius:16px;border:1px solid rgba(255,255,255,.12);min-height:150px';
          player.replaceChildren(iframe);
        }
        if(iframe.src!==track.embed) iframe.src=track.embed;
      }
      const link=box.querySelector('.open-song');
      if(link){
        link.href=track.page||track.url||'#';
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.textContent='Открыть песню на Samply ↗';
      }
    });
  }

  function patchExportedForumHtml(){
    const box=document.getElementById('htmlCode');
    if(!box || !ready || !box.value) return;
    const titleMatch=box.value.match(/ИХ ПЕСНЯ<\/div><h3[^>]*>([\s\S]*?)<\/h3>/i);
    if(!titleMatch) return;
    const title=titleMatch[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
    const track=findTrack(title);
    if(!track || !track.embed) return;
    const iframe=`<iframe src="${track.embed}" frameborder="0" allowtransparency="true" style="width:100%;border-radius:16px;border:1px solid rgba(255,255,255,0.12);min-height:150px"></iframe>`;
    const noticeRe=/<div style="[^>]*">Samply-плеер для этой песни пока не подключён\.<\/div>/i;
    if(noticeRe.test(box.value)) box.value=box.value.replace(noticeRe,iframe);
  }

  prepareCleanStart();

  fetch(DB_URL,{cache:'no-store'})
    .then(r=>{if(!r.ok) throw new Error('Samply database: '+r.status);return r.json();})
    .then(db=>{
      if(Array.isArray(db)) tracks=db;
      else if(db && db.tracks && typeof db.tracks==='object') tracks=Object.entries(db.tracks).map(([title,data])=>({title,...data}));
      else tracks=[];
      ready=true;
      upgrade();
      const observer=new MutationObserver(()=>upgrade());
      observer.observe(document.body,{childList:true,subtree:true});
      window.SugarFuneralSamply={tracks,findTrack,upgrade};
    })
    .catch(err=>console.warn('[Sugar Funeral] Samply database unavailable:',err));

  document.addEventListener('click',event=>{
    const btn=event.target.closest && event.target.closest('#exportHtml');
    if(btn) setTimeout(patchExportedForumHtml,0);
  });
})();
