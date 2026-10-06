/* Standalone browser storage. Notes stay on this device and origin. */
(() => {
  'use strict';
  const key='memo-sky-web-v1';
  function parse(value){try{return JSON.parse(value);}catch{return null;}}
  function read(){try{return parse(localStorage.getItem(key));}catch{return null;}}
  window.openai={
    widgetState:read(),
    setWidgetState(snapshot){
      window.openai.widgetState=snapshot;
      try{
        localStorage.setItem(key,JSON.stringify(snapshot));
        const status=document.querySelector('.memo-windowfooter>span:first-child');
        if(status)status.innerHTML='<span class="memo-save-dot"></span>已保存到本机';
        return Promise.resolve();
      }catch(error){
        const status=document.querySelector('.memo-windowfooter>span:first-child');
        if(status){status.textContent='未能保存到本机';status.setAttribute('role','alert');}
        return Promise.reject(error);
      }
    }
  };
  window.addEventListener('storage',event=>{
    if(event.key!==key||!event.newValue)return;
    const snapshot=parse(event.newValue);if(!snapshot)return;
    window.openai.widgetState=snapshot;
    window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:snapshot}}}));
  });
})();
