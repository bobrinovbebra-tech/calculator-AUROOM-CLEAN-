(function(){
  'use strict';
  const config=window.AUROOM_CONFIG;
  const moneyCfg=config.money;

  function num(v){const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0}
  function round(v){const step=moneyCfg.roundingStep;return Math.round(v/step)*step}
  function money(v){return `${round(v).toLocaleString(moneyCfg.locale)} ${moneyCfg.currency}`}
  function firstCoefficient(object){return object.coefficientPresets[0]?.value||1}
  function getObjectCoefficient(state){
    const object=config.objectTypes[state.objectType]||config.objectTypes.apartment;
    const selected=object.coefficientPresets.find(item=>item.id===state.objectCoefficientId);
    return selected?selected.value:firstCoefficient(object);
  }
  function getCleaningSettings(state){
    const base=config.cleaningTypes[state.cleaningType]||config.cleaningTypes.maintenance;
    const object=config.objectTypes[state.objectType]||config.objectTypes.apartment;
    const override=object.serviceOverrides?.[state.cleaningType]||{};
    return Object.assign({},base,override,{label:base.label,shortLabel:base.shortLabel,mode:base.mode,fixedByArea:base.fixedByArea,managerHint:base.managerHint,websiteFrom:base.websiteFrom});
  }
  function getDailyPrice(cleaning,area){
    const item=cleaning.fixedByArea.find(row=>row.maxArea===null||area<=row.maxArea)||cleaning.fixedByArea[cleaning.fixedByArea.length-1];
    return {amount:item.recommended,range:`${item.label}: ${item.min}–${item.max} ${moneyCfg.currency}`};
  }
  function addonAmount(key,data,baseBeforePercent){
    const add=config.addOns[key];
    if(!add||!data?.enabled)return {amount:0,label:add?.label||key,warning:add?.warning};
    if(add.type==='fixed')return {amount:add.price,label:add.label,warning:add.warning};
    if(add.type==='unit')return {amount:num(data.quantity||add.defaultQuantity)*add.pricePerUnit,label:`${add.label}: ${num(data.quantity||add.defaultQuantity)} ${add.unitLabel}`,warning:add.warning};
    if(add.type==='minutes'){
      const minutes=num(data.minutes||add.defaultMinutes);
      const raw=minutes*add.pricePerMinute;
      return {amount:Math.min(Math.max(raw,add.minimumCharge),add.maximumCharge),label:`${add.label}: ${minutes} ${add.unitLabel}`,warning:add.warning};
    }
    if(add.type==='choice'){
      const choice=add.choices.find(item=>item.id===(data.choice||add.defaultChoice))||add.choices[0];
      return {amount:choice.price,label:`${add.label}: ${choice.label}`,warning:add.warning||choice.warning};
    }
    if(add.type==='percent')return {amount:baseBeforePercent*(add.percent/100),label:`${add.label}: +${add.percent}%`,warning:add.warning};
    if(add.type==='manual')return {amount:num(data.amount||add.defaultAmount),label:add.label,warning:add.warning};
    return {amount:0,label:add.label,warning:add.warning};
  }
  function effectiveDirt(state){
    const dirt=config.dirtLevels[state.dirtLevel]||config.dirtLevels.medium;
    let coefficient=dirt.coefficient;
    const overrides=[];
    Object.entries(state.addons||{}).forEach(([key,data])=>{
      const add=config.addOns[key];
      if(add?.type==='coefficientOverride'&&data?.enabled&&add.coefficient>coefficient){
        coefficient=add.coefficient;
        overrides.push({label:add.label,coefficient:add.coefficient,warning:add.warning});
      }
    });
    return {label:dirt.label,coefficient,overrides,hint:dirt.hint};
  }
  function calculate(state){
    const area=num(state.area);
    const cleaning=getCleaningSettings(state);
    const object=config.objectTypes[state.objectType]||config.objectTypes.apartment;
    const dirt=effectiveDirt(state);
    const objectCoefficient=getObjectCoefficient(state);
    let base=0,dailyRange='';
    if(cleaning.mode==='fixedByArea'){
      const daily=getDailyPrice(cleaning,area);
      base=daily.amount;
      dailyRange=daily.range;
    }else{
      base=area*cleaning.baseRate*dirt.coefficient*objectCoefficient;
    }
    const addonRows=[];const warnings=[];
    let addonsBeforePercent=0;
    Object.entries(state.addons||{}).forEach(([key,data])=>{
      const add=config.addOns[key];
      if(!add||add.type==='percent'||add.type==='coefficientOverride')return;
      const row=addonAmount(key,data,base);
      if(row.amount){addonsBeforePercent+=row.amount;addonRows.push(row)}
      if(row.warning&&data.enabled)warnings.push(row.warning)
    });
    let subtotal=base+addonsBeforePercent;
    Object.entries(state.addons||{}).forEach(([key,data])=>{
      const add=config.addOns[key];
      if(!add||add.type!=='percent'||!data?.enabled)return;
      const row=addonAmount(key,data,subtotal);
      subtotal+=row.amount;addonRows.push(row);
    });
    dirt.overrides.forEach(item=>{addonRows.push({label:item.label,amount:0});if(item.warning)warnings.push(item.warning)});
    const minimum=cleaning.minimum||0;
    const total=round(Math.max(subtotal,minimum));
    const deposit=round(total*(config.deposit.percent/100));
    const rest=round(total-deposit);
    return {total,deposit,rest,area,minimum,appliedMinimum:subtotal<minimum,base:round(base),addons:round(total-Math.max(round(base),0)),addonRows,warnings,dailyRange,cleaningLabel:cleaning.label,objectLabel:object.label,dirtLabel:dirt.label,dirtCoefficient:dirt.coefficient,objectCoefficient,managerHint:cleaning.managerHint};
  }
  function copyText(state,result){
    const addons=result.addonRows.length?result.addonRows.map(i=>`- ${i.label}${i.amount?`: ${money(i.amount)}`:''}`).join('\n'):'Без дополнительных услуг';
    return `${config.copyTemplate.greeting}\n\nСтоимость уборки:\n\nТип: ${result.cleaningLabel}\nОбъект: ${result.objectLabel}\nПлощадь: ${result.area} м²\nЗагрязнение: ${result.dirtLabel} ×${result.dirtCoefficient}\n\nДополнительные услуги:\n${addons}\n\nИтоговая стоимость: ${money(result.total)}\nПредоплата ${config.deposit.percent}%: ${money(result.deposit)}\nОстаток: ${money(result.rest)}\n\n${state.client?.date?'Дата: '+state.client.date+'\n':''}${state.client?.time?'Время: '+state.client.time+'\n':''}${config.copyTemplate.thanks}`;
  }
  window.AuroomCalculator={calculate,copyText,money,num};
})();
