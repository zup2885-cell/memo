/* Reminder times are stored as Beijing wall-clock values, independent of device timezone. */
const MemoReminders = (() => {
  'use strict';
  const factors={minutes:1,hours:60,days:1440};
  const validUnit=unit=>typeof unit==='string'&&Object.hasOwn(factors,unit);
  function validDate(value) {
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>'2100-12-31')return false;
    const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
  }
  const validTime=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const validDateTime=value=>typeof value==='string'&&value.length===16&&value[10]==='T'&&validDate(value.slice(0,10))&&validTime(value.slice(11));
  function shift(value,minutes) {
    if(!validDateTime(value)||!Number.isSafeInteger(minutes))return null;
    const [y,m,d,h,n]=value.match(/\d+/g).map(Number);
    const date=new Date(Date.UTC(y,m-1,d,h,n)+minutes*60000);
    if(Number.isNaN(date.getTime()))return null;
    const at=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}T${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;
    return validDateTime(at)?at:null;
  }
  function checkCustom(event,custom) {
    if(custom?.mode==='datetime') {
      if(typeof custom.at!=='string'||!validDate(custom.at.slice(0,10)))return {error:'请选择有效的提醒日期（1900—2100 年）。',field:'reminderDate'};
      if(!validDateTime(custom.at))return {error:'请填写有效的提醒时间。',field:'reminderTime'};
      return {at:custom.at};
    }
    if(custom?.mode!=='offset'||!Number.isSafeInteger(custom.amount)||custom.amount<0||!validUnit(custom.unit))return {error:'提前数值须为 0 或正整数。',field:'reminderAmount'};
    const minutes=custom.amount*factors[custom.unit];
    if(minutes>525600)return {error:'最多提前 365 天，也可改用“指定时间”。',field:'reminderAmount'};
    const at=shift(`${event.date}T${event.allDay?'09:00':event.start}`,-minutes);
    if(!at)return {error:'计算后的提醒日期须在 1900—2100 年内。',field:'reminderAmount'};
    return {at};
  }
  function normalize(custom) {
    if(custom?.mode==='datetime'&&validDateTime(custom.at))return {mode:'datetime',at:custom.at};
    if(custom?.mode==='offset'&&Number.isSafeInteger(custom.amount)&&custom.amount>=0&&validUnit(custom.unit)&&custom.amount*factors[custom.unit]<=525600)return {mode:'offset',amount:custom.amount,unit:custom.unit};
    return null;
  }
  function resolve(event) {
    if(!event||event.reminder==='none')return null;
    if(event.reminder==='custom')return checkCustom(event,event.customReminder).at||null;
    if(event.allDay){
      if(!['today9','previous9'].includes(event.reminder))return null;
      return shift(`${event.date}T09:00`,event.reminder==='previous9'?-1440:0);
    }
    if(!['0','10','30','60','1440'].includes(event.reminder))return null;
    return shift(`${event.date}T${event.start}`,-Number(event.reminder));
  }
  const label=at=>validDateTime(at)?`${at.slice(0,4)}年${Number(at.slice(5,7))}月${Number(at.slice(8,10))}日 ${at.slice(11)}`:'';
  return {validDate,validTime,validDateTime,shift,checkCustom,normalize,resolve,label};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MemoReminders;
