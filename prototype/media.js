/* Local visual assets stay in memory; only appearance choices enter host state. */
const MemoMedia = (() => {
  'use strict';
  function classify(file) {
    const video = /^video\//.test(file.type) || (!file.type && /\.(mp4|m4v|mov|webm)$/i.test(file.name));
    const image = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) || (!file.type && /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name));
    if (!video && !image) throw new Error('请选择 JPG、PNG、GIF、WebP 图片，或 MP4、WebM、MOV 视频。');
    if (file.size > (video ? 100 : 20) * 1024 * 1024) throw new Error(video ? '视频超过 100 MB，请选择较小的视频。' : '图片超过 20 MB，请选择较小的图片。');
    return {kind:video?'video':'image',animated:video || /image\/(gif|webp|avif)/.test(file.type) || /\.(gif|webp|avif)$/i.test(file.name)};
  }
  async function decode(file) {
    const type = classify(file), url = URL.createObjectURL(file);
    const source = type.kind === 'video' ? document.createElement('video') : new Image();
    let timer;
    try {
      await new Promise((resolve,reject) => {
        const done = ok => {clearTimeout(timer);source.onload=null;source.onloadeddata=null;source.onerror=null;ok?resolve():reject(new Error('媒体无法读取，请尝试其他图片或 MP4 / WebM 视频；当前内容已保留。'));};
        timer = setTimeout(()=>done(false),12000);
        source.onerror = ()=>done(false);
        if (type.kind === 'video') {
          source.muted=true;source.playsInline=true;source.preload='auto';
          source.onloadeddata=()=>done(source.videoWidth>0 && source.videoHeight>0);
        } else source.onload=()=>done(source.naturalWidth>0 && source.naturalHeight>0);
        source.src=url;
        if(type.kind==='video')source.load();
      });
      // Wait for a decoded frame: loadeddata can precede a drawable frame in WebKit.
      if(type.kind==='video')await new Promise((resolve,reject)=>{
        const done=ok=>{clearTimeout(timer);source.onseeked=null;source.onerror=null;ok?resolve():reject(new Error('视频画面无法读取，请尝试 MP4 / WebM；当前内容已保留。'));};
        timer=setTimeout(()=>done(false),12000);
        source.onseeked=()=>done(true);source.onerror=()=>done(false);
        source.currentTime=Math.min(.1,Number.isFinite(source.duration)?source.duration/2:.1);
      });
      const width = source.videoWidth || source.naturalWidth, height = source.videoHeight || source.naturalHeight;
      const canvas = document.createElement('canvas'), ratio = Math.min(1,960/Math.max(width,height));
      canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      const context=canvas.getContext('2d');
      if(!context)throw new Error('当前预览无法读取媒体画面。');
      context.drawImage(source,0,0,canvas.width,canvas.height);
      const poster=canvas.toDataURL('image/png');
      canvas.width=64;canvas.height=64;
      context.drawImage(source,0,0,64,64);
      return {...type,url,poster,name:file.name,pixels:context.getImageData(0,0,64,64).data};
    } catch(error) {URL.revokeObjectURL(url);throw error;}
    finally {clearTimeout(timer);if(type.kind==='video'){source.pause();source.removeAttribute('src');source.load();}}
  }
  return {classify,decode};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MemoMedia;
