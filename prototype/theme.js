/* Local photo analysis. No photo pixels are sent to the host or saved in state. */
const MemoTheme = (() => {
  'use strict';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const lightness = (max + min) / 2;
    if (!delta) return [0, 0, lightness];
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return [(hue * 60 + 360) % 360, saturation, lightness];
  }
  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
    return rgb.map(v => Math.round((v + m) * 255));
  }
  const hex = rgb => '#' + rgb.map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
  const color = (h, s, l) => hex(hslToRgb((h + 360) % 360, s, l));
  function luminance(rgb) {
    const [r,g,b] = rgb.map(v => {v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;});
    return r * .2126 + g * .7152 + b * .0722;
  }
  function contrast(a, b) {
    const parse = value => value.match(/[a-f\d]{2}/gi).map(v => parseInt(v,16));
    const x = luminance(parse(a)), y = luminance(parse(b));
    return (Math.max(x,y) + .05) / (Math.min(x,y) + .05);
  }
  function readable(h, s, start = .40, background = '#ffffff') {
    let l = start;
    while (contrast(color(h,s,l), background) < 4.8 && l > .18) l -= .01;
    return color(h,s,l);
  }
  function colorName(h) {
    return h < 15 || h >= 345 ? '玫瑰' : h < 45 ? '暖橙' : h < 75 ? '麦金' : h < 165 ? '森林' : h < 200 ? '青绿' : h < 255 ? '海蓝' : h < 295 ? '暮紫' : '莓粉';
  }
  // Choose a visual mood from measured color, not an inferred scene label.
  function opening(h, neutral, lightness = .5) {
    const motion = neutral ? 'soft' : lightness < .25 ? 'shimmer' : h >= 165 && h < 255 ? 'breeze' : h >= 75 && h < 165 ? 'drift' : h < 75 || h >= 345 ? 'glow' : 'shimmer';
    const names = {breeze:'清风展开',drift:'轻盈舒展',glow:'暖光渐入',shimmer:'微光浮现',soft:'柔和展开'};
    return {motion,name:names[motion],distance:Math.round(8 + clamp(lightness,0,1) * 12),glow:Number((.16 + (1 - clamp(lightness,0,1)) * .18).toFixed(2))};
  }
  function palette(h, saturation, accentHue, accentSaturation, neutral = false) {
    const s = neutral ? .055 : clamp(saturation, .26, .64);
    const a = neutral ? .045 : clamp(accentSaturation, .24, .62);
    const softS = neutral ? .04 : .20;
    const vars = {
      'ink':color(h,softS,.22), 'muted':color(h,softS * .55,.36), 'body':color(h,softS * .7,.34),
      'blue':readable(h,s,.40,color(h,s * .7,.95)), 'blue-dark':readable(h,s,.31), 'blue-soft':color(h,s * .7,.95),
      'blue-border':color(h,s * .45,.86), 'blue-ring':color(h,s * .6,.60),
      'paper':color(h,softS,.982), 'surface':'#ffffff', 'line':color(h,softS,.89),
      'background':color(h,softS,.95), 'chrome':color(h,softS,.93), 'control':color(h,softS,.955),
      'gold':readable(accentHue,a,.40,color(accentHue,a,.90)), 'gold-soft':color(accentHue,a,.94), 'gold-tint':color(accentHue,a,.90),
      'gold-mark':color(accentHue,a,.58), 'toast':color(h,softS,.29)
    };
    const names = neutral ? ['柔白','雾灰','暖灰','浅灰','银灰'] : ['柔白',`${colorName(h)}浅色`,`${colorName(accentHue)}浅色`,'相邻浅色','淡彩'];
    const values = [color(h,softS,.975),color(h,s * .7,.93),color(accentHue,a * .7,.93),color(h + 30,s * .45,.945),color(accentHue - 25,a * .45,.955)];
    const name = neutral ? '柔和灰调' : colorName(h) === colorName(accentHue) ? `${colorName(h)}调` : `${colorName(h)} · ${colorName(accentHue)}`;
    return {vars,notes:Object.fromEntries(['cloud','sky','wheat','sage','rose'].map((key,i)=>[key,{name:names[i],value:values[i]}])),name,neutral,opening:opening(h,neutral)};
  }
  function extract(pixels) {
    const bins = Array.from({length:24},()=>({weight:0,x:0,y:0,s:0}));
    let visible = 0, chromatic = 0, lightnessTotal = 0;
    for (let i = 0; i + 3 < pixels.length; i += 4) {
      if (pixels[i+3] < 180) continue;
      visible++;
      const [h,s,l] = rgbToHsl(pixels[i],pixels[i+1],pixels[i+2]);
      lightnessTotal += l;
      if (s < .14 || l < .06 || l > .95) continue;
      chromatic++;
      const weight = (.45 + s) * (.5 + Math.sin(Math.PI * l) * .5);
      const bin = bins[Math.round(h / 15) % 24], radians = h * Math.PI / 180;
      bin.weight += weight; bin.x += Math.cos(radians) * weight; bin.y += Math.sin(radians) * weight; bin.s += s * weight;
    }
    if (!visible) throw new Error('图片没有可见内容，请换一张照片。');
    if (chromatic / visible < .025) {
      const theme=palette(220,.05,30,.05,true);
      theme.opening=opening(220,true,lightnessTotal/visible);
      return theme;
    }
    const ranked = bins.filter(b=>b.weight).map(b=>({weight:b.weight,h:(Math.atan2(b.y,b.x)*180/Math.PI+360)%360,s:b.s/b.weight})).sort((a,b)=>b.weight-a.weight);
    const primary = ranked[0];
    const distance = h => Math.min(Math.abs(h - primary.h),360 - Math.abs(h - primary.h));
    const secondary = ranked.find(b=>distance(b.h)>=45 && b.weight>=primary.weight*.08) || {h:(primary.h+30)%360,s:primary.s*.8};
    const theme=palette(primary.h,primary.s,secondary.h,secondary.s);
    theme.opening=opening(primary.h,false,lightnessTotal/visible);
    return theme;
  }
  return {extract,contrast,palette};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MemoTheme;
