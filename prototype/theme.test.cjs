'use strict';
const assert = require('node:assert/strict');
const {extract, palette, contrast} = require('./theme.js');
const pixels = (...swatches) => new Uint8ClampedArray(swatches.flatMap(([rgb,count])=>Array.from({length:count},()=>[...rgb,255]).flat()));

const green = extract(pixels([[36,130,74],800],[[232,197,75],200]));
assert.match(green.name,/森林/);
assert.ok(!green.neutral);
assert.equal(green.opening.motion,'drift');
const red = extract(pixels([[180,37,61],1000]));
assert.match(red.name,/玫瑰/);
assert.equal(red.opening.motion,'glow');
const white = extract(pixels([[255,255,255],1000]));
const dark = extract(pixels([[8,8,8],1000]));
assert.ok(white.neutral && dark.neutral);
assert.equal(white.opening.motion,'soft');
assert.equal(dark.opening.motion,'soft');
const blue=extract(pixels([[45,148,210],1000]));
const night=extract(pixels([[8,20,66],1000]));
assert.equal(blue.opening.motion,'breeze');
assert.equal(night.opening.motion,'shimmer');
assert.ok(night.opening.glow>blue.opening.glow,'Darker photographs receive a stronger soft glow');
assert.ok(night.opening.distance<blue.opening.distance,'Darker photographs use a smaller travel distance');
assert.throws(()=>extract(new Uint8ClampedArray([100,50,20,0])),/没有可见内容/);
const monochrome = extract(pixels([[128,128,128],980],[[255,0,0],20]));
assert.ok(monochrome.neutral,'Tiny colored details should not tint a grayscale image');
const wrap = extract(pixels([[220,20,30],500],[[220,30,20],500]));
assert.match(wrap.name,/玫瑰/,'Reds on both sides of the hue boundary belong to the same theme');

let checked = 0;
for (let h=0;h<360;h+=5) {
  for (const s of [.05,.3,1]) {
    const theme = palette(h,s,(h+95)%360,s);
    assert.ok(contrast(theme.vars.blue,'#ffffff')>=4.5,'Primary button contrast');
    assert.ok(contrast(theme.vars.blue,theme.vars['blue-soft'])>=4.5,'Selected filter contrast');
    assert.ok(contrast(theme.vars.gold,theme.vars['gold-soft'])>=4.5,'Reminder text contrast');
    for (const background of [theme.vars.paper,...Object.values(theme.notes).map(n=>n.value)]) {
      assert.ok(contrast(theme.vars.ink,background)>=4.5,'Title contrast');
      assert.ok(contrast(theme.vars.muted,background)>=4.5,'Secondary text contrast');
      assert.ok(contrast(theme.vars.body,background)>=4.5,'Note content contrast');
    }
    checked++;
  }
}
console.log(`Photo theme checks passed: extraction, grayscale, transparency and ${checked} palette contrast combinations.`);
