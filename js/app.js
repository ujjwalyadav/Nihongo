const DATA = window.N5_DATA;
const state = { view:'dashboard', filter:'', cat:'All', mode:'vocab', flashIndex:0, reveal:false, quiz:null, selectedKana:'あ', kanaMemory:false, kanaShowRomaji:true, kanaRevealed:true, kanaGuide:true, audioMode:load('audioMode','webspeech'), audioProvider:load('audioProvider','auto'), voiceURI:load('voiceURI','') };
const KANA_ROMAJI = {"あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"shi","す":"su","せ":"se","そ":"so","た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho","ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","を":"wo","ん":"n","ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n","が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do","ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po","ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo","ダ":"da","ヂ":"ji","ヅ":"zu","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo","パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho","ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo","ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo","りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo","じゃ":"ja","じゅ":"ju","じょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo","ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo","キャ":"kya","キュ":"kyu","キョ":"kyo","シャ":"sha","シュ":"shu","ショ":"sho","チャ":"cha","チュ":"chu","チョ":"cho","ニャ":"nya","ニュ":"nyu","ニョ":"nyo","ヒャ":"hya","ヒュ":"hyu","ヒョ":"hyo","ミャ":"mya","ミュ":"myu","ミョ":"myo","リャ":"rya","リュ":"ryu","リョ":"ryo","ギャ":"gya","ギュ":"gyu","ギョ":"gyo","ジャ":"ja","ジュ":"ju","ジョ":"jo","ビャ":"bya","ビュ":"byu","ビョ":"byo","ピャ":"pya","ピュ":"pyu","ピョ":"pyo","っ":"small tsu","ッ":"small tsu","ー":"long vowel"};
const navItems = [
  ['dashboard','🏠','Dashboard'],['mission','⚡','Today: 60 min'],['plan','🗓️','12-week plan'],['kana','かな','Kana + writing'],['vocab','📚','Vocabulary'],['kanji','字','Kanji'],['grammar','文','Grammar'],['flash','🃏','Flashcards'],['quiz','✅','Quizzes'],['reading','📖','Reading'],['listening','🎧','Listening + speaking'],['resources','🧭','Resource map'],['mock','⏱️','Mock exam'],['progress','📈','Progress']
];
const $ = sel => document.querySelector(sel);
function save(key,val){ localStorage.setItem('n5_'+key, JSON.stringify(val)); updateProgress(); }
function load(key,def){ try{ return JSON.parse(localStorage.getItem('n5_'+key)) ?? def; }catch(e){ return def; } }
function mastered(){ return load('mastered', {}); }
function hard(){ return load('hard', {}); }
function stats(){ return load('stats', {correct:0,total:0,history:[]}); }
function setView(v){ state.view=v; state.reveal=false; render(); document.getElementById('side').classList.remove('open'); }
let jpVoice=null;
let allVoices=[];
let onlineAudio=null;
function refreshVoices(){
  if(!('speechSynthesis' in window)) return [];
  allVoices = speechSynthesis.getVoices() || [];
  jpVoice = allVoices.find(v=>v.voiceURI===state.voiceURI) || allVoices.find(v=>/ja-JP|Japanese|日本/i.test((v.lang||'')+' '+(v.name||''))) || allVoices.find(v=>/^ja/i.test(v.lang||'')) || allVoices[0] || null;
  return allVoices;
}
if('speechSynthesis' in window){
  refreshVoices();
  speechSynthesis.onvoiceschanged = ()=>{ refreshVoices(); const s=document.getElementById('voiceSelect'); if(s && !s.dataset.filled){ render(); } };
}
function audioMessage(msg, bad=false, good=false){
  const el=document.getElementById('audioStatus');
  if(el){ el.textContent=msg; el.className = bad ? 'audio-status danger' : good ? 'audio-status good' : 'audio-status'; }
  if(bad) toast(msg);
}
function setAudioMode(mode){ state.audioMode=mode; save('audioMode',mode); render(); audioMessage(mode==='online'?'Online audio mode selected. Internet required.':'Browser speech mode selected. Japanese system voice recommended.', false, true); }
function setVoice(uri){ state.voiceURI=decodeURIComponent(uri||''); save('voiceURI', state.voiceURI); refreshVoices(); audioMessage(jpVoice?`Voice selected: ${jpVoice.name} (${jpVoice.lang||'unknown language'})`:'Voice selection cleared.'); }
function setAudioProvider(provider){ state.audioProvider=provider||'auto'; save('audioProvider', state.audioProvider); audioMessage('Online audio provider set to '+state.audioProvider+'.', false, true); }
function onlineTtsUrls(text){
  // GitHub Pages / hosted sites can be blocked by some free TTS endpoints. Try several audio sources in sequence.
  const q = encodeURIComponent(String(text||'').trim()).slice(0,260);
  const providers = {
    googleapis: {
      label:'Google APIs TTS',
      url:'https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ja&dt=t&q=' + q
    },
    google: {
      label:'Google Translate TTS',
      url:'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=' + q
    },
    streamelements: {
      label:'StreamElements / Polly voice',
      url:'https://api.streamelements.com/kappa/v2/speech?voice=Mizuki&text=' + q
    }
  };
  const order = state.audioProvider && state.audioProvider !== 'auto' ? [state.audioProvider] : ['googleapis','streamelements','google'];
  return order.map(id=>({id, ...providers[id]})).filter(x=>x && x.url);
}
function onlineTtsUrl(text){
  const urls = onlineTtsUrls(text);
  return urls[0] ? urls[0].url : '';
}
function playOnlineTTS(text, rate=.82){
  text=String(text||'').trim();
  if(!text) return audioMessage('No Japanese text is selected yet.', true);
  const urls = onlineTtsUrls(text);
  if(!urls.length) return audioMessage('No online audio provider is configured.', true);
  try{
    if('speechSynthesis' in window) speechSynthesis.cancel();
    if(onlineAudio){ onlineAudio.pause(); onlineAudio.removeAttribute('src'); try{ onlineAudio.load(); }catch(_){} }
    let idx=0;
    const tryProvider = (why)=>{
      if(idx >= urls.length){
        const reason = why ? ' Last error: '+why : '';
        audioMessage('All online audio providers failed on this hosted page.'+reason+' This usually means the free TTS source blocked embedding/hotlinking. Use Browser speech, Open audio link, or host real MP3 files with the app.', true);
        return;
      }
      const provider = urls[idx++];
      onlineAudio = new Audio();
      onlineAudio.preload='auto';
      onlineAudio.volume=1;
      onlineAudio.playbackRate = Number(rate)<.85 ? .72 : 1;
      onlineAudio.playsInline = true;
      onlineAudio.onplaying=()=>audioMessage('Playing online Japanese audio via '+provider.label+'…', false, true);
      onlineAudio.onended=()=>audioMessage('Audio ready • online provider: '+provider.label+'.');
      onlineAudio.onerror=()=>tryProvider(provider.label+' could not load.');
      onlineAudio.src = provider.url;
      const playPromise = onlineAudio.play();
      if(playPromise && playPromise.catch){
        playPromise.catch(err=>{
          const msg = (err && err.message) ? err.message : String(err||'unknown error');
          if(/not supported|supported source|load|network|decode/i.test(msg)) tryProvider(msg);
          else audioMessage('Online audio was blocked: '+msg+'. Click Test audio or the Play button again after interacting with the page.', true);
        });
      }
    };
    tryProvider();
  }catch(err){ audioMessage('Online audio error: '+(err.message||err), true); }
}
function playBrowserSpeech(text, rate=.82){
  text = String(text||'').trim();
  if(!text) return audioMessage('No Japanese text is selected yet.', true);
  if(!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance==='undefined') return audioMessage('Speech synthesis is not available in this browser. Use Online TTS mode or try Chrome, Edge, or Safari.', true);
  try{
    refreshVoices();
    speechSynthesis.cancel();
    if(speechSynthesis.paused) speechSynthesis.resume();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='ja-JP'; u.rate=Number(rate)||.82; u.pitch=1; u.volume=1;
    if(jpVoice) u.voice=jpVoice;
    let started=false;
    u.onstart=()=>{ started=true; audioMessage(jpVoice?`Playing with ${jpVoice.name}…`:'Playing with browser default voice…', false, true); };
    u.onend=()=>audioMessage(jpVoice ? `Audio ready • voice: ${jpVoice.name} (${jpVoice.lang||'unknown language'})` : 'Audio ready • no voice reported by browser. Try Online TTS mode if silent.');
    u.onerror=e=>audioMessage(`Browser speech could not play (${e && e.error ? e.error : 'unknown error'}). Try Online TTS mode or install/select a Japanese voice.`, true);
    speechSynthesis.speak(u);
    setTimeout(()=>{ if(!started && !speechSynthesis.speaking) audioMessage('Browser accepted the audio but no sound started. Try Online TTS mode or install/select a Japanese voice.', true); }, 900);
  }catch(err){ audioMessage('Browser speech error: '+(err.message||err), true); }
}
function speak(text, rate=.82){
  if(state.audioMode==='online') return playOnlineTTS(text, rate);
  return playBrowserSpeech(text, rate);
}
function speakEncoded(encoded, rate=.82){ speak(decodeURIComponent(encoded), rate); }
function openOnlineAudio(encoded){
  const text=decodeURIComponent(encoded||'');
  const urls = onlineTtsUrls(text);
  if(!urls.length) return audioMessage('No online audio provider URL available.', true);
  // Open the first selected provider. If hosted playback fails, this can reveal whether the provider itself is blocking the request.
  window.open(urls[0].url,'_blank','noopener');
}
function audioControls(){
  const voices = refreshVoices();
  const japanese = voices.filter(v=>/^ja/i.test(v.lang||'') || /Japanese|日本/i.test((v.name||'')+' '+(v.lang||'')));
  const voiceOptions = (japanese.length?japanese:voices).map(v=>`<option value="${enc(v.voiceURI)}" ${jpVoice && v.voiceURI===jpVoice.voiceURI?'selected':''}>${esc(v.name)} ${v.lang?`(${esc(v.lang)})`:''}</option>`).join('');
  const voiceText = voices.length ? `${japanese.length} Japanese voice(s), ${voices.length} total voice(s) detected.` : 'No system voices detected yet. Try Refresh voices, or use Online TTS mode.';
  const providerName = state.audioProvider==='auto' ? 'auto provider fallback' : state.audioProvider;
  return `<div class="audio-panel"><div id="audioStatus" class="audio-status">Audio ready • ${state.audioMode==='online'?'online mode / '+esc(providerName):'browser speech mode'} • ${esc(voiceText)}</div><div class="toolbar"><select onchange="setAudioMode(this.value)"><option value="webspeech" ${state.audioMode==='webspeech'?'selected':''}>Browser speech / offline if voice exists</option><option value="online" ${state.audioMode==='online'?'selected':''}>Online TTS fallback / needs internet</option></select><select onchange="setAudioProvider(this.value)"><option value="auto" ${state.audioProvider==='auto'?'selected':''}>Auto online provider fallback</option><option value="googleapis" ${state.audioProvider==='googleapis'?'selected':''}>Google APIs TTS</option><option value="streamelements" ${state.audioProvider==='streamelements'?'selected':''}>StreamElements / Polly voice</option><option value="google" ${state.audioProvider==='google'?'selected':''}>Google Translate TTS</option></select><select id="voiceSelect" class="voice-select" onchange="setVoice(this.value)">${voiceOptions || '<option value="">No voices detected</option>'}</select><button class="btn secondary" onclick="refreshVoices(); render()">Refresh voices</button><button class="btn secondary" onclick="speak('こんにちは。日本語の音声テストです。', .82)">Test audio</button><button class="btn secondary" onclick="openOnlineAudio('${enc('こんにちは。日本語の音声テストです。')}')">Open audio link</button></div><div class="audio-help"><b>GitHub Pages note:</b> free TTS URLs can reject hosted embedding. In Online mode, leave the provider on <b>Auto</b>; the app will try multiple sources. For guaranteed GitHub Pages audio, host real MP3 files or use your own TTS/proxy service. Browser speech still needs a Japanese system voice.</div></div>`;
}
function enc(s){ return encodeURIComponent(String(s)); }
function kanaRomaji(ch){ return KANA_ROMAJI[ch] || ''; }
function kanaPool(which='all'){
  let rows = which==='hiragana'?DATA.kana.hiragana : which==='katakana'?DATA.kana.katakana : which==='dakuten'?DATA.kana.dakuten : which==='yoon'?DATA.kana.yoon : [...DATA.kana.hiragana, ...DATA.kana.katakana, ...DATA.kana.dakuten, ...DATA.kana.yoon];
  return rows.flat().filter(Boolean);
}
function selectKana(encoded, play=true){
  const ch = decodeURIComponent(encoded||''); if(!ch) return;
  state.selectedKana=ch; state.kanaRevealed=!state.kanaMemory; render();
  if(play) setTimeout(()=>speak(ch,.72),60);
}
function randomKana(which='all'){ const pool=kanaPool(which); const ch=pool[Math.floor(Math.random()*pool.length)] || 'あ'; selectKana(enc(ch), true); }
function mark(id,type){ const m=mastered(); m[id]={type, t:Date.now()}; save('mastered',m); toast('Marked mastered'); }
function markHard(id,type){ const h=hard(); h[id]={type, t:Date.now()}; save('hard',h); toast('Added to hard list'); }
function unmark(id){ const m=mastered(); delete m[id]; save('mastered',m); }
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }
function sample(a,n){ return shuffle(a).slice(0,n); }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){ const t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#22223b;color:#fff;padding:10px 14px;border-radius:999px;z-index:99;box-shadow:0 10px 30px #0002'; document.body.appendChild(t); setTimeout(()=>t.remove(),1400); }
function updateProgress(){
  const total = DATA.vocab.length + DATA.kanji.length + DATA.grammar.length;
  const count = Object.keys(mastered()).length;
  const pct = Math.min(100, Math.round(count/total*100));
  const bar=$('#progressBar'), txt=$('#progressText'); if(bar) bar.style.width=pct+'%'; if(txt) txt.textContent=`${count} / ${total} mastered (${pct}%)`;
}
function renderNav(){
  $('#nav').innerHTML = navItems.map(([id,ico,name])=>`<button class="${state.view===id?'active':''}" onclick="setView('${id}')"><span>${ico}</span><span>${name}</span></button>`).join('');
}
function layout(title, subtitle, inner){
  return `<section class="card"><h2>${title}</h2>${subtitle?`<p class="subtitle">${subtitle}</p>`:''}${audioControls()}${inner}</section>`;
}
function render(){ renderNav(); updateProgress(); const app=$('#app'); app.innerHTML = views[state.view](); setTimeout(bindAfterRender,0); }
function bindAfterRender(){ if(state.view==='kana') initCanvas(); }
function countsBy(arr,key){ return arr.reduce((m,x)=>(m[x[key]]=(m[x[key]]||0)+1,m),{}); }
const DAILY_STEPS = [
  ['kana','Kana sprint','Read/write 20 kana or 5 kanji.'],
  ['vocab','Vocabulary','Learn/review 25 high-frequency words.'],
  ['grammar','Grammar','Study 3 patterns and say 3 examples each.'],
  ['listening','Listening','Shadow 5–10 minutes without pausing.'],
  ['quiz','Retrieval','Finish one mixed quiz.']
];
function dayKey(){ return new Date().toISOString().slice(0,10); }
function dailyState(){ return load('daily_'+dayKey(),{}); }
function toggleDaily(id){ const d=dailyState(); d[id]=!d[id]; save('daily_'+dayKey(),d); render(); }
function currentWeek(){
  const m=mastered(), total=Object.keys(m).length, target=DATA.vocab.length+DATA.kanji.length+DATA.grammar.length;
  const ratio=target?total/target:0; return Math.min(12,Math.max(1,Math.floor(ratio*12)+1));
}
function streakCount(){
  let n=0; const d=new Date();
  for(let i=0;i<90;i++){ const k=d.toISOString().slice(0,10); const x=load('daily_'+k,{}); if(Object.values(x).filter(Boolean).length>=4)n++; else if(i>0)break; d.setDate(d.getDate()-1); }
  return n;
}
const views = {
 mission(){
   const d=dailyState(), done=DAILY_STEPS.filter(x=>d[x[0]]).length, pct=Math.round(done/DAILY_STEPS.length*100), w=currentWeek();
   return layout('Your 60-minute N5 mission','Do this in order. The goal is fast retrieval and repeated exposure—not collecting endless resources.', `<div class="focus-strip"><div><div class="tiny">Today</div><b>${done}/5 blocks complete</b></div><div><div class="tiny">Current path</div><b>Week ${w} of 12</b></div><div><div class="tiny">Consistency</div><b class="streak">${streakCount()}🔥</b></div></div><div class="meter"><span style="width:${pct}%"></span></div><div class="mission-grid" style="margin-top:16px">${DAILY_STEPS.map(([id,title,desc],i)=>`<div class="mission-step ${d[id]?'done':''}"><div class="section-kicker">${i+1} · ${i===0?'10 min':i===1?'15 min':i===2?'15 min':'10 min'}</div><b>${title}</b><small>${desc}</small><div class="toolbar"><button class="btn secondary" onclick="setView('${id}')">Practice</button><label class="checkline"><input type="checkbox" ${d[id]?'checked':''} onchange="toggleDaily('${id}')"><span class="tiny">done</span></label></div></div>`).join('')}</div><div class="path-callout" style="margin-top:18px"><b>Speed rule</b><p>If you score below 80%, review immediately. At 80–89%, keep moving but mark weak items. At 90%+, advance. Every seventh study day, replace new material with mixed review + a mock section.</p></div>`);
 },
 resources(){
   const kinds=['All',...new Set((window.N5_RESOURCES||[]).map(r=>r.kind))];
   const chosen=state.resourceKind||'All'; const items=(window.N5_RESOURCES||[]).filter(r=>chosen==='All'||r.kind===chosen);
   return layout('Resource map','Use outside resources only when they serve a specific skill. Your core path stays inside this app.', `<div class="toolbar">${kinds.map(k=>`<button class="btn ${chosen===k?'accent':'secondary'}" onclick="state.resourceKind='${k}';render()">${k}</button>`).join('')}</div><div class="resource-grid">${items.map(r=>`<article class="resource-card"><span class="tag">${esc(r.kind)}</span><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p><a class="btn secondary" href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.action)} ↗</a></article>`).join('')}</div><div class="notice" style="margin-top:16px"><b>Music rule:</b> songs are bonus listening, not your main N5 curriculum. First listen without lyrics, then catch known words, then shadow one short section. Do not spend 30 minutes translating a song line by line.</div>`);
 },
 dashboard(){
   const st=stats();
   return `<div class="path-hero card"><div><div class="section-kicker">Japanese from zero → N5</div><h2>Stop wondering what to study next.</h2><p class="subtitle">N5 Pathfinder gives beginners one deliberate route: learn the script, build high-frequency vocabulary, attach grammar, consume easy input, then retrieve under time pressure.</p><div class="toolbar"><button class="btn accent" onclick="setView('mission')">Start today’s 60 minutes</button><button class="btn secondary" onclick="setView('plan')">See the full route</button></div></div><img src="assets/torii.svg" alt="Illustrated red torii gate and landscape"></div><div class="hero" style="margin-top:18px">
    <section class="card"><h3>Your N5 engine</h3><p class="subtitle">Everything below remains available offline after the first load: kana, kanji, vocabulary, grammar, reading, listening, flashcards, quizzes, mock mode and local progress.</p>
    <div class="pillrow"><span class="pill">Vocabulary: 20 min</span><span class="pill">Grammar/Reading: 40 min</span><span class="pill">Listening: 30 min</span><span class="pill">Goal: mastery, not cramming</span></div>
    <div class="grid three"><div class="stat"><b>${DATA.vocab.length}</b><span>vocab items</span></div><div class="stat"><b>${DATA.kanji.length}</b><span>kanji cards</span></div><div class="stat"><b>${DATA.grammar.length}</b><span>grammar points</span></div></div>
    <div class="toolbar"><button class="btn accent" onclick="setView('plan')">Follow the 12-week path</button><button class="btn secondary" onclick="setView('quiz')">Start a quiz</button><button class="btn secondary" onclick="setView('mock')">Mock exam</button></div>
    <div class="notice"><b>Important:</b> JLPT does not publish a fixed official N5 vocabulary/grammar list. This app uses a broad, common N5-style syllabus plus buffer items. Full marks can never be guaranteed, but this is designed to cover the fundamentals and train the skills the test actually measures.</div>
    </section>
    <section class="card"><h3>Today’s targets</h3><div class="list">
      <div class="row"><div><b>Kana</b><br><small>Read, write, and say 20 characters.</small></div><button class="btn secondary" onclick="setView('kana')">Go</button></div>
      <div class="row"><div><b>Vocabulary</b><br><small>Review 25 cards; mark hard ones.</small></div><button class="btn secondary" onclick="setView('flash')">Go</button></div>
      <div class="row"><div><b>Grammar</b><br><small>Study 3 points, make 3 sentences each.</small></div><button class="btn secondary" onclick="setView('grammar')">Go</button></div>
      <div class="row"><div><b>Listening</b><br><small>Play, shadow, answer.</small></div><button class="btn secondary" onclick="setView('listening')">Go</button></div>
    </div><hr><p class="tiny">Quiz stats: ${st.correct} correct / ${st.total} attempts.</p></section>
   </div>`;
 },
 plan(){ return layout('12-week N5 roadmap','Use this as your main route. Move forward only when quizzes are consistently 85%+ and reading feels comfortable.', `<div class="grid two">${DATA.studyPlan.map(w=>`<div class="grammar-card"><span class="tag core">Week ${w.week}</span><h3>${esc(w.focus)}</h3><ul>${w.tasks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div><div class="notice" style="margin-top:16px"><b>Full-score strategy:</b> finish the plan once, then spend 2–4 weeks doing mixed timed quizzes, reading every passage aloud, and re-testing every hard item until errors disappear.</div>`); },
 kana(){
   const current = state.selectedKana || 'あ';
   const romaji = kanaRomaji(current);
   const showTarget = !state.kanaMemory || state.kanaRevealed;
   const chartRomaji = state.kanaShowRomaji && !state.kanaMemory;
   function cell(ch){
     if(!ch) return `<div class="kana-cell blank" aria-hidden="true"></div>`;
     return `<button class="kana-cell" onclick="selectKana('${enc(ch)}', true)"><span>${esc(ch)}</span>${chartRomaji?`<small>${esc(kanaRomaji(ch))}</small>`:''}</button>`;
   }
   function grid(rows){ return rows.map(r=>`<div class="kana-grid">${r.map(cell).join('')}</div>`).join(''); }
   return layout('Kana + writing lab','Use Learn mode for kana + romaji, then Memory writing mode to write from romaji/sound without seeing the kana first.', `<div class="toolbar"><button class="btn ${!state.kanaMemory?'accent':'secondary'}" onclick="state.kanaMemory=false; state.kanaRevealed=true; render()">Learn mode</button><button class="btn ${state.kanaMemory?'accent':'secondary'}" onclick="state.kanaMemory=true; state.kanaRevealed=false; render()">Memory writing mode</button><button class="btn secondary" onclick="state.kanaShowRomaji=!state.kanaShowRomaji; render()">${state.kanaShowRomaji?'Hide romaji on chart':'Show romaji on chart'}</button><button class="btn secondary" onclick="randomKana('hiragana')">Random hiragana</button><button class="btn secondary" onclick="randomKana('katakana')">Random katakana</button><button class="btn secondary" onclick="randomKana('all')">Random all</button></div><div class="grid two"><div><h3>Hiragana</h3>${grid(DATA.kana.hiragana)}<h3>Katakana</h3>${grid(DATA.kana.katakana)}<details><summary>Dakuten and handakuten</summary>${grid(DATA.kana.dakuten)}</details><details style="margin-top:10px"><summary>Small や/ゆ/よ combinations</summary>${grid(DATA.kana.yoon)}</details></div><div><div class="card flashcard kana-practice-card"><div class="flash-inner"><div class="tiny">${state.kanaMemory?'Memory prompt':'Practice character'}</div><div class="mega ${showTarget?'':'kana-hidden-target'}">${showTarget?esc(current):'？'}</div><div class="kana-prompt-romaji">${state.kanaMemory?`Write this from memory: <b>${esc(romaji)}</b>`:`Romaji: <b>${esc(romaji)}</b>`}</div><div class="toolbar" style="justify-content:center"><button class="btn" onclick="speakEncoded('${enc(current)}', .72)">Play</button>${state.kanaMemory?`<button class="btn secondary" onclick="state.kanaRevealed=!state.kanaRevealed; render()">${state.kanaRevealed?'Hide kana':'Reveal kana'}</button>`:''}<button class="btn secondary" onclick="randomKana('all')">New prompt</button></div></div></div><div class="canvasWrap writing-lab"><div class="toolbar"><button class="btn secondary" onclick="clearCanvas()">Clear practice page</button><button class="btn secondary" onclick="state.kanaGuide=!state.kanaGuide; clearCanvas()">${state.kanaGuide?'Hide ghost guide':'Show ghost guide'}</button></div><canvas id="writeCanvas" width="1200" height="640"></canvas></div><p class="tiny">Best routine: listen once, say the sound, write the kana in all six boxes, reveal/check, then clear and repeat. In memory mode the ghost guide only appears after you reveal the kana.</p></div></div>`); },
 vocab(){
   const cats=['All',...Object.keys(countsBy(DATA.vocab,'cat')).sort()];
   const q=(state.filter||'').toLowerCase(); const rows=DATA.vocab.filter(v=>(state.cat==='All'||v.cat===state.cat) && [v.jp,v.kana,v.en,v.pos,v.cat].some(x=>String(x).toLowerCase().includes(q)));
   return layout('Vocabulary bank','Search, filter by category, play audio, and mark mastered/hard. Use kana readings first; hide English when reviewing.', `<div class="toolbar"><input placeholder="Search Japanese, kana, English…" value="${esc(state.filter)}" oninput="state.filter=this.value; render()"><select onchange="state.cat=this.value; render()">${cats.map(c=>`<option ${state.cat===c?'selected':''}>${c}</option>`).join('')}</select><button class="btn secondary" onclick="state.filter=''; state.cat='All'; render()">Reset</button></div><p class="tiny">Showing ${rows.length} / ${DATA.vocab.length}.</p><div class="list">${rows.slice(0,240).map(v=>`<div class="row"><div><div class="bigjp" style="font-size:1.55rem">${esc(v.jp)}</div><small class="jp">${esc(v.kana)}</small><br><small>${esc(v.en)} • ${esc(v.pos)}</small></div><div class="toolbar"><span class="tag">${esc(v.cat)}</span><button class="btn secondary" onclick="speakEncoded('${enc(v.jp)}')">▶</button><button class="btn good" onclick="mark('${v.id}','vocab')">✓</button><button class="btn warn" onclick="markHard('${v.id}','vocab')">Hard</button></div></div>`).join('')}</div>${rows.length>240?'<p class="tiny">Narrow search to see more results.</p>':''}`); },
 kanji(){
   const q=(state.filter||'').toLowerCase(); const rows=DATA.kanji.filter(k=>[k.kanji,k.reading,k.meaning,k.example].some(x=>String(x).toLowerCase().includes(q)));
   return layout('Kanji bank','N5 mainly expects basic kanji recognition in common words. Learn meaning + common readings + example words, not isolated readings only.', `<div class="toolbar"><input placeholder="Search kanji, reading, meaning…" value="${esc(state.filter)}" oninput="state.filter=this.value; render()"><button class="btn secondary" onclick="state.filter=''; render()">Reset</button></div><div class="grid four">${rows.map(k=>`<div class="grammar-card"><div class="bigjp">${k.kanji}</div><b>${esc(k.meaning)}</b><p class="jp">${esc(k.reading)}</p><p><span class="tag">Lesson ${k.lesson}</span></p><p class="tiny jp">${esc(k.example)}</p><div class="toolbar"><button class="btn secondary" onclick="speakEncoded('${enc(k.example.split(' ')[0])}')">▶</button><button class="btn good" onclick="mark('${k.id}','kanji')">✓</button><button class="btn warn" onclick="markHard('${k.id}','kanji')">Hard</button></div></div>`).join('')}</div>`); },
 grammar(){
   const q=(state.filter||'').toLowerCase(); const rows=DATA.grammar.filter(g=>[g.title,g.pattern,g.meaning,g.explanation].some(x=>String(x).toLowerCase().includes(q)));
   return layout('Grammar syllabus','Read the pattern, speak the examples, then create your own sentence. Core items are essential; buffer items improve reading/listening safety.', `<div class="toolbar"><input placeholder="Search grammar…" value="${esc(state.filter)}" oninput="state.filter=this.value; render()"><button class="btn secondary" onclick="state.filter=''; render()">Reset</button></div><div class="grid two">${rows.map(g=>`<div class="grammar-card"><span class="tag ${g.core?'core':''}">${g.core?'core':'buffer'}</span><h3>${esc(g.title)}</h3><div class="pattern">${esc(g.pattern)}</div><p><b>${esc(g.meaning)}</b></p><p>${esc(g.explanation)}</p>${g.examples.map(ex=>`<div class="example"><span class="jp">${esc(ex[0])}</span><br><small>${esc(ex[1])}</small> <button class="btn secondary" style="padding:4px 8px" onclick="speakEncoded('${enc(ex[0])}')">▶</button></div>`).join('')}<details><summary>Mini check</summary><p>${esc(g.quiz.q)}</p><p><b>Answer:</b> ${esc(g.quiz.a)}</p></details><div class="toolbar"><button class="btn good" onclick="mark('${g.id}','grammar')">✓ mastered</button><button class="btn warn" onclick="markHard('${g.id}','grammar')">Hard</button></div></div>`).join('')}</div>`); },
 flash(){
   const pool = state.mode==='kanji'?DATA.kanji:state.mode==='grammar'?DATA.grammar:DATA.vocab;
   const item = pool[state.flashIndex % pool.length];
   let front='', back='', id=item.id, type=state.mode;
   if(state.mode==='vocab'){ front=`<div class="bigjp">${esc(item.jp)}</div><p class="jp">${esc(item.kana)}</p>`; back=`<b>${esc(item.en)}</b><br><small>${esc(item.cat)} • ${esc(item.pos)}</small>`; }
   if(state.mode==='kanji'){ front=`<div class="mega">${item.kanji}</div>`; back=`<b>${esc(item.meaning)}</b><p class="jp">${esc(item.reading)}</p><small class="jp">${esc(item.example)}</small>`; }
   if(state.mode==='grammar'){ front=`<h3>${esc(item.title)}</h3><div class="pattern jp">${esc(item.pattern)}</div>`; back=`<b>${esc(item.meaning)}</b><p>${esc(item.explanation)}</p><small class="jp">${esc(item.examples[0][0])}</small>`; }
   return layout('Flashcards','Use active recall: answer before reveal. Mark known only when you can read, understand, and use it.', `<div class="toolbar"><select onchange="state.mode=this.value; state.flashIndex=0; state.reveal=false; render()"><option value="vocab" ${state.mode==='vocab'?'selected':''}>Vocabulary</option><option value="kanji" ${state.mode==='kanji'?'selected':''}>Kanji</option><option value="grammar" ${state.mode==='grammar'?'selected':''}>Grammar</option></select><button class="btn secondary" onclick="state.flashIndex=Math.max(0,state.flashIndex-1); state.reveal=false; render()">Previous</button><button class="btn" onclick="state.reveal=!state.reveal; render()">${state.reveal?'Hide':'Reveal'}</button><button class="btn secondary" onclick="state.flashIndex++; state.reveal=false; render()">Next</button></div><div class="card flashcard"><div class="flash-inner">${front}${state.reveal?`<div class="answer">${back}</div>`:''}</div></div><div class="toolbar"><button class="btn secondary" onclick="speakEncoded('${enc(state.mode==='kanji'?item.example.split(' ')[0]:state.mode==='grammar'?item.examples[0][0]:item.jp)}')">Play</button><button class="btn good" onclick="mark('${id}','${type}'); state.flashIndex++; state.reveal=false; render();">Know it</button><button class="btn warn" onclick="markHard('${id}','${type}'); state.flashIndex++; state.reveal=false; render();">Hard</button></div><p class="tiny">Card ${(state.flashIndex%pool.length)+1} / ${pool.length}</p>`); },
 quiz(){
   if(!state.quiz) newQuiz();
   const q=state.quiz; const done=q.index>=q.items.length;
   if(done) return layout('Quiz complete',`Score: ${q.correct} / ${q.items.length}`, `<div class="toolbar"><button class="btn accent" onclick="newQuiz(); render()">New quiz</button><button class="btn secondary" onclick="setView('progress')">Review progress</button></div>`);
   const it=q.items[q.index];
   return layout('Quiz mode','Mixed multiple-choice practice. Aim for 90%+ before moving to timed mock exams.', `<div class="toolbar"><select onchange="state.mode=this.value; newQuiz(); render()"><option value="vocab" ${state.mode==='vocab'?'selected':''}>Vocabulary meaning</option><option value="reading" ${state.mode==='reading'?'selected':''}>Vocabulary reading</option><option value="kanji" ${state.mode==='kanji'?'selected':''}>Kanji meaning</option><option value="grammar" ${state.mode==='grammar'?'selected':''}>Grammar particles/patterns</option></select><button class="btn secondary" onclick="newQuiz(); render()">Restart</button></div><div class="card"><p class="tiny">Question ${q.index+1} / ${q.items.length} • Score ${q.correct}</p><h3>${it.prompt}</h3>${it.jp?`<div class="bigjp">${esc(it.jp)}</div>`:''}<div class="choices">${it.choices.map(c=>`<button class="choice ${it.answered?(c===it.answer?'correct':c===it.picked?'wrong':''):''}" onclick="answerQuiz('${esc(c)}')">${esc(c)}</button>`).join('')}</div>${it.answered?`<p class="notice"><b>Answer:</b> ${esc(it.answer)} ${it.note?`— ${esc(it.note)}`:''}</p><button class="btn" onclick="state.quiz.index++; render()">Next</button>`:''}</div>`); },
 reading(){
   return layout('Reading practice','Read first without translation. Then answer, check, and read aloud while listening to browser speech.', `<div class="grid two">${DATA.reading.map((r,idx)=>`<div class="reading-box"><span class="tag">${r.level}</span><h3>${esc(r.title)}</h3><p class="jp">${esc(r.jp)}</p><div class="toolbar"><button class="btn secondary" onclick="speakEncoded('${enc(r.jp)}', .78)">Play</button><button class="btn good" onclick="mark('read${idx}','reading')">✓ read</button></div><details><summary>Translation + questions</summary><p>${esc(r.en)}</p>${r.questions.map((qq,i)=>`<p><b>Q${i+1}.</b> <span class="jp">${esc(qq.q)}</span><br><small>Choices: ${qq.choices.map(esc).join(' / ')}</small><br><b>Answer:</b> ${esc(qq.a)}</p>`).join('')}</details></div>`).join('')}</div>`); },
 listening(){
   return layout('Listening + speaking lab','Use the Play button, listen without reading, then shadow aloud. Browser speech is synthetic, so supplement with native audio when possible.', `<div class="grid two">${DATA.listening.map((l,idx)=>`<div class="reading-box"><span class="tag">Listening ${idx+1}</span><h3>${esc(l.title)}</h3><p class="jp bigjp" style="font-size:1.45rem">${esc(l.jp)}</p><p>${esc(l.prompt)}</p><div class="toolbar"><button class="btn" onclick="speakEncoded('${enc(l.jp)}',.75)">Slow play</button><button class="btn secondary" onclick="speakEncoded('${enc(l.jp)}',.95)">Natural-ish</button><button class="btn good" onclick="mark('listen${idx}','listening')">✓ shadowed</button></div><details><summary>Show meaning and answer</summary><p>${esc(l.en)}</p><p><b>Answer:</b> <span class="jp">${esc(l.answer)}</span></p></details></div>`).join('')}</div><div class="notice" style="margin-top:16px"><b>Speaking drill:</b> after each line, repeat 3 times: once slowly, once at the same speed, once while looking away. Record yourself on your phone and compare rhythm, not perfection.</div>`); },
 mock(){
   if(!state.mock) makeMock();
   const m=state.mock; const done=m.index>=m.items.length;
   if(done) return layout('Mock exam result',`Estimated raw practice score: ${m.correct} / ${m.items.length}. Review every miss before retaking.`, `<div class="grid two"><div class="stat"><b>${Math.round(m.correct/m.items.length*100)}%</b><span>practice accuracy</span></div><div class="stat"><b>${m.items.length}</b><span>questions</span></div></div><div class="toolbar"><button class="btn accent" onclick="makeMock(); render()">Retake new mock</button><button class="btn secondary" onclick="setView('quiz')">Targeted quiz</button></div><div class="notice">This is a training mock, not an official JLPT scoring simulator. Official JLPT scores are scaled, so use this for readiness, timing, and weak-point detection.</div>`);
   const it=m.items[m.index];
   return layout('Mock exam trainer','A compact mixed test: vocabulary, kanji, grammar, reading, and listening-style prompts. Use it after finishing the syllabus.', `<div class="toolbar"><button class="btn secondary" onclick="makeMock(); render()">New mock</button><span class="pill">Question ${m.index+1} / ${m.items.length}</span><span class="pill">Score ${m.correct}</span></div><div class="card"><span class="tag">${esc(it.section)}</span><h3>${esc(it.prompt)}</h3>${it.jp?`<p class="bigjp" style="font-size:1.6rem">${esc(it.jp)}</p>`:''}${it.listen?`<button class="btn secondary" onclick="speakEncoded('${enc(it.listen)}',.78)">Play listening line</button>`:''}<div class="choices">${it.choices.map(c=>`<button class="choice ${it.answered?(c===it.answer?'correct':c===it.picked?'wrong':''):''}" onclick="answerMock('${esc(c)}')">${esc(c)}</button>`).join('')}</div>${it.answered?`<p class="notice"><b>Answer:</b> ${esc(it.answer)}</p><button class="btn" onclick="state.mock.index++; render()">Next</button>`:''}</div>`); },
 progress(){
   const m=mastered(), h=hard(), st=stats(); const total=DATA.vocab.length+DATA.kanji.length+DATA.grammar.length;
   const hardIds=Object.keys(h);
   return layout('Progress and review','Progress is saved in this browser only. Export a backup if you move devices.', `<div class="grid three"><div class="stat"><b>${Object.keys(m).length}</b><span>mastered / ${total}</span></div><div class="stat"><b>${hardIds.length}</b><span>hard items</span></div><div class="stat"><b>${st.correct}/${st.total}</b><span>quiz correct</span></div></div><div class="toolbar"><button class="btn secondary" onclick="exportProgress()">Export JSON</button><button class="btn danger" onclick="if(confirm('Reset all progress?')){localStorage.clear(); render();}">Reset all</button></div><h3>Hard-list review</h3><div class="list">${hardIds.length?hardIds.slice(0,80).map(id=>`<div class="row"><div><b>${esc(id)}</b><br><small>${esc(h[id].type)} • added ${new Date(h[id].t).toLocaleDateString()}</small></div><button class="btn good" onclick="mark('${id}','${h[id].type}'); const hh=hard(); delete hh['${id}']; save('hard',hh); render();">Move to mastered</button></div>`).join(''):'<p class="notice">No hard items yet. Mark difficult cards during study.</p>'}</div>`); }
};
function newQuiz(){
  const items=[];
  if(state.mode==='vocab') sample(DATA.vocab,20).forEach(v=>items.push({prompt:'Choose the meaning:', jp:v.jp+'（'+v.kana+'）', answer:v.en, choices:shuffle([v.en,...sample(DATA.vocab.filter(x=>x.id!==v.id),3).map(x=>x.en)]), note:v.cat}));
  else if(state.mode==='reading') sample(DATA.vocab,20).forEach(v=>items.push({prompt:'Choose the reading:', jp:v.jp, answer:v.kana, choices:shuffle([v.kana,...sample(DATA.vocab.filter(x=>x.id!==v.id),3).map(x=>x.kana)]), note:v.en}));
  else if(state.mode==='kanji') sample(DATA.kanji,20).forEach(k=>items.push({prompt:'Choose the meaning:', jp:k.kanji, answer:k.meaning, choices:shuffle([k.meaning,...sample(DATA.kanji.filter(x=>x.id!==k.id),3).map(x=>x.meaning)]), note:k.example}));
  else sample(DATA.grammar,15).forEach(g=>items.push({prompt:g.quiz.q, answer:g.quiz.a, choices:shuffle(g.quiz.choices), note:g.title}));
  state.quiz={items, index:0, correct:0};
}
function answerQuiz(choice){ const it=state.quiz.items[state.quiz.index]; if(it.answered) return; it.answered=true; it.picked=choice; if(choice===it.answer) state.quiz.correct++; const st=stats(); st.total++; if(choice===it.answer) st.correct++; st.history.push({t:Date.now(),mode:state.mode,ok:choice===it.answer}); save('stats',st); render(); }
function makeMock(){
 const items=[];
 sample(DATA.vocab,10).forEach(v=>items.push({section:'Vocabulary',prompt:'Choose the meaning.',jp:v.jp+'（'+v.kana+'）',answer:v.en,choices:shuffle([v.en,...sample(DATA.vocab.filter(x=>x.id!==v.id),3).map(x=>x.en)])}));
 sample(DATA.kanji,8).forEach(k=>items.push({section:'Kanji',prompt:'Choose the meaning.',jp:k.kanji,answer:k.meaning,choices:shuffle([k.meaning,...sample(DATA.kanji.filter(x=>x.id!==k.id),3).map(x=>x.meaning)])}));
 sample(DATA.grammar.filter(g=>g.core),10).forEach(g=>items.push({section:'Grammar',prompt:g.quiz.q,answer:g.quiz.a,choices:shuffle(g.quiz.choices)}));
 sample(DATA.reading,3).forEach(r=>{ const qq=r.questions[0]; items.push({section:'Reading',prompt:qq.q,jp:r.jp,answer:qq.a,choices:shuffle(qq.choices)}); });
 sample(DATA.listening,5).forEach(l=>items.push({section:'Listening',prompt:l.prompt,listen:l.jp,answer:l.answer,choices:shuffle([l.answer,'はい','いいえ','分かりません'].filter((x,i,a)=>a.indexOf(x)===i)).slice(0,4)}));
 state.mock={items:shuffle(items), index:0, correct:0};
}
function answerMock(choice){ const it=state.mock.items[state.mock.index]; if(it.answered) return; it.answered=true; it.picked=choice; if(choice===it.answer) state.mock.correct++; const st=stats(); st.total++; if(choice===it.answer) st.correct++; st.history.push({t:Date.now(),mode:'mock-'+it.section,ok:choice===it.answer}); save('stats',st); render(); }
function exportProgress(){ const blob=new Blob([JSON.stringify({mastered:mastered(), hard:hard(), stats:stats(), exported:new Date().toISOString()},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='n5-progress.json'; a.click(); URL.revokeObjectURL(a.href); }
let ctx, drawing=false;
function drawCanvasGuide(){
  const c=$('#writeCanvas'); if(!c) return; const g=c.getContext('2d');
  g.clearRect(0,0,c.width,c.height);
  g.save();
  g.strokeStyle='rgba(34,34,59,.13)'; g.lineWidth=2;
  for(let i=1;i<3;i++){ g.beginPath(); g.moveTo(c.width*i/3,0); g.lineTo(c.width*i/3,c.height); g.stroke(); }
  g.beginPath(); g.moveTo(0,c.height/2); g.lineTo(c.width,c.height/2); g.stroke();
  g.setLineDash([10,10]); g.strokeStyle='rgba(34,34,59,.10)';
  for(let col=0; col<3; col++) for(let row=0; row<2; row++){
    const x=col*c.width/3, y=row*c.height/2, w=c.width/3, h=c.height/2;
    g.beginPath(); g.moveTo(x+w/2,y+18); g.lineTo(x+w/2,y+h-18); g.stroke();
    g.beginPath(); g.moveTo(x+18,y+h/2); g.lineTo(x+w-18,y+h/2); g.stroke();
  }
  const canShowGhost = state.kanaGuide && (!state.kanaMemory || state.kanaRevealed);
  if(canShowGhost && state.selectedKana){
    g.setLineDash([]); g.globalAlpha=.12; g.fillStyle='#22223b'; g.textAlign='center'; g.textBaseline='middle'; g.font='220px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    for(let col=0; col<3; col++) for(let row=0; row<2; row++) g.fillText(state.selectedKana, (col+.5)*c.width/3, (row+.54)*c.height/2);
  }
  g.restore();
}
function initCanvas(){
  const c=$('#writeCanvas'); if(!c) return; ctx=c.getContext('2d'); drawCanvasGuide();
  ctx.lineWidth=12; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#22223b';
  const pos=e=>{ const r=c.getBoundingClientRect(); const p=e.touches?e.touches[0]:e; return {x:(p.clientX-r.left)*c.width/r.width,y:(p.clientY-r.top)*c.height/r.height}; };
  c.onpointerdown=e=>{drawing=true; c.setPointerCapture?.(e.pointerId); const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);};
  c.onpointermove=e=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); };
  c.onpointerup=c.onpointercancel=e=>{ drawing=false; try{ c.releasePointerCapture?.(e.pointerId); }catch(_){} };
}
function clearCanvas(){ drawCanvasGuide(); }
render();
