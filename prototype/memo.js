(() => {
  'use strict';
  const root = document.getElementById('memo-sky');
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const colors = {cloud:{name:'云白',value:'#f5f4eb'},sky:{name:'天空蓝',value:'#eaf3f6'},wheat:{name:'麦田黄',value:'#f8efd8'},sage:{name:'浅草绿',value:'#edf2e5'},rose:{name:'暖杏色',value:'#f6ede5'}};
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const today = `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
  const dateObject = iso => {const [y,m,d]=iso.split('-').map(Number);return new Date(Date.UTC(y,m-1,d,12));};
  const dateKey = date => `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
  const addDays = (iso,n) => {const date=dateObject(iso);date.setUTCDate(date.getUTCDate()+n);return dateKey(date);};
  const dateLabel = (iso,weekday=false) => new Intl.DateTimeFormat('zh-CN',{timeZone:'UTC',month:'long',day:'numeric',...(weekday?{weekday:'short'}:{})}).format(dateObject(iso));
  const validDate = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(dateObject(iso).getTime()) && dateKey(dateObject(iso))===iso;
  const validCalendarDate = iso => validDate(iso)&&iso>='1900-01-01'&&iso<='2100-12-31';
  const validCalendarMonth = month => /^(?:19\d{2}|20\d{2}|2100)-(?:0[1-9]|1[0-2])$/.test(month);
  const daysInCalendarMonth = month => {const [year,value]=month.split('-').map(Number);return new Date(Date.UTC(year,value,0)).getUTCDate();};
  const calendarDateForMonth = (month,day) => `${month}-${String(Math.max(1,Math.min(day,daysInCalendarMonth(month)))).padStart(2,'0')}`;
  const splitTags = text => [...new Set(text.split(/[,，\s#]+/).map(t=>t.trim()).filter(Boolean))].slice(0,6);
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const soundDefaults={enabled:true,preset:'bell',volume:65,duration:10};
  const reminderIcons={'bell-ring':'铃铛',sparkles:'星光',heart:'爱心',star:'星星'};
  const visualDefaults={icon:'bell-ring',motion:true};
  const restoreVisual=(value={})=>({icon:[...Object.keys(reminderIcons),'custom'].includes(value.icon)?value.icon:'bell-ring',motion:value.motion!==false});
  const welcomeDefaults={greeting:'给今天一个好开始',title:'记录此刻，\n安排今天。',description:'把灵感留下，把日子慢慢过好。',footer:'每一天，都值得好好记录',icon:'sun',showDate:true};
  const welcomeIcons={sun:'太阳','cloud-sun':'晴空',coffee:'咖啡',sparkles:'星光',heart:'爱心'};
  function restoreWelcome(value={}){
    const text=(key,max)=>typeof value[key]==='string'?value[key].replace(/\r\n?/g,'\n').slice(0,max):welcomeDefaults[key];
    return {greeting:text('greeting',80),title:text('title',120).trim()||welcomeDefaults.title,description:text('description',200),footer:text('footer',100),icon:Object.keys(welcomeIcons).includes(value.icon)?value.icon:'sun',showDate:value.showDate!==false};
  }
  function restoreSound(value={}) {
    return {enabled:value.enabled!==false,preset:['bell','breeze','custom'].includes(value.preset)?value.preset:'bell',volume:Number.isFinite(value.volume)?Math.min(100,Math.max(0,value.volume)):65,duration:[5,10,30].includes(value.duration)?value.duration:10};
  }
  const initial = () => ({version:1,updatedAt:0,notes:[
    {id:'n-trip',title:'一些想慢慢实现的小事',type:'text',body:'去没有去过的地方，\n看一场日落，住进山里的小屋。\n不用赶路，只是出发。',tags:['生活'],color:'wheat',pinned:true,created:`${today}T10:30`},
    {id:'n-idea',title:'给灵感一个停靠的地方',type:'text',body:'有些想法不必马上变成答案。\n先把它们记下来，等某一天，\n它们会慢慢连成一条路。',tags:['灵感'],color:'sky',pinned:true,created:`${today}T09:15`},
    {id:'n-today',title:'今天，不赶时间',type:'list',body:'',items:[{text:'泡一杯喜欢的咖啡',done:true},{text:'整理桌上的小东西',done:false},{text:'傍晚出去走走',done:false}],tags:['生活'],color:'sage',pinned:false,created:`${today}T08:45`},
    {id:'n-product',title:'关于新的小工具',type:'text',body:'打开就能记，点一下就能安排。\n让备忘录像桌上的便签一样，\n轻一点，也温暖一点。',tags:['工作','灵感'],color:'sky',pinned:false,created:`${addDays(today,-1)}T16:20`},
    {id:'n-reading',title:'最近读到的一句话',type:'text',body:'「生活的美，往往藏在那些\n不急于到达的时刻。」\n\n记得给自己留一点空白。',tags:['阅读'],color:'cloud',pinned:false,created:`${addDays(today,-1)}T11:00`},
    {id:'n-pack',title:'下次出发之前',type:'list',body:'',items:[{text:'相机和备用电池',done:false},{text:'一本还没读完的书',done:false},{text:'把喜欢的歌下载好',done:false}],tags:['生活'],color:'rose',pinned:false,created:`${addDays(today,-2)}T19:10`}
  ],events:[
    {id:'e-holiday',title:'给自己放个小假',date:today,allDay:true,start:'09:00',end:'10:00',notes:'今天的节奏，可以慢一点。',reminder:'today9',reminderStatus:'scheduled'},
    {id:'e-plan',title:'整理下周的计划',date:today,allDay:false,start:'14:00',end:'15:00',notes:'带上备忘录，留一点时间给新的想法。',reminder:'10',reminderStatus:'scheduled'},
    {id:'e-walk',title:'傍晚出去走走',date:today,allDay:false,start:'17:30',end:'18:00',notes:'去附近的公园，看看今天的天空。',reminder:'30',reminderStatus:'scheduled'},
    {id:'e-coffee',title:'一起喝杯咖啡',date:addDays(today,2),allDay:false,start:'10:00',end:'11:00',notes:'找个有阳光的靠窗位置。',reminder:'60',reminderStatus:'scheduled'},
    {id:'e-trip',title:'周末短途出发',date:addDays(today,4),allDay:true,start:'09:00',end:'10:00',notes:'不用走很远，也可以有新的风景。',reminder:'previous9',reminderStatus:'scheduled'}
  ],autoStart:true,sound:{...soundDefaults},visual:{...visualDefaults},welcome:{...welcomeDefaults},running:true,windowOpen:true,view:'notes',selectedDate:today,month:today.slice(0,7),tag:'all',search:'',draft:{type:'text',content:'',tags:'',color:'cloud'}});
  function restore(snapshot) {
    const base=initial();
    const data=snapshot?.privateContent?.memo ?? snapshot?.privateContent;
    if (!data || data.version!==1 || !Array.isArray(data.notes) || !Array.isArray(data.events)) return base;
    const notes=data.notes.filter(n=>n&&typeof n.id==='string'&&['text','list'].includes(n.type)&&Array.isArray(n.tags)).map(n=>({...n,title:String(n.title??''),body:String(n.body??''),color:colors[n.color]?n.color:'cloud',items:Array.isArray(n.items)?n.items.map(i=>({text:String(i.text??''),done:!!i.done})):[],tags:n.tags.map(String),created:String(n.created??today),pinned:!!n.pinned}));
    const events=data.events.filter(e=>e&&typeof e.id==='string'&&validDate(e.date)&&typeof e.title==='string').map(e=>{
      const event={...e,notes:String(e.notes??''),allDay:!!e.allDay,start:e.start||'09:00',end:e.end||'10:00',reminder:e.reminder||'none'};
      if(event.reminder==='custom'){event.customReminder=MemoReminders.normalize(e.customReminder);if(!MemoReminders.resolve(event)){event.reminder='none';event.reminderStatus='off';delete event.customReminder;}}
      return event;
    });
    const savedDate=validCalendarDate(data.selectedDate||'')?data.selectedDate:today;
    const savedMonth=validCalendarMonth(data.month||'')?data.month:savedDate.slice(0,7);
    return {...base,notes,events,sound:restoreSound(data.sound||{}),visual:restoreVisual(data.visual||{}),welcome:restoreWelcome(data.welcome||{}),updatedAt:Number(data.updatedAt)||0,autoStart:typeof data.autoStart==='boolean'?data.autoStart:true,running:data.running!==false,windowOpen:data.windowOpen!==false,view:data.view==='calendar'?'calendar':'notes',selectedDate:calendarDateForMonth(savedMonth,Number(savedDate.slice(-2))),month:savedMonth,tag:String(data.tag||'all'),search:String(data.search||''),draft:{...base.draft,...data.draft,color:colors[data.draft?.color]?data.draft.color:'cloud'}};
  }
  let state=restore(window.openai?.widgetState);
  let activeModal=null, returnFocus=null, noteTimer=null, draftTimer=null, toastTimer=null, lastUndo=null, trayOpen=false, lastPersisted=null, lastTrigger=null, openingTimer=null;
  const originalPhoto={src:$('.memo-photo img').src,alt:$('.memo-photo img').alt};
  let originalOpening=MemoTheme.palette(210,.5,40,.5).opening;
  function analyzeOriginalOpening(){
    const image=$('.memo-photo img');
    if(!image?.naturalWidth)return;
    try{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const context=canvas.getContext('2d');context.drawImage(image,0,0,64,64);originalOpening=MemoTheme.extract(context.getImageData(0,0,64,64).data).opening;}catch{}
  }
  if($('.memo-photo img').complete)analyzeOriginalOpening();else $('.memo-photo img').addEventListener('load',analyzeOriginalOpening,{once:true});
  const originalColors=Object.fromEntries(Object.entries(colors).map(([key,value])=>[key,{...value}]));
  let customBackground=null,photoRequest=0,photoTheme=null,customIcon=null,iconRequest=0,iconLoading=false;
  let iconMessage=state.visual.icon==='custom'?'自选图标未保留，请重新添加。':'';
  if(state.visual.icon==='custom')state.visual.icon='bell-ring';
  const soundPresets={bell:{name:'轻柔铃声',url:'__MEMO_BELL__'},breeze:{name:'清晨木琴',url:'__MEMO_BREEZE__'}};
  const audio=$('.memo-audio');
  let customSound=null,soundRequest=0,soundLoading=false,soundPlaying=false,soundPurpose=null,playSequence=0,soundTimer=null;
  let soundMessage=state.sound.preset==='custom'?'自选音频未保留，请重新添加。':'';
  if(state.sound.preset==='custom')state.sound.preset='bell';
  const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function icons() {if(window.lucide)window.lucide.createIcons({attrs:{width:16,height:16}});}
  function persist() {
    state.updatedAt=Date.now();
    if(!window.openai?.setWidgetState)return;
    const payload={modelContent:{app:'Memo',theme:photoTheme?.name||'天空与麦田',customPhoto:!!photoTheme,backgroundKind:customBackground?.kind||'image',reminderIcon:state.visual.icon==='custom'?'自选媒体':reminderIcons[state.visual.icon],reminderSound:state.sound.enabled?(state.sound.preset==='custom'?'自选音效或音乐':soundPresets[state.sound.preset].name):'静音',autoStart:state.autoStart,noteCount:state.notes.length,eventCount:state.events.length,selectedDate:state.selectedDate},privateContent:{memo:state}};
    if(new TextEncoder().encode(JSON.stringify(payload)).length>16000)return;
    lastPersisted=JSON.stringify(state);
    try{Promise.resolve(window.openai.setWidgetState(payload)).catch(()=>{});}catch{}
  }
  function toast(message,undo=null) {
    clearTimeout(toastTimer);lastUndo=undo;
    $('.memo-toast').innerHTML=`<span>${escape(message)}</span>${undo?'<button type="button" data-action="undo" class="cursor-interaction">撤销</button>':''}`;
    $('.memo-toast').hidden=false;
    toastTimer=setTimeout(()=>{$('.memo-toast').hidden=true;lastUndo=null;},6500);
  }
  function colorButtons(selected,context) {
    return Object.entries(colors).map(([key,color])=>`<button type="button" class="memo-colorchoice cursor-interaction" style="--swatch:${color.value}" aria-label="${context==='draft'?'新备忘录':'编辑备忘录'}颜色：${color.name}" aria-pressed="${selected===key}" data-action="${context}-color" data-color="${key}"></button>`).join('');
  }
  function applyPhotoTheme(theme) {
    if(theme)Object.entries(theme.vars).forEach(([key,value])=>root.style.setProperty(`--memo-${key}`,value));
    else if(photoTheme)Object.keys(photoTheme.vars).forEach(key=>root.style.removeProperty(`--memo-${key}`));
    Object.assign(colors,theme?.notes||originalColors);
    photoTheme=theme;
    root.setAttribute('aria-label',theme?`Memo ${theme.name}媒体主题原型`:'Memo 天空与麦田主题原型');
    $('.memo-draftcolors').innerHTML=colorButtons(state.draft.color,'draft');
    renderNotes();
    if(activeModal?.kind==='note')$('.memo-colorchoices').innerHTML=colorButtons(activeModal.color,'note');
    $('.memo-photoreset').hidden=!theme;
    $('.memo-themetext').textContent=theme?`${theme.name} · ${theme.opening.name} · 自选媒体仅保留于本次预览`:'天空与麦田 · 配色与打开动画随图片、动图和视频变化';
    $('.memo-photocaption').textContent=theme?'your own little scenery.':'somewhere, unhurried.';
  }
  async function changePhoto(file) {
    if(!file)return;
    try{MemoMedia.classify(file);}catch(error){$('.memo-themetext').textContent=error.message;return;}
    const request=++photoRequest;
    const button=$('.memo-photoinput');let candidate=null;
    button.disabled=true;$('.memo-photo').setAttribute('aria-busy','true');
    $('.memo-themetext').textContent='正在读取媒体，寻找画面里的颜色…';
    try{
      candidate=await MemoMedia.decode(file);
      if(request!==photoRequest)return;
      const theme=MemoTheme.extract(candidate.pixels),previous=customBackground;
      finishOpening();
      delete candidate.pixels;customBackground=candidate;
      renderBackground();applyPhotoTheme(theme);persist();
      if(previous)URL.revokeObjectURL(previous.url);
    }catch(error){
      if(request===photoRequest)$('.memo-themetext').textContent=error.message;
    }finally{
      if(candidate&&customBackground!==candidate)URL.revokeObjectURL(candidate.url);
      if(request===photoRequest){button.disabled=false;$('.memo-photo').removeAttribute('aria-busy');}
    }
  }
  function resetPhoto() {
    finishOpening();
    photoRequest++;
    const previous=customBackground;customBackground=null;renderBackground();
    if(previous)URL.revokeObjectURL(previous.url);
    $('.memo-photoinput').disabled=false;$('.memo-photo').removeAttribute('aria-busy');
    $('.memo-photoinput').focus({preventScroll:true});
    applyPhotoTheme(null);persist();
  }
  function motionEnabled(){return state.visual.motion&&!reduceMotion();}
  function mediaMarkup(media,alt=''){
    if(!media)return `<img src="${escape(originalPhoto.src)}" alt="${escape(alt)}">`;
    const label=escape(alt),url=escape(media.url),poster=escape(media.poster);
    if(media.kind==='video')return `<video data-memo-media muted loop playsinline preload="metadata" poster="${poster}" src="${url}" aria-label="${label}"></video>`;
    return `<img data-memo-media ${media.animated?`data-motion-src="${url}" data-still-src="${poster}"`:''} src="${media.animated&&!motionEnabled()?poster:url}" alt="${label}">`;
  }
  function renderBackground(){
    $$('.memo-photomedia video').forEach(video=>video.pause());
    $('.memo-photomedia').innerHTML=mediaMarkup(customBackground,customBackground?`自选主题背景：${customBackground.name}`:originalPhoto.alt);
    $('.memo-photomedia').classList.toggle('is-custom',!!customBackground);
    syncMotion();
  }
  function syncMotion(){
    const moving=motionEnabled();
    $$('video[data-memo-media]').forEach(video=>{
      const visible=!document.hidden&&(video.closest('.memo-launchscreen')?root.dataset.opening==='true'&&!$('.memo-launchscreen').hidden:video.closest('.memo-dialog')?!!activeModal:state.windowOpen&&state.running&&!activeModal);
      video.muted=true;
      if(moving&&visible)video.play().catch(()=>{});else video.pause();
    });
    $$('img[data-motion-src]').forEach(image=>{const src=moving?image.dataset.motionSrc:image.dataset.stillSrc;if(image.getAttribute('src')!==src)image.src=src;});
    const dynamic=customBackground?.animated||(state.visual.icon==='custom'&&customIcon?.animated);
    $$('[data-action="toggle-motion"]').forEach(button=>{button.hidden=button.closest('.memo-photo')?!customBackground?.animated:!dynamic;button.textContent=reduceMotion()?'已使用静态画面':moving?'暂停动态画面':'播放动态画面';button.disabled=reduceMotion();button.setAttribute('aria-pressed',String(moving));});
    const setting=$('[data-visual-motion]');if(setting){setting.checked=state.visual.motion;setting.disabled=reduceMotion();}
  }
  function reminderIconMarkup(){return state.visual.icon==='custom'&&customIcon?mediaMarkup(customIcon,'自选提醒图标'):icon(state.visual.icon);}
  function appearanceSection(){return `<section class="memo-iconsettings" aria-label="提醒图标设置"><div class="memo-settingrow"><div><strong>${icon('bell-ring')} 提醒图标</strong><p>选择图案，或让喜欢的画面动起来。</p></div><div class="memo-iconpreview">${reminderIconMarkup()}</div></div><label class="memo-field"><span>图标样式</span><select data-reminder-icon aria-label="提醒图标样式">${Object.entries(reminderIcons).map(([value,name])=>`<option value="${value}" ${state.visual.icon===value?'selected':''}>${name}</option>`).join('')}${customIcon?`<option value="custom" ${state.visual.icon==='custom'?'selected':''}>自选图片 / 动图 / 视频</option>`:''}</select></label><div class="memo-iconfilebar"><label class="memo-button memo-secondary memo-iconupload cursor-interaction">${icon('image-plus')}添加图片 / 动图 / 视频<input type="file" class="memo-iconinput cursor-interaction" aria-label="添加提醒图标图片、动图或视频" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime,.mov,.m4v"></label><button type="button" class="memo-iconbutton cursor-interaction" data-action="remove-icon" aria-label="移除自选提醒图标" ${customIcon?'':'hidden'}>${icon('trash-2')}</button></div><p class="memo-iconfilename" ${customIcon?'':'hidden'}>${escape(customIcon?.name||'')}</p><div class="memo-settingrow"><div><strong>动态画面</strong><p>${reduceMotion()?'系统已减少动态效果，使用静态画面。':'动图与视频循环播放，视频保持静音。'}</p></div><label class="memo-switch"><input type="checkbox" data-visual-motion aria-label="播放动态画面" ${state.visual.motion?'checked':''} ${reduceMotion()?'disabled':''}></label></div><p class="memo-soundhint">图片最多 20 MB，视频最多 100 MB。自选媒体仅保留于本次预览。</p><div class="memo-iconmessage" role="status" aria-live="polite">${escape(iconMessage)}</div></section>`;}
  function updateIconUI(){
    const preview=$('.memo-iconpreview');if(preview){preview.querySelectorAll('video').forEach(v=>v.pause());preview.innerHTML=reminderIconMarkup();}
    const select=$('[data-reminder-icon]');if(select){if(customIcon&&!select.querySelector('[value=custom]'))select.insertAdjacentHTML('beforeend','<option value="custom">自选图片 / 动图 / 视频</option>');if(!customIcon)select.querySelector('[value=custom]')?.remove();select.value=state.visual.icon;}
    const input=$('.memo-iconinput');if(input)input.disabled=iconLoading;
    const remove=$('[data-action="remove-icon"]');if(remove)remove.hidden=!customIcon;
    const file=$('.memo-iconfilename');if(file){file.hidden=!customIcon;file.textContent=customIcon?.name||'';}
    const message=$('.memo-iconmessage');if(message)message.textContent=iconMessage;
    icons();syncMotion();
  }
  async function addIcon(file){
    if(!file)return;
    try{MemoMedia.classify(file);}catch(error){iconMessage=error.message;updateIconUI();return;}
    const request=++iconRequest;let candidate=null;iconLoading=true;iconMessage='正在读取提醒图标…';updateIconUI();
    try{
      candidate=await MemoMedia.decode(file);if(request!==iconRequest)return;
      delete candidate.pixels;const previous=customIcon;customIcon=candidate;state.visual.icon='custom';iconMessage='已选用自选图标，可预览全屏提醒。';updateIconUI();persist();
      if(previous)URL.revokeObjectURL(previous.url);
    }catch(error){if(request===iconRequest)iconMessage=error.message;}
    finally{if(candidate&&customIcon!==candidate)URL.revokeObjectURL(candidate.url);if(request===iconRequest){iconLoading=false;updateIconUI();}}
  }
  function removeIcon(){iconRequest++;iconLoading=false;const previous=customIcon;customIcon=null;if(state.visual.icon==='custom')state.visual.icon='bell-ring';updateIconUI();if(previous)URL.revokeObjectURL(previous.url);iconMessage='已恢复内置提醒图标。';updateIconUI();persist();}
  function openIconSettings(){
    const reminderId=activeModal?.kind==='reminder'?activeModal.id:null;
    showModal('settings',dialogHead('提醒图标与动态画面','让每一次提醒，都有你喜欢的样子')+appearanceSection()+`<div class="memo-dialogfooter"><button type="button" class="memo-button memo-secondary cursor-interaction" data-action="preview-icon">${icon('play')}预览提醒</button><button type="button" class="memo-button memo-primary cursor-interaction" data-action="finish-icon">完成</button></div>`);
    activeModal.reminderId=reminderId;updateIconUI();
  }
  function soundName(){return state.sound.preset==='custom'&&customSound?customSound.name:soundPresets[state.sound.preset]?.name||soundPresets.bell.name;}
  function soundOptions(){return Object.entries(soundPresets).map(([key,item])=>`<option value="${key}" ${state.sound.preset===key?'selected':''}>${item.name}</option>`).join('')+(customSound?`<option value="custom" ${state.sound.preset==='custom'?'selected':''}>自选音效 / 音乐</option>`:'');}
  function soundSection(){return `<section class="memo-soundsettings" aria-label="提醒声音设置"><div class="memo-settingrow"><div><strong>${icon('volume-2')} 提醒声音</strong><p>让重要的小事，有自己的声音。</p></div><label class="memo-switch"><input type="checkbox" data-sound-enabled aria-label="提醒声音" ${state.sound.enabled?'checked':''}></label></div><label class="memo-field"><span>声音来源</span><select data-sound-preset aria-label="声音来源">${soundOptions()}</select></label><div class="memo-soundfilebar"><label class="memo-button memo-secondary memo-soundupload cursor-interaction">${icon('circle-plus')}添加音效 / 音乐<input type="file" class="memo-soundinput cursor-interaction" aria-label="添加音效或音乐" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.aif,.aiff"></label><button type="button" class="memo-button cursor-interaction" data-action="sound-preview">${icon('play')}试听</button><button type="button" class="memo-iconbutton cursor-interaction" data-action="remove-sound" aria-label="移除自选音频" ${customSound?'':'hidden'}>${icon('trash-2')}</button></div><div class="memo-soundfilename" ${customSound?'':'hidden'}>${icon('file-audio')}<span data-tooltip="${escape(customSound?.name||'')}">${escape(customSound?.name||'')}</span></div><div class="memo-soundvolumehead"><label for="memo-sound-volume">音量</label><output for="memo-sound-volume">${state.sound.volume}%</output></div><input type="range" id="memo-sound-volume" class="memo-soundvolume cursor-interaction" aria-label="提醒音量" min="0" max="100" step="1" value="${state.sound.volume}"><label class="memo-field memo-soundduration"><span>每次播放</span><select data-sound-duration aria-label="提醒声音播放时长">${[5,10,30].map(n=>`<option value="${n}" ${n===state.sound.duration?'selected':''}>最多 ${n} 秒</option>`).join('')}</select></label><p class="memo-soundhint">支持 MP3、WAV、M4A 等。自选音频仅保留于本次预览。</p><div class="memo-soundmessage" role="status" aria-live="polite">${escape(soundMessage)}</div></section>`;}
  function updateSoundUI(refreshSource=false) {
    if(refreshSource&&$('[data-sound-preset]'))$('[data-sound-preset]').innerHTML=soundOptions();
    const file=$('.memo-soundinput');if(file)file.disabled=soundLoading;
    const remove=$('[data-action="remove-sound"]');if(remove)remove.hidden=!customSound;
    const filename=$('.memo-soundfilename');if(filename){filename.hidden=!customSound;const label=filename.querySelector('span');label.textContent=customSound?.name||'';label.setAttribute('data-tooltip',customSound?.name||'');}
    const preview=$('[data-action="sound-preview"]');
    if(preview){preview.disabled=!state.sound.enabled||state.sound.volume===0||soundLoading;preview.innerHTML=soundPlaying?`${icon('square')}停止`:`${icon('play')}试听`;}
    const playback=$('[data-action="reminder-play-sound"]');
    if(playback){playback.hidden=!state.sound.enabled||state.sound.volume===0;playback.innerHTML=soundPlaying?`${icon('volume-2')}停止声音`:`${icon('volume-2')}播放声音`;}
    const status=$('.memo-soundmessage');if(status)status.textContent=soundMessage;
    const reminderStatus=$('.memo-remindersoundstatus');if(reminderStatus)reminderStatus.textContent=!state.sound.enabled||state.sound.volume===0?'本次静音':soundPlaying?'提醒声音播放中':soundMessage||soundName();
    icons();
  }
  function stopSound(message='') {
    playSequence++;clearTimeout(soundTimer);audio.pause();
    try{audio.currentTime=0;}catch{}
    soundPlaying=false;soundPurpose=null;
    if(message)soundMessage=message;
    updateSoundUI();
  }
  function scheduleSoundStop(){clearTimeout(soundTimer);if(!soundPlaying)return;const message=soundPurpose==='preview'?'试听结束。':'声音播放结束。';soundTimer=setTimeout(()=>stopSound(message),Math.max(0,state.sound.duration-audio.currentTime)*1000);}
  async function playSound(purpose='preview') {
    if(!state.sound.enabled||state.sound.volume===0){soundMessage=state.sound.enabled?'调高音量后即可试听。':'提醒声音已关闭。';updateSoundUI();return;}
    stopSound();const sequence=playSequence;
    audio.src=state.sound.preset==='custom'&&customSound?customSound.url:soundPresets[state.sound.preset]?.url||soundPresets.bell.url;
    audio.volume=state.sound.volume/100;audio.loop=false;soundPurpose=purpose;
    try{
      await audio.play();if(sequence!==playSequence)return;
      soundPlaying=true;soundMessage=purpose==='preview'?`正在试听：${soundName()}`:'提醒声音播放中';updateSoundUI();
      scheduleSoundStop();
    }catch(error){if(sequence!==playSequence)return;soundPlaying=false;soundPurpose=null;soundMessage=error.name==='NotAllowedError'?'点击播放按钮，即可播放声音。':'音频暂时无法播放，请换一个文件或内置铃声。';updateSoundUI();}
  }
  audio.addEventListener('ended',()=>{if(audio.ended)stopSound(soundPurpose==='preview'?'试听结束。':'声音播放结束。');});
  audio.addEventListener('error',()=>{if(soundPlaying)stopSound('音频播放中断，请更换文件或内置铃声。');});
  async function addSound(file) {
    if(!file)return;
    if(file.size>50*1024*1024){soundMessage='请选择 50 MB 以内的音效或音乐。';updateSoundUI();return;}
    if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|aiff?|weba)$/i.test(file.name)){soundMessage='请选择 MP3、WAV、M4A 等音频文件。';updateSoundUI();return;}
    stopSound();const request=++soundRequest,url=URL.createObjectURL(file),candidate=new Audio();
    soundLoading=true;soundMessage='正在读取音频…';updateSoundUI();
    try{
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>finish(false),12000);
        function finish(ok){clearTimeout(timer);candidate.oncanplay=null;candidate.onerror=null;ok?resolve():reject(new Error('decode'));}
        candidate.oncanplay=()=>finish(Number.isFinite(candidate.duration)&&candidate.duration>0);
        candidate.onerror=()=>finish(false);candidate.preload='auto';candidate.src=url;candidate.load();
      });
      if(request!==soundRequest)return;
      const old=customSound;customSound={url,name:file.name,duration:candidate.duration};state.sound.preset='custom';
      soundMessage='已选用自选音频，点击“试听”听听看。';if(old)URL.revokeObjectURL(old.url);
      persist();
    }catch{if(request===soundRequest)soundMessage='音频无法读取，请尝试 MP3、WAV 或 M4A；当前声音已保留。';}
    finally{candidate.removeAttribute('src');candidate.load();if(customSound?.url!==url)URL.revokeObjectURL(url);if(request===soundRequest){soundLoading=false;updateSoundUI(true);}}
  }
  function removeSound(){soundRequest++;soundLoading=false;stopSound();if(customSound)URL.revokeObjectURL(customSound.url);customSound=null;if(state.sound.preset==='custom')state.sound.preset='bell';soundMessage='已移除自选音频。';updateSoundUI(true);persist();}
  function renderDraft() {
    $('.memo-quickcontent').value=state.draft.content;
    $('.memo-quicktags').value=state.draft.tags;
    $('.memo-quickcontent').placeholder=state.draft.type==='list'?'写下要做的事，每行一项…':'此刻在想什么？随手记下来…';
    ['text','list'].forEach(type=>{const button=$(`[data-action="draft-${type}"]`);button.classList.toggle('is-active',state.draft.type===type);button.setAttribute('aria-pressed',String(state.draft.type===type));});
    $('.memo-draftcolors').innerHTML=colorButtons(state.draft.color,'draft');
  }
  function renderNotes() {
    const query=state.search.trim().toLocaleLowerCase();
    const tags=[...new Set(['工作','生活','灵感',...state.notes.flatMap(n=>n.tags)])];
    $('.memo-filters').innerHTML=[['all','全部'],...tags.map(t=>[t,`# ${t}`])].map(([value,label])=>`<button type="button" class="memo-filter cursor-interaction" aria-pressed="${state.tag===value}" data-action="filter" data-tag="${escape(value)}">${escape(label)}</button>`).join('');
    const notes=state.notes.filter(n=>(state.tag==='all'||n.tags.includes(state.tag))&&(!query||[n.title,n.body,...n.tags,...(n.items||[]).map(i=>i.text)].join(' ').toLocaleLowerCase().includes(query))).sort((a,b)=>b.created.localeCompare(a.created));
    $('.memo-note-count').textContent=`${notes.length} 条记录`;
    const card=n=>`<article class="memo-notecard" style="--note-color:${colors[n.color].value}" data-note-id="${escape(n.id)}"><button type="button" class="memo-notetitle cursor-interaction" data-action="edit-note" data-id="${escape(n.id)}">${escape(n.title||(n.type==='list'?'待办清单':n.body.split('\n')[0].slice(0,24))||'无标题')}</button>${n.type==='list'?`<div class="memo-noteitems">${(n.items||[]).slice(0,4).map((item,index)=>`<label class="memo-taskrow ${item.done?'is-done':''}"><input type="checkbox" aria-label="${escape(item.text)}" data-note="${escape(n.id)}" data-item="${index}" ${item.done?'checked':''}><span>${escape(item.text)}</span></label>`).join('')}${(n.items||[]).length>4?`<div class="memo-moreitems">还有 ${(n.items||[]).length-4} 项，点击编辑查看</div>`:''}</div>`:`<div class="memo-notebody">${escape(n.body)}</div>`}<div class="memo-notetags">${n.tags.map(t=>`<span># ${escape(t)}</span>`).join('')}</div><div class="memo-notefooter"><span>${n.created.startsWith(today)?'今天':dateLabel(n.created.slice(0,10))}</span><div class="memo-cardactions"><button type="button" class="memo-iconbutton cursor-interaction" data-action="pin-note" data-id="${escape(n.id)}" aria-label="${n.pinned?'取消置顶':'置顶'}：${escape(n.title||'备忘录')}" aria-pressed="${n.pinned}">${icon('pin')}</button><button type="button" class="memo-iconbutton cursor-interaction" data-action="edit-note" data-id="${escape(n.id)}" aria-label="编辑：${escape(n.title||'备忘录')}">${icon('square-pen')}</button><button type="button" class="memo-iconbutton cursor-interaction" data-action="delete-note" data-id="${escape(n.id)}" aria-label="删除：${escape(n.title||'备忘录')}">${icon('trash-2')}</button></div></div></article>`;
    if(!notes.length){$('.memo-cardgroups').innerHTML=`<div class="memo-empty">${icon(query?'search':'sticky-note')}<p>${query?'没有找到这条记录。试试其他关键词。':'这里还是一片空白，记下第一个想法吧。'}</p>${query||state.tag!=='all'?'<button type="button" class="memo-button memo-secondary cursor-interaction" data-action="clear-filters">查看全部记录</button>':''}</div>`;}
    else{$('.memo-cardgroups').innerHTML=[true,false].map(pin=>{const group=notes.filter(n=>n.pinned===pin);return group.length?`<section class="memo-cardgroup"><div class="memo-groupheading">${icon(pin?'pin':'layout-grid')}${pin?'置顶的小事':'其他记录'}</div><div class="memo-cardgrid">${group.map(card).join('')}</div></section>`:'';}).join('');}
    icons();
  }
  function monthDays(month) {
    const first=dateObject(`${month}-01`);const mondayOffset=(first.getUTCDay()+6)%7;
    return Array.from({length:42},(_,i)=>addDays(`${month}-01`,i-mondayOffset));
  }
  function renderCalendar() {
    const [year,month]=state.month.split('-').map(Number);
    $('.memo-monthtitle').textContent=`${year}年 ${month}月`;
    const yearSelect=$('[data-calendar-part="year"]'),monthSelect=$('[data-calendar-part="month"]'),daySelect=$('[data-calendar-part="day"]');
    if(!yearSelect.options.length)yearSelect.innerHTML=Array.from({length:201},(_,index)=>`<option value="${1900+index}">${1900+index}</option>`).join('');
    if(!monthSelect.options.length)monthSelect.innerHTML=Array.from({length:12},(_,index)=>`<option value="${index+1}">${index+1}</option>`).join('');
    const days=daysInCalendarMonth(state.month);
    if(daySelect.options.length!==days)daySelect.innerHTML=Array.from({length:days},(_,index)=>`<option value="${index+1}">${index+1}</option>`).join('');
    yearSelect.value=String(year);monthSelect.value=String(month);daySelect.value=String(Number(state.selectedDate.slice(-2)));
    $('[data-action="previous-month"]').disabled=state.month==='1900-01';$('[data-action="next-month"]').disabled=state.month==='2100-12';
    $('.memo-daygrid').innerHTML=monthDays(state.month).map(iso=>{
      const count=state.events.filter(e=>e.date===iso).length;
      const allowed=validCalendarDate(iso);
      return `<button type="button" class="memo-day cursor-interaction ${iso.slice(0,7)!==state.month?'is-outside':''} ${iso===today?'is-today':''}" data-action="select-date" data-date="${iso}" aria-label="${iso}${iso===today?'，今天':''}${count?`，${count} 个事件`:''}${allowed?'，添加事件':'，超出可选日期范围'}" aria-pressed="${iso===state.selectedDate}" ${iso===today?'aria-current="date"':''} ${allowed?'':'disabled'}><span>${Number(iso.slice(-2))}</span>${count?`<span class="memo-eventcount" aria-hidden="true">${count}</span>`:''}</button>`;
    }).join('');
    $('.memo-agendacaption').textContent=`这一天的安排 · ${state.selectedDate.slice(0,4)}年`;
    $('.memo-agendadate').textContent=dateLabel(state.selectedDate,true);
    const events=state.events.filter(e=>e.date===state.selectedDate).sort((a,b)=>Number(b.allDay)-Number(a.allDay)||(a.start||'').localeCompare(b.start||'')||a.title.localeCompare(b.title,'zh-CN'));
    $('.memo-agenda').innerHTML=events.length?events.map(e=>`<div class="memo-agendaevent ${e.allDay?'is-all-day':''}" data-event-id="${escape(e.id)}"><span class="memo-eventstripe"></span><div class="memo-eventmain"><button type="button" class="cursor-interaction" data-action="edit-event" data-id="${escape(e.id)}">${escape(e.title)}</button><span class="memo-eventtime">${e.allDay?'全天':`${escape(e.start)} — ${escape(e.end)}`}</span>${e.reminder==='custom'?`<span class="memo-eventcustomtime">提醒：${escape(MemoReminders.label(MemoReminders.resolve(e)))}</span>`:''}${e.reminderStatus==='snoozed'?'<span class="memo-reminderstatus">已设为 10 分钟后提醒 · 演示</span>':e.reminderStatus==='dismissed'?'<span class="memo-reminderstatus">本次提醒已关闭</span>':''}</div>${e.reminder!=='none'?`<button type="button" class="memo-eventreminder cursor-interaction" data-action="event-reminder" data-id="${escape(e.id)}" aria-label="预览“${escape(e.title)}”提醒">${icon('bell')}<span>预览</span></button>`:''}</div>`).join(''):`<div class="memo-empty">${icon('calendar-heart')}<p>当天暂无事件<br>给生活留一点空白，也很好。</p><button type="button" class="memo-button memo-secondary cursor-interaction" data-action="new-event">${icon('plus')}添加事件</button></div>`;
    icons();
  }
  function renderShell() {
    root.dataset.view=state.view;
    $('.memo-window').hidden=!state.running||!state.windowOpen;
    $('.memo-resting').hidden=!state.running||state.windowOpen;
    $('.memo-stopped').hidden=state.running;
    $('.memo-tray').hidden=!state.running;
    $('[data-action="show-notes"]').setAttribute('aria-pressed',String(state.view==='notes'));
    $('[data-action="show-calendar"]').setAttribute('aria-pressed',String(state.view==='calendar'));
    $('.memo-systemdate').textContent=dateLabel(today,true);
    renderWelcome();
    $('.memo-search input').value=state.search;
    syncMotion();
  }
  function renderAll(){if(state.sound.preset==='custom'&&!customSound)state.sound.preset='bell';if(state.visual.icon==='custom'&&!customIcon)state.visual.icon='bell-ring';renderShell();renderDraft();renderNotes();renderCalendar();icons();}
  function setTray(open){trayOpen=open&&state.running;$('.memo-traymenu').hidden=!trayOpen;$('.memo-tray').setAttribute('aria-expanded',String(trayOpen));}
  function finishOpening(){
    clearTimeout(openingTimer);openingTimer=null;root.classList.remove('memo-opening');delete root.dataset.opening;delete root.dataset.openingIntro;
    $('.memo-launchscreen').hidden=true;$$('.memo-launchscreen video').forEach(video=>video.pause());
    $('.memo-launchpicture').replaceChildren();$('.memo-launchscenery').replaceChildren();
    $('[data-action="replay-opening"]').removeAttribute('aria-busy');
  }
  function startOpening(intro=true){
    finishOpening();
    if(reduceMotion()||activeModal||!state.running||!state.windowOpen)return;
    const mood=photoTheme?.opening||originalOpening;
    root.dataset.openingMotion=mood.motion;root.style.setProperty('--memo-launch-distance',`${mood.distance}px`);root.style.setProperty('--memo-launch-light',mood.glow);
    if(intro){
      $('.memo-launchscenery').innerHTML=`<img src="${escape(customBackground?.poster||originalPhoto.src)}" alt="">`;
      $('.memo-launchpicture').innerHTML=mediaMarkup(customBackground);
      $('.memo-launchpicture').classList.toggle('is-custom',!!customBackground);
    }
    $('.memo-launchscreen').hidden=!intro;root.dataset.openingIntro=String(intro);
    void root.offsetWidth;
    root.classList.add('memo-opening');root.dataset.opening='true';$('[data-action="replay-opening"]').setAttribute('aria-busy','true');
    syncMotion();openingTimer=setTimeout(finishOpening,intro?1900:760);
  }
  function openWindow(animate=true){const reopening=!state.running||!state.windowOpen;state.running=true;state.windowOpen=true;setTray(false);renderShell();persist();if(animate&&reopening)startOpening();}
  function showModal(kind,html) {
    finishOpening();
    if(activeModal)closeModal(true);
    setTray(false);clearTimeout(noteTimer);
    returnFocus=root.contains(document.activeElement)?document.activeElement:lastTrigger;
    activeModal={kind};
    if(kind==='reminder')root.dataset.reminderOpen='true';
    $('.memo-overlayhost').innerHTML=`<div class="memo-overlay ${kind==='reminder'?'memo-fullscreen':''}"><section class="memo-dialog ${kind==='reminder'?'memo-reminder':''}" role="${kind==='reminder'?'alertdialog':'dialog'}" aria-modal="true" aria-labelledby="memo-dialog-title">${html}</section></div>`;
    $('.memo-background').inert=true;$('.memo-previewbar').inert=true;
    icons();syncMotion();
    $('.memo-stage').style.minHeight=kind==='reminder'?'':`${Math.max(560,$('.memo-dialog').offsetHeight+125)}px`;
    const first=kind==='reminder'?$('.memo-reminderactions [data-action="reminder-dismiss"]'):$('.memo-dialog input:not([type=hidden]),.memo-dialog textarea,.memo-dialog select')||$('.memo-dialog button');
    if(first)first.focus();
    $('.memo-dialog').scrollIntoView({block:'center',behavior:'instant'});
  }
  function closeModal(immediate=false,after=null) {
    if(!activeModal){after?.();return;}
    if(activeModal.kind==='reminder'||activeModal.kind==='settings')stopSound(soundPlaying?'声音已停止。':'');
    $$('.memo-dialog video').forEach(video=>video.pause());
    clearTimeout(noteTimer);
    const overlay=$('.memo-overlay');
    if(!immediate&&overlay?.classList.contains('is-closing'))return;
    const focus=returnFocus;
    const closingKind=activeModal.kind;
    const finish=()=>{
      $('.memo-overlayhost').replaceChildren();activeModal=null;returnFocus=null;delete root.dataset.reminderOpen;
      $('.memo-stage').style.minHeight='';
      $('.memo-background').inert=false;$('.memo-previewbar').inert=false;
      if(closingKind==='welcome')renderWelcome();
      syncMotion();
      const equivalent=focus?.dataset?.action?$$('button[data-action]').find(b=>b.dataset.action===focus.dataset.action&&(!focus.dataset.id||b.dataset.id===focus.dataset.id)&&(!focus.dataset.date||b.dataset.date===focus.dataset.date)):null;
      const destination=focus?.isConnected?focus:equivalent;
      if(destination&&!destination.closest('[hidden]'))destination.focus({preventScroll:true});
      else $('.memo-tray').focus({preventScroll:true});
      after?.();
    };
    if(immediate||reduceMotion())finish();else{overlay.classList.add('is-closing');setTimeout(finish,160);}
  }
  function closeRequested(){if(activeModal?.kind==='note')flushNote();closeModal();}
  const dialogHead=(title,caption='')=>`<div class="memo-dialoghead"><div>${caption?`<div class="memo-dialoglabel">${escape(caption)}</div>`:''}<h2 id="memo-dialog-title">${escape(title)}</h2></div><button type="button" class="memo-iconbutton cursor-interaction" data-action="close-dialog" aria-label="关闭弹窗">${icon('x')}</button></div>`;
  function renderWelcome(welcome=state.welcome){
    $('.memo-datecaption').textContent=[welcome.showDate?dateLabel(today,true):'',welcome.greeting.trim()].filter(Boolean).join(' · ');
    const title=welcome.title.trim(),punctuation=/[。！？.!?]$/.test(title)?title.slice(-1):'';
    $('.memo-welcometitle').innerHTML=escape(punctuation?title.slice(0,-1):title).replace(/\n/g,'<br>')+(punctuation?`<span>${escape(punctuation)}</span>`:'');
    $('.memo-welcomedescription').textContent=welcome.description;
    $('.memo-welcomedescription').hidden=!welcome.description.trim();
    $('.memo-welcomefoot').innerHTML=icon(welcome.icon)+`<span>${escape(welcome.footer)}</span>`;
    $('.memo-welcomefoot').hidden=!welcome.footer.trim();icons();
  }
  function welcomeFormValue(){
    const form=$('.memo-welcomeform');
    return {greeting:form.elements.greeting.value,title:form.elements.welcomeTitle.value,description:form.elements.description.value,footer:form.elements.footer.value,icon:form.elements.welcomeIcon.value,showDate:form.elements.showDate.checked};
  }
  function openWelcome(){
    const value=state.welcome;
    showModal('welcome',dialogHead('编辑欢迎区','把这里，写成你喜欢的样子')+`<form class="memo-welcomeform" novalidate><label class="memo-field"><span>顶部问候语</span><input name="greeting" maxlength="80" value="${escape(value.greeting)}" placeholder="给今天一个好开始"></label><label class="memo-checkfield"><input type="checkbox" name="showDate" ${value.showDate?'checked':''}>显示今天的日期</label><label class="memo-field"><span>主标题（可换行）</span><textarea name="welcomeTitle" maxlength="120" rows="2" required>${escape(value.title)}</textarea></label><label class="memo-field"><span>说明文字</span><textarea name="description" maxlength="200" rows="2" placeholder="把灵感留下，把日子慢慢过好。">${escape(value.description)}</textarea></label><label class="memo-field"><span>底部短句</span><input name="footer" maxlength="100" value="${escape(value.footer)}" placeholder="每一天，都值得好好记录"></label><label class="memo-field"><span>短句图标</span><select name="welcomeIcon">${Object.entries(welcomeIcons).map(([key,label])=>`<option value="${key}" ${value.icon===key?'selected':''}>${label}</option>`).join('')}</select></label><div class="memo-formerror" role="alert" hidden></div><div class="memo-welcomestatus" role="status" aria-live="polite"></div><div class="memo-dialogfooter"><button type="button" class="memo-button memo-quiet cursor-interaction" data-action="reset-welcome">恢复默认</button><div><button type="button" class="memo-button cursor-interaction" data-action="close-dialog">取消</button><button type="button" class="memo-button memo-primary cursor-interaction" data-action="save-welcome">保存</button></div></div></form>`);
  }
  function saveWelcome(){
    const value=welcomeFormValue();
    if(!value.title.trim()){$('.memo-welcomeform .memo-formerror').textContent='请填写主标题。';$('.memo-welcomeform .memo-formerror').hidden=false;$('.memo-welcomeform [name=welcomeTitle]').focus();return;}
    state.welcome=restoreWelcome(value);renderWelcome();persist();closeModal();toast('欢迎区文字已保存。');
  }
  function resetWelcome(){
    const form=$('.memo-welcomeform');
    ['greeting','description','footer'].forEach(key=>form.elements[key].value=welcomeDefaults[key]);
    form.elements.welcomeTitle.value=welcomeDefaults.title;form.elements.welcomeIcon.value=welcomeDefaults.icon;form.elements.showDate.checked=true;
    $('.memo-welcomeform .memo-formerror').hidden=true;$('.memo-welcomestatus').textContent='已恢复默认文字，保存后生效。';renderWelcome(welcomeDefaults);
  }
  function itemLines(note){return(note.items||[]).map(i=>i.text).join('\n');}
  function openNote(id) {
    openWindow();state.view='notes';renderShell();
    const note=state.notes.find(n=>n.id===id);if(!note)return;
    const html=dialogHead('编辑备忘录','把想法好好留住')+`<form class="memo-noteform"><label class="memo-field"><span>标题 · 可选</span><input name="title" maxlength="100" value="${escape(note.title)}" placeholder="给这条记录起个名字"></label><div class="memo-dialogtypes"><button type="button" class="cursor-interaction" data-action="note-type-text" aria-pressed="${note.type==='text'}">文字</button><button type="button" class="cursor-interaction" data-action="note-type-list" aria-pressed="${note.type==='list'}">待办清单</button></div><label class="memo-field"><span class="memo-editcontentlabel">${note.type==='list'?'清单内容 · 每行一项':'内容'}</span><textarea name="content" maxlength="2400" rows="5">${escape(note.type==='list'?itemLines(note):note.body)}</textarea></label><label class="memo-field"><span>标签 · 用逗号分隔</span><input name="tags" maxlength="100" value="${escape(note.tags.join('，'))}" placeholder="生活，灵感"></label><div class="memo-colorrow"><span style="font-size:12px;color:var(--memo-muted)">卡片颜色</span><div class="memo-colorchoices">${colorButtons(note.color,'note')}</div></div><label class="memo-checkfield" style="margin-top:15px;margin-bottom:0"><input name="pinned" type="checkbox" ${note.pinned?'checked':''}>置顶这条记录</label><div class="memo-formerror" role="alert" hidden></div><div class="memo-dialogfooter"><span class="memo-autosavestatus" aria-live="polite">编辑后自动暂存</span><div><button type="button" class="memo-button memo-danger cursor-interaction" data-action="delete-note" data-id="${escape(note.id)}">删除</button><button type="button" data-action="save-note" class="memo-button memo-primary cursor-interaction">完成</button></div></div></form>`;
    showModal('note',html);activeModal.id=id;activeModal.type=note.type;activeModal.color=note.color;
  }
  function noteFromForm() {
    const form=$('.memo-noteform');if(!form||activeModal?.kind!=='note')return null;
    const existing=state.notes.find(n=>n.id===activeModal.id);if(!existing)return null;
    const content=form.elements.content.value;
    if(!content.trim()&&!form.elements.title.value.trim())return null;
    const oldItems=existing.items||[];
    const textLines=content.split('\n').map(t=>t.trim()).filter(Boolean);
    const next={...existing,title:form.elements.title.value.trim(),tags:splitTags(form.elements.tags.value),color:activeModal.color,type:activeModal.type,pinned:form.elements.pinned.checked};
    if(next.type==='list'){next.items=textLines.map(text=>({text,done:oldItems.find(i=>i.text===text)?.done||false}));next.body='';}
    else{next.body=content;delete next.items;}
    return next;
  }
  function flushNote() {
    clearTimeout(noteTimer);const note=noteFromForm();
    if(!note){if($('.memo-noteform .memo-formerror')){$('.memo-noteform .memo-formerror').textContent='请保留标题或内容。';$('.memo-noteform .memo-formerror').hidden=false;}return false;}
    state.notes=state.notes.map(n=>n.id===note.id?note:n);renderNotes();persist();
    if($('.memo-autosavestatus'))$('.memo-autosavestatus').textContent='已暂存';
    if($('.memo-noteform .memo-formerror'))$('.memo-noteform .memo-formerror').hidden=true;
    return true;
  }
  function queueNote(){if($('.memo-autosavestatus'))$('.memo-autosavestatus').textContent='正在暂存…';clearTimeout(noteTimer);noteTimer=setTimeout(flushNote,400);}
  function reminderOptions(allDay,selected) {
    const values=allDay?[['none','不提醒'],['today9','当天 09:00'],['previous9','前一天 09:00']]:[['none','不提醒'],['0','事件开始时'],['10','提前 10 分钟'],['30','提前 30 分钟'],['60','提前 1 小时'],['1440','提前 1 天']];
    values.push(['custom','自定义时间…']);
    const valid=values.some(([v])=>v===selected)?selected:(allDay?'today9':'10');
    return values.map(([v,label])=>`<option value="${v}" ${v===valid?'selected':''}>${label}</option>`).join('');
  }
  function openEvent(id=null) {
    openWindow();
    const event=id?state.events.find(e=>e.id===id):null;if(id&&!event)return;
    const data=event||{title:'',date:state.selectedDate,allDay:true,start:'09:00',end:'10:00',notes:'',reminder:'today9'};
    const custom=data.customReminder,mode=custom?.mode||'offset';
    const at=(custom?.mode==='datetime'?custom.at:MemoReminders.resolve(data))||`${data.date}T${data.allDay?'09:00':data.start||'09:00'}`;
    const amount=custom?.mode==='offset'?custom.amount:15,unit=custom?.mode==='offset'?custom.unit:'minutes';
    const html=dialogHead(event?'编辑事件':'添加事件',dateLabel(data.date,true))+`<form class="memo-eventform" novalidate>
      <label class="memo-field"><span>事件标题</span><input name="title" maxlength="120" value="${escape(data.title)}" placeholder="这一天，想做些什么？" required></label>
      <label class="memo-field"><span>日期</span><input name="date" type="date" value="${data.date}" min="1900-01-01" max="2100-12-31" required></label>
      <label class="memo-checkfield"><input name="allDay" type="checkbox" ${data.allDay?'checked':''}>全天事件</label>
      <div class="memo-fieldrow memo-timefields" ${data.allDay?'hidden':''}><label class="memo-field"><span>开始时间</span><input name="start" type="time" value="${escape(data.start)}"></label><label class="memo-field"><span>结束时间</span><input name="end" type="time" value="${escape(data.end)}"></label></div>
      <label class="memo-field"><span>提醒</span><select name="reminder" aria-label="提醒">${reminderOptions(data.allDay,data.reminder)}</select></label>
      <div class="memo-customreminder" data-mode="${mode}" data-datetime-touched="${mode==='datetime'}" ${data.reminder==='custom'?'':'hidden'}>
        <div class="memo-remindermodes" aria-label="自定义提醒方式"><button type="button" class="cursor-interaction" data-action="custom-reminder-offset" aria-pressed="${mode==='offset'}">提前多久</button><button type="button" class="cursor-interaction" data-action="custom-reminder-datetime" aria-pressed="${mode==='datetime'}">指定时间</button></div>
        <div class="memo-fieldrow memo-reminderoffsetfields" ${mode==='offset'?'':'hidden'}><label class="memo-field"><span>提前数值</span><input name="reminderAmount" type="number" aria-label="自定义提前数值" min="0" max="525600" step="1" value="${amount}"></label><label class="memo-field"><span>单位</span><select name="reminderUnit" aria-label="自定义提前单位">${[['minutes','分钟'],['hours','小时'],['days','天']].map(([v,label])=>`<option value="${v}" ${unit===v?'selected':''}>${label}</option>`).join('')}</select></label></div>
        <div class="memo-fieldrow memo-reminderdatetimefields" ${mode==='datetime'?'':'hidden'}><label class="memo-field"><span>提醒日期</span><input name="reminderDate" aria-label="提醒日期" type="date" min="1900-01-01" max="2100-12-31" value="${at.slice(0,10)}"></label><label class="memo-field"><span>提醒时间</span><input name="reminderTime" aria-label="提醒时间" type="time" value="${at.slice(11)}"></label></div>
        <p class="memo-customreminderhint"></p><div class="memo-reminderpreview" role="status" aria-live="polite"></div>
      </div>
      <label class="memo-field"><span>备注 · 可选</span><textarea name="notes" maxlength="1200" rows="2" placeholder="记下地点，或一点小细节…">${escape(data.notes)}</textarea></label>
      <div class="memo-formerror" role="alert" hidden></div><div class="memo-dialogfooter"><span class="memo-autosavestatus">提醒仅作预览演示</span><div>${event?`<button type="button" class="memo-button memo-danger cursor-interaction" data-action="delete-event" data-id="${escape(event.id)}">删除</button>`:'<button type="button" class="memo-button cursor-interaction" data-action="close-dialog">取消</button>'}<button type="button" data-action="save-event" class="memo-button memo-primary cursor-interaction">${event?'保存修改':'添加事件'}</button></div></div></form>`;
    showModal('event',html);activeModal.id=id;updateReminderForm();
  }
  function customReminderFromForm(form) {
    if($('.memo-customreminder').dataset.mode==='datetime')return {mode:'datetime',at:`${form.elements.reminderDate.value}T${form.elements.reminderTime.value}`};
    return {mode:'offset',amount:form.elements.reminderAmount.value===''?NaN:Number(form.elements.reminderAmount.value),unit:form.elements.reminderUnit.value};
  }
  function updateReminderForm() {
    const form=$('.memo-eventform');if(!form)return;
    const box=$('.memo-customreminder'),custom=form.elements.reminder.value==='custom',mode=box.dataset.mode;
    box.hidden=!custom;$('.memo-reminderoffsetfields').hidden=mode!=='offset';$('.memo-reminderdatetimefields').hidden=mode!=='datetime';
    $$('.memo-remindermodes button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.action===`custom-reminder-${mode}`)));
    form.elements.reminderAmount.max=String({minutes:525600,hours:8760,days:365}[form.elements.reminderUnit.value]);
    $('.memo-customreminderhint').textContent=mode==='datetime'?'按你选定的日期和时刻提醒，修改事件日期时保持此时间。':form.elements.allDay.checked?'全天事件按当天 09:00 计算提前量。':'根据事件开始时间计算，修改事件时间时同步调整。';
    if(custom){const checked=MemoReminders.checkCustom({date:form.elements.date.value,allDay:form.elements.allDay.checked,start:form.elements.start.value},customReminderFromForm(form));$('.memo-reminderpreview').textContent=checked.at?`将在 ${MemoReminders.label(checked.at)} 提醒 · 北京时间`:(checked.error||'请完善提醒时间。');}
    if(activeModal?.kind==='event')$('.memo-stage').style.minHeight=`${Math.max(560,$('.memo-dialog').offsetHeight+125)}px`;
  }
  function changeReminderMode(mode) {
    const form=$('.memo-eventform'),box=$('.memo-customreminder');if(!form||!box)return;
    if(mode==='datetime'&&box.dataset.mode==='offset'&&box.dataset.datetimeTouched!=='true'){
      const result=MemoReminders.checkCustom({date:form.elements.date.value,allDay:form.elements.allDay.checked,start:form.elements.start.value},customReminderFromForm(form));
      if(result.at){form.elements.reminderDate.value=result.at.slice(0,10);form.elements.reminderTime.value=result.at.slice(11);}
    }
    box.dataset.mode=mode;updateReminderForm();$('.memo-dialog').scrollIntoView({block:'center',behavior:'instant'});
  }
  function saveEvent() {
    const form=$('.memo-eventform');if(!form)return;
    const title=form.elements.title.value.trim(),date=form.elements.date.value,allDay=form.elements.allDay.checked,start=form.elements.start.value,end=form.elements.end.value;
    let error='',errorField='title';
    if(!title)error='请填写事件标题。';else if(!validDate(date)||date<'1900-01-01'||date>'2100-12-31'){error='请选择有效日期（1900—2100 年）。';errorField='date';}else if(!allDay&&(!start||!end||end<=start)){error='结束时间必须晚于开始时间，请在同一天内设置。';errorField='end';}
    const reminder=form.elements.reminder.value,customReminder=reminder==='custom'?customReminderFromForm(form):null;
    if(!error&&customReminder){const checked=MemoReminders.checkCustom({date,allDay,start},customReminder);if(checked.error){error=checked.error;errorField=checked.field;}}
    if(error){$('.memo-eventform .memo-formerror').textContent=error;$('.memo-eventform .memo-formerror').hidden=false;form.elements[errorField]?.focus();return;}
    const id=activeModal.id||uid('e');const previous=state.events.find(e=>e.id===id);
    const event={id,title,date,allDay,start,end,notes:form.elements.notes.value.trim(),reminder,reminderStatus:reminder==='none'?'off':'scheduled',...(customReminder?{customReminder}:{})};
    if(previous)state.events=state.events.map(e=>e.id===id?event:e);else state.events.push(event);
    state.selectedDate=date;state.month=date.slice(0,7);renderCalendar();persist();closeModal();toast(previous?'事件已更新，提醒设置已同步。':'新的安排，已经记下。');
  }
  function reminderText(event) {
    if(event.reminder==='none')return '未设置提醒';
    if(event.reminder==='custom')return `${MemoReminders.label(MemoReminders.resolve(event))} 提醒（自定义）`;
    if(event.allDay)return event.reminder==='previous9'?'前一天 09:00 提醒':'当天 09:00 提醒';
    const value=Number(event.reminder);return value===0?'事件开始时提醒':`提前 ${value===1440?'1 天':value===60?'1 小时':`${value} 分钟`}提醒`;
  }
  function openReminder(id=null) {
    const event=(id?state.events.find(e=>e.id===id):state.events.find(e=>e.date===state.selectedDate&&e.reminder!=='none'))||(!id?state.events.find(e=>e.reminder!=='none'):null);
    if(!event){toast('先为一个事件设置提醒，再来预览。');return;}
    if(activeModal?.kind==='reminder'&&activeModal.id===event.id)return;
    const html=`<div class="memo-reminderscenery ${customBackground?'is-custom':''}" aria-hidden="true">${mediaMarkup(customBackground)}</div>
      <div class="memo-fullscreenheader"><div><strong>Memo</strong><span>全屏提醒 · 预览</span></div><button type="button" class="memo-iconbutton cursor-interaction" data-action="reminder-dismiss" aria-label="关闭全屏提醒">${icon('x')}</button></div>
      <div class="memo-fullscreenfocus"><div class="memo-reminderpill">你有一个日程提醒</div><div class="memo-remindericonwrap"><button type="button" class="memo-bellcircle ${state.visual.icon==='custom'?'is-custommedia':''} cursor-interaction" data-action="icon-settings" aria-label="更换提醒图标" data-tooltip="选择图片、动图或视频">${reminderIconMarkup()}</button><span>更换图标</span></div>
        <h2 id="memo-dialog-title">${escape(event.title)}</h2>
        <div class="memo-reminderdate"><span>${event.date.slice(0,4)}年${dateLabel(event.date,true)}</span><strong>${event.allDay?'全天事件':`${escape(event.start)} — ${escape(event.end)}`}</strong></div>
        <p class="memo-reminderschedule">${reminderText(event)}</p>
        ${event.notes?`<p class="memo-remindernotes">${escape(event.notes)}</p>`:''}
        <div class="memo-remindersoundbar"><span class="memo-remindersoundstatus" role="status" aria-live="polite"></span><div><button type="button" class="memo-button memo-quiet cursor-interaction" data-action="reminder-play-sound">${icon('volume-2')}播放声音</button><button type="button" class="memo-iconbutton cursor-interaction" data-action="reminder-replay" aria-label="重播全屏提醒动画和声音" data-tooltip="重播动画与声音">${icon('rotate-ccw')}</button><button type="button" class="memo-iconbutton cursor-interaction" data-action="sound-settings" aria-label="添加或更换提醒音效与音乐">${icon('music-2')}</button></div></div>
        <button type="button" class="memo-button memo-quiet memo-remindermotion cursor-interaction" data-action="toggle-motion" hidden>暂停动态画面</button>
        <div class="memo-reminderactions"><button type="button" class="memo-button memo-primary cursor-interaction" data-action="reminder-dismiss">知道了</button><div><button type="button" class="memo-button memo-secondary cursor-interaction" data-action="reminder-snooze">10 分钟后提醒</button><button type="button" class="memo-button cursor-interaction" data-action="reminder-view">查看事件</button></div></div>
        <p class="memo-reminderfoot">按 Esc 也可以关闭提醒</p>
      </div>`;
    showModal('reminder',html);activeModal.id=event.id;soundMessage='';updateSoundUI();playSound('reminder');
  }
  function openSettings(focusSound=false) {
    if(focusSound){
      showModal('settings',dialogHead('声音与音乐','给提醒，选一个喜欢的声音')+soundSection()+`<div class="memo-dialogfooter"><span></span><button type="button" class="memo-button memo-primary cursor-interaction" data-action="close-dialog">完成</button></div>`);
      updateSoundUI();$('[data-sound-preset]').focus();$('.memo-dialog').scrollIntoView({block:'center',behavior:'instant'});return;
    }
    showModal('settings',dialogHead('设置','让 Memo 按你的习惯工作')+`<div class="memo-settingrow"><div><strong>登录时自动启动</strong><p>登录电脑后，在后台安静启动。</p></div><label class="memo-switch"><input type="checkbox" aria-label="登录时自动启动" ${state.autoStart?'checked':''}></label></div>${appearanceSection()}${soundSection()}<div class="memo-settingrow"><div><strong>菜单栏常驻</strong><p>关闭主窗口后，仍可随时打开 Memo。</p></div><span style="font-size:11px;color:var(--memo-blue)">已开启</span></div><div class="memo-settingrow"><div><strong>启动方式</strong><p>保留菜单栏入口，不自动展开主窗口。</p></div><span style="font-size:11px;color:var(--memo-blue);white-space:nowrap">后台启动</span></div><div class="memo-settingnotice">这是一轮界面预览。登录自启、菜单栏与定时提醒均为演示，不会更改电脑设置。</div><div class="memo-dialogfooter"><span></span><button type="button" class="memo-button memo-primary cursor-interaction" data-action="close-dialog">完成</button></div>`);
    updateSoundUI();updateIconUI();
  }
  function deleteNote(id) {
    const note=state.notes.find(n=>n.id===id);if(!note)return;
    clearTimeout(noteTimer);state.notes=state.notes.filter(n=>n.id!==id);
    if(activeModal?.id===id)closeModal(true);
    renderNotes();persist();toast('备忘录已删除。',()=>{state.notes.push(note);renderNotes();persist();});
  }
  function deleteEvent(id) {
    const event=state.events.find(e=>e.id===id);if(!event)return;
    state.events=state.events.filter(e=>e.id!==id);if(activeModal?.id===id)closeModal(true);
    renderCalendar();persist();toast('事件已删除，模拟提醒已取消。',()=>{state.events.push(event);renderCalendar();persist();});
  }
  function chooseCalendarDate(month,day) {
    if(!validCalendarMonth(month)||!Number.isInteger(day))return;
    state.month=month;state.selectedDate=calendarDateForMonth(month,day);renderCalendar();persist();
  }
  function changeMonth(delta) {
    const date=dateObject(`${state.month}-01`);date.setUTCMonth(date.getUTCMonth()+delta);chooseCalendarDate(dateKey(date).slice(0,7),Number(state.selectedDate.slice(-2)));
  }
  function createNote() {
    const content=$('.memo-quickcontent').value.trim();
    if(!content){$('.memo-composererror').textContent='先写下一个想法，或一项待办吧。';$('.memo-composererror').hidden=false;$('.memo-quickcontent').focus();return;}
    const note={id:uid('n'),title:'',type:state.draft.type,body:state.draft.type==='text'?content:'',tags:splitTags($('.memo-quicktags').value),color:state.draft.color,pinned:false,created:`${today}T${new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}`};
    if(note.type==='list'){note.items=content.split('\n').map(t=>t.replace(/^\s*(?:[-*]\s+|\[\s?\]\s*)/,'').trim()).filter(Boolean).map(text=>({text,done:false}));if(!note.items.length)return;}
    state.notes.push(note);state.draft.content='';state.draft.tags='';state.search='';state.tag='all';$('.memo-search input').value='';$('.memo-composererror').hidden=true;renderDraft();renderNotes();persist();toast('记下了，留给未来的自己。');$('.memo-quickcontent').focus();
  }
  root.addEventListener('submit',event=>{
    event.preventDefault();
    if(event.target.matches('.memo-composer'))createNote();
    else if(event.target.matches('.memo-noteform')){if(flushNote())closeModal();}
    else if(event.target.matches('.memo-eventform'))saveEvent();
    else if(event.target.matches('.memo-welcomeform'))saveWelcome();
  });
  root.addEventListener('input',event=>{
    state.updatedAt=Date.now();
    const target=event.target;
    if(target.closest('.memo-welcomeform')){renderWelcome(welcomeFormValue());$('.memo-welcomeform .memo-formerror').hidden=true;$('.memo-welcomestatus').textContent='保存后生效。';}
    if(target.matches('.memo-soundvolume')){state.sound.volume=Number(target.value);audio.volume=state.sound.volume/100;$('.memo-soundvolumehead output').textContent=`${state.sound.volume}%`;if(state.sound.volume===0)stopSound();else updateSoundUI();}
    if(target.matches('.memo-search input')){state.search=target.value;renderNotes();persist();}
    if(target.matches('.memo-quickcontent,.memo-quicktags')){state.draft.content=$('.memo-quickcontent').value;state.draft.tags=$('.memo-quicktags').value;$('.memo-composererror').hidden=true;clearTimeout(draftTimer);draftTimer=setTimeout(persist,350);}
    if(target.closest('.memo-noteform'))queueNote();
    if(target.closest('.memo-eventform')){if(target.matches('[name=reminderDate],[name=reminderTime]'))$('.memo-customreminder').dataset.datetimeTouched='true';updateReminderForm();$('.memo-eventform .memo-formerror').hidden=true;}
  });
  root.addEventListener('change',event=>{
    state.updatedAt=Date.now();
    const target=event.target;
    if(target.matches('[data-calendar-part]')){const year=$('[data-calendar-part="year"]').value,month=$('[data-calendar-part="month"]').value,day=Number($('[data-calendar-part="day"]').value);chooseCalendarDate(`${year}-${month.padStart(2,'0')}`,day);return;}
    if(target.closest('.memo-welcomeform')){renderWelcome(welcomeFormValue());$('.memo-welcomeform .memo-formerror').hidden=true;}
    if(target.matches('.memo-photoinput')){const file=target.files?.[0];target.value='';changePhoto(file);return;}
    if(target.matches('.memo-iconinput')){const file=target.files?.[0];target.value='';addIcon(file);return;}
    if(target.matches('[data-reminder-icon]')){iconRequest++;iconLoading=false;state.visual.icon=target.value;iconMessage=`已选用${target.value==='custom'?'自选媒体':reminderIcons[target.value]}图标。`;updateIconUI();persist();return;}
    if(target.matches('[data-visual-motion]')){state.visual.motion=target.checked;syncMotion();persist();return;}
    if(target.matches('.memo-soundinput')){const file=target.files?.[0];target.value='';addSound(file);return;}
    if(target.matches('[data-sound-enabled]')){state.sound.enabled=target.checked;if(!target.checked)stopSound();soundMessage=target.checked?'提醒声音已开启。':'提醒声音已关闭。';updateSoundUI();persist();return;}
    if(target.matches('[data-sound-preset]')){soundRequest++;soundLoading=false;stopSound();state.sound.preset=target.value;soundMessage=`已选用${soundName()}。`;updateSoundUI();persist();return;}
    if(target.matches('[data-sound-duration]')){state.sound.duration=Number(target.value);scheduleSoundStop();persist();return;}
    if(target.matches('.memo-soundvolume')){persist();return;}
    if(target.matches('.memo-taskrow input')){
      const note=state.notes.find(n=>n.id===target.dataset.note);if(note?.items[Number(target.dataset.item)]){note.items[Number(target.dataset.item)].done=target.checked;target.closest('.memo-taskrow').classList.toggle('is-done',target.checked);persist();}
    }
    if(target.matches('.memo-switch input[aria-label="登录时自动启动"]')){state.autoStart=target.checked;persist();}
    if(target.matches('.memo-eventform [name=allDay]')){$('.memo-timefields').hidden=target.checked;const select=$('.memo-eventform [name=reminder]');select.innerHTML=reminderOptions(target.checked,select.value);}
    if(target.closest('.memo-noteform'))queueNote();
    if(target.closest('.memo-eventform')){if(target.matches('[name=reminderDate],[name=reminderTime]'))$('.memo-customreminder').dataset.datetimeTouched='true';updateReminderForm();$('.memo-eventform .memo-formerror').hidden=true;}
  });
  root.addEventListener('click',event=>{
    const button=event.target.closest('button[data-action]');
    if(!button){if(event.target.closest('.memo-welcometext')&&!activeModal){lastTrigger=$('[data-action="edit-welcome"]');openWelcome();return;}const card=event.target.closest('.memo-notecard');if(card&&!event.target.closest('button,input,label'))openNote(card.dataset.noteId);return;}
    const action=button.dataset.action,id=button.dataset.id;
    state.updatedAt=Date.now();
    lastTrigger=button;
    if(action==='toggle-tray'){setTray(!trayOpen);return;}
    if(action==='reset-photo')resetPhoto();
    else if(action==='replay-opening'){openWindow(false);startOpening();}
    else if(action==='open-window')openWindow();
    else if(action==='record-note')createNote();
    else if(action==='save-note'){if(flushNote())closeModal();}
    else if(action==='save-event')saveEvent();
    else if(action==='edit-welcome')openWelcome();
    else if(action==='save-welcome')saveWelcome();
    else if(action==='reset-welcome')resetWelcome();
    else if(action==='custom-reminder-offset'||action==='custom-reminder-datetime')changeReminderMode(action==='custom-reminder-offset'?'offset':'datetime');
    else if(action==='new-note'){openWindow();state.view='notes';renderShell();$('.memo-quickcontent').focus();}
    else if(action==='close-window'){finishOpening();state.windowOpen=false;setTray(false);renderShell();persist();}
    else if(action==='simulate-login'){finishOpening();if(activeModal)closeModal(true);state.running=state.autoStart;state.windowOpen=false;setTray(false);renderShell();persist();toast(state.autoStart?'模拟登录完成：Memo 已在后台启动。':'模拟登录完成：Memo 未自动启动。');}
    else if(action==='show-notes'||action==='show-calendar'){state.view=action==='show-notes'?'notes':'calendar';renderShell();persist();}
    else if(action==='settings')openSettings();
    else if(action==='icon-settings')openIconSettings();
    else if(action==='remove-icon')removeIcon();
    else if(action==='toggle-motion'){state.visual.motion=!state.visual.motion;syncMotion();persist();}
    else if(action==='preview-icon'||action==='finish-icon'){const reminderId=activeModal?.reminderId;closeModal(true);if(action==='preview-icon'||reminderId)openReminder(reminderId);}
    else if(action==='sound-settings')openSettings(true);
    else if(action==='sound-preview'){if(soundPlaying)stopSound('试听已停止。');else playSound('preview');}
    else if(action==='reminder-play-sound'){if(soundPlaying)stopSound('声音已停止。');else playSound('reminder');}
    else if(action==='reminder-replay'&&activeModal?.kind==='reminder'){const eventId=activeModal.id;closeModal(true);openReminder(eventId);}
    else if(action==='remove-sound')removeSound();
    else if(action==='draft-text'||action==='draft-list'){state.draft.type=action==='draft-text'?'text':'list';renderDraft();persist();}
    else if(action==='draft-color'){state.draft.color=button.dataset.color;$('.memo-draftcolors').innerHTML=colorButtons(state.draft.color,'draft');persist();}
    else if(action==='filter'){state.tag=button.dataset.tag;renderNotes();persist();}
    else if(action==='clear-filters'){state.search='';state.tag='all';$('.memo-search input').value='';renderNotes();persist();}
    else if(action==='pin-note'){const note=state.notes.find(n=>n.id===id);if(note){note.pinned=!note.pinned;renderNotes();persist();}}
    else if(action==='edit-note')openNote(id);
    else if(action==='delete-note')deleteNote(id);
    else if(action==='note-color'){activeModal.color=button.dataset.color;$('.memo-colorchoices').innerHTML=colorButtons(activeModal.color,'note');queueNote();}
    else if(action==='note-type-text'||action==='note-type-list'){activeModal.type=action==='note-type-text'?'text':'list';$('.memo-editcontentlabel').textContent=activeModal.type==='list'?'清单内容 · 每行一项':'内容';$$('.memo-dialogtypes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===action)));queueNote();}
    else if(action==='previous-month')changeMonth(-1);
    else if(action==='next-month')changeMonth(1);
    else if(action==='today'){state.month=today.slice(0,7);state.selectedDate=today;renderCalendar();persist();}
    else if(action==='select-date'){state.selectedDate=button.dataset.date;state.month=state.selectedDate.slice(0,7);renderCalendar();persist();openEvent();}
    else if(action==='new-event')openEvent();
    else if(action==='edit-event')openEvent(id);
    else if(action==='delete-event')deleteEvent(id);
    else if(action==='preview-reminder'||action==='event-reminder')openReminder(id||null);
    else if(action==='close-dialog')closeRequested();
    else if(action==='reminder-dismiss'||action==='reminder-snooze'){
      const item=state.events.find(e=>e.id===activeModal?.id);if(item){item.reminderStatus=action==='reminder-snooze'?'snoozed':'dismissed';if(action==='reminder-snooze')item.snoozedUntil=new Date(Date.now()+600000).toISOString();renderCalendar();persist();}
      closeModal();if(action==='reminder-snooze')toast('已设为 10 分钟后提醒，本轮仅演示状态。');
    }
    else if(action==='reminder-view'){const eventId=activeModal.id;closeModal(true,()=>{const item=state.events.find(e=>e.id===eventId);if(item){state.selectedDate=item.date;state.month=item.date.slice(0,7);state.view='calendar';renderCalendar();openEvent(eventId);}});}
    else if(action==='undo'&&lastUndo){const undo=lastUndo;clearTimeout(toastTimer);lastUndo=null;$('.memo-toast').hidden=true;undo();toast('已恢复。');}
  });
  document.addEventListener('click',event=>{if(trayOpen&&!event.target.closest('.memo-traywrap'))setTray(false);});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&root.dataset.opening==='true'){event.preventDefault();finishOpening();return;}
    if(!root.contains(document.activeElement)&&!activeModal)return;
    if(event.key==='Escape'){if(activeModal){event.preventDefault();if(activeModal.kind==='reminder'){const item=state.events.find(e=>e.id===activeModal.id);if(item){item.reminderStatus='dismissed';renderCalendar();persist();}closeModal();}else closeRequested();}else setTray(false);}
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'&&!activeModal){event.preventDefault();openWindow();state.view='notes';renderShell();$('.memo-search input').focus();}
    if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();if(activeModal?.kind==='event')saveEvent();else if(activeModal?.kind==='welcome')saveWelcome();else if(activeModal?.kind==='note'){if(flushNote())closeModal();}else if(!activeModal)createNote();}
    if(event.key==='Enter'&&!event.metaKey&&!event.ctrlKey&&event.target.tagName==='INPUT'&&['event','note'].includes(activeModal?.kind)){event.preventDefault();if(activeModal.kind==='event')saveEvent();else if(activeModal.kind==='note'&&flushNote())closeModal();}
    if(event.key==='Tab'&&activeModal){const controls=$$('.memo-dialog button:not([disabled]),.memo-dialog input:not([disabled]),.memo-dialog textarea:not([disabled]),.memo-dialog select:not([disabled])').filter(el=>!el.closest('[hidden]'));const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  });
  window.addEventListener('openai:set_globals',event=>{
    if(!event.detail?.globals?.widgetState)return;
    const incoming=event.detail.globals.widgetState;
    const data=incoming.privateContent?.memo ?? incoming.privateContent;
    if(!data||data.version!==1||Number(data.updatedAt||0)<state.updatedAt)return;
    if(JSON.stringify(data)===lastPersisted)return;
    if(activeModal)return;
    if(activeModal)closeModal(true);state=restore(event.detail.globals.widgetState);renderAll();
  });
  window.addEventListener('pagehide',()=>{finishOpening();stopSound();soundRequest++;photoRequest++;iconRequest++;$$('video[data-memo-media]').forEach(v=>v.pause());[customSound,customBackground,customIcon].forEach(media=>{if(media)URL.revokeObjectURL(media.url);});});
  document.addEventListener('visibilitychange',syncMotion);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduceMotion())finishOpening();syncMotion();});
  renderAll();
  if(root.dataset.startReminder==='true'){
    const demonstrationEvent=state.events.find(e=>e.date===state.selectedDate&&!e.allDay&&e.reminder!=='none')||state.events.find(e=>!e.allDay&&e.reminder!=='none')||state.events.find(e=>e.reminder!=='none');
    if(demonstrationEvent)openReminder(demonstrationEvent.id);
  }else startOpening();
  if(globalThis.Tweak){const design={radius:16,gap:14};const tweak=new Tweak({container:root,onChange:()=>{root.style.setProperty('--memo-radius',`${design.radius}px`);root.style.setProperty('--memo-gap',`${design.gap}px`);}});tweak.addSlider(design,'radius',{label:'卡片圆角',min:8,max:24,unit:'px'});tweak.addSlider(design,'gap',{label:'卡片间距',min:10,max:22,unit:'px'});}
})();
