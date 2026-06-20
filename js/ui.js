(function(){
  'use strict';
  const config=window.AUROOM_CONFIG;
  const calc=window.AuroomCalculator;
  let root;

  function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
  function optCards(name,items,selected){return Object.entries(items).map(([id,item])=>`<label class="pill ${id===selected?'active':''}"><input type="radio" name="${name}" value="${id}" ${id===selected?'checked':''}><strong>${esc(item.label)}</strong><small>${esc(item.websiteFrom||item.managerHint||'')}</small></label>`).join('')}
  function dirtCards(){return Object.entries(config.dirtLevels).map(([id,item])=>`<label class="pill ${id===config.defaults.dirtLevel?'active':''}"><input type="radio" name="dirtLevel" value="${id}" ${id===config.defaults.dirtLevel?'checked':''}><strong>${esc(item.label)}</strong><small>×${esc(item.coefficient)} · ${esc(item.hint)}</small></label>`).join('')}
  function coefficientSelect(objectType){const object=config.objectTypes[objectType]||config.objectTypes.apartment;return `<label class="field wide"><span class="label">Коэффициент объекта</span><select name="objectCoefficientId">${object.coefficientPresets.map(i=>`<option value="${esc(i.id)}">${esc(i.label)} · ×${esc(i.value)}</option>`).join('')}</select></label>`}
  function addonBody(id,add){
    if(add.type==='fixed'||add.type==='percent'||add.type==='coefficientOverride')return `<p class="addon-desc">${esc(add.description||'')}</p>`;
    if(add.type==='unit')return `<label class="field"><span class="label">Количество, ${esc(add.unitLabel)}</span><input type="number" min="0" step="1" data-addon-field="quantity" value="${esc(add.defaultQuantity||1)}"></label><p class="addon-desc">${esc(add.description||'')}</p>`;
    if(add.type==='minutes')return `<label class="field"><span class="label">Количество минут</span><input type="number" min="0" step="5" data-addon-field="minutes" value="${esc(add.defaultMinutes||15)}"></label><p class="addon-desc">${esc(add.description||'')}</p>`;
    if(add.type==='manual')return `<label class="field"><span class="label">Ручная сумма</span><input type="number" min="0" step="1" data-addon-field="amount" placeholder="${esc(add.placeholder||'BYN')}" value="${esc(add.defaultAmount||0)}"></label><p class="addon-desc">${esc(add.description||'')}</p>`;
    if(add.type==='choice')return `<div class="choice-row">${add.choices.map(c=>`<label class="choice ${c.id===add.defaultChoice?'active':''}"><input type="radio" name="addon-${id}" data-addon-field="choice" value="${esc(c.id)}" ${c.id===add.defaultChoice?'checked':''}>${esc(c.label)}</label>`).join('')}</div><p class="addon-desc">${esc(add.description||'')}</p>`;
    return '';
  }
  function addons(){return Object.entries(config.addOns).map(([id,add])=>`<article class="addon" data-addon="${esc(id)}"><label class="addon-head"><input type="checkbox" data-addon-toggle hidden><span class="toggle"></span><span><strong>${esc(add.label)}</strong><p class="addon-desc">${esc(add.description||'')}</p></span></label><div class="addon-body">${addonBody(id,add)}</div></article>`).join('')}
  function renderShell(){
    root.innerHTML=`
      <header class="topbar"><div class="brand"><img class="logo" src="assets/logo.svg" alt="Auroom Clean"><div><p class="eyebrow">${esc(config.company.name)}</p><h1 class="title">${esc(config.company.appTitle)}</h1></div></div><button class="button ghost" data-action="save" type="button">Сохранить</button></header>
      <div class="layout"><form class="form" data-form>
        <section class="card"><h2>Клиент</h2><div class="grid"><label class="field"><span class="label">Имя</span><input name="name" autocomplete="name"></label><label class="field"><span class="label">Телефон</span><input name="phone" autocomplete="tel"></label><label class="field wide"><span class="label">Адрес</span><input name="address"></label><label class="field"><span class="label">Дата</span><input name="date" type="date"></label><label class="field"><span class="label">Время</span><input name="time" type="time"></label><label class="field wide"><span class="label">Комментарий</span><textarea name="comment" placeholder="Что важно уточнить по объекту"></textarea></label></div></section>
        <section class="card"><h2>Объект</h2><div class="grid">${optCards('objectType',config.objectTypes,config.defaults.objectType)}</div><div data-coefficient>${coefficientSelect(config.defaults.objectType)}</div></section>
        <section class="card"><h2>Тип уборки</h2><div class="grid">${optCards('cleaningType',config.cleaningTypes,config.defaults.cleaningType)}</div><div class="hint" data-hint>${esc(config.cleaningTypes[config.defaults.cleaningType].managerHint)}</div></section>
        <section class="card"><h2>Площадь</h2><label class="field"><span class="label">м²</span><input class="area-input" name="area" type="number" min="0" step="1" placeholder="0"></label></section>
        <section class="card"><h2>Коэффициент загрязнения</h2><div class="grid-3">${dirtCards()}</div></section>
        <section class="card"><h2>Дополнительные услуги</h2>${addons()}</section>
      </form><aside class="side"><section class="card result" data-result></section><section class="card"><h2>История</h2><div data-history></div></section></aside></div><div class="toast" data-toast></div>`;
  }
  function collectState(){
    const form=root.querySelector('[data-form]');
    const state={client:{},addons:{}};
    ['name','phone','address','date','time','comment'].forEach(k=>state.client[k]=form.elements[k]?.value||'');
    state.objectType=form.elements.objectType.value;state.cleaningType=form.elements.cleaningType.value;state.dirtLevel=form.elements.dirtLevel.value;state.area=form.elements.area.value;state.objectCoefficientId=form.elements.objectCoefficientId?.value;
    root.querySelectorAll('[data-addon]').forEach(el=>{const id=el.dataset.addon;const enabled=el.querySelector('[data-addon-toggle]').checked;const data={enabled};el.querySelectorAll('[data-addon-field]').forEach(inp=>{if(inp.type==='radio'&&!inp.checked)return;data[inp.dataset.addonField]=inp.value});state.addons[id]=data});
    return state;
  }
  function fillState(state){
    const form=root.querySelector('[data-form]');
    Object.entries(state.client||{}).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v});
    ['objectType','cleaningType','dirtLevel'].forEach(k=>{const input=form.querySelector(`[name="${k}"][value="${state[k]}"]`);if(input)input.checked=true});
    if(form.elements.area)form.elements.area.value=state.area||'';
    updateActive();updateDynamic();
    if(state.objectCoefficientId&&form.elements.objectCoefficientId)form.elements.objectCoefficientId.value=state.objectCoefficientId;
    Object.entries(state.addons||{}).forEach(([id,data])=>{const el=root.querySelector(`[data-addon="${id}"]`);if(!el)return;el.querySelector('[data-addon-toggle]').checked=!!data.enabled;el.classList.toggle('enabled',!!data.enabled);Object.entries(data).forEach(([k,v])=>{if(k==='enabled')return;const field=el.querySelector(`[data-addon-field="${k}"]${k==='choice'?`[value="${v}"]`:''}`);if(field){field.value=v;if(field.type==='radio')field.checked=true}})});
    updateActive();
  }
  function updateActive(){root.querySelectorAll('.pill').forEach(l=>l.classList.toggle('active',!!l.querySelector('input')?.checked));root.querySelectorAll('.choice').forEach(l=>l.classList.toggle('active',!!l.querySelector('input')?.checked));root.querySelectorAll('.addon').forEach(el=>el.classList.toggle('enabled',!!el.querySelector('[data-addon-toggle]')?.checked))}
  function updateDynamic(){
    const state=collectState();
    const coeff=root.querySelector('[data-coefficient]');
    if(coeff)coeff.innerHTML=coefficientSelect(state.objectType);
    const type=config.cleaningTypes[state.cleaningType];
    const hint=root.querySelector('[data-hint]');
    if(hint)hint.textContent=type.managerHint||'';
  }
  function renderResult(result){
    root.querySelector('[data-result]').innerHTML=`<p class="eyebrow">Итог</p><div class="price">${calc.money(result.total)}</div><div class="summary-row"><span class="muted">Предоплата ${config.deposit.percent}%</span><strong>${calc.money(result.deposit)}</strong></div><div class="summary-row"><span class="muted">Остаток</span><strong>${calc.money(result.rest)}</strong></div><div class="summary-row"><span class="muted">База</span><strong>${calc.money(result.base)}</strong></div><div class="summary-row"><span class="muted">Объект / грязь</span><strong>×${result.objectCoefficient} / ×${result.dirtCoefficient}</strong></div>${result.appliedMinimum?`<p class="hint">Сработал минимальный заказ: ${calc.money(result.minimum)}</p>`:''}${result.dailyRange?`<p class="hint">${esc(result.dailyRange)}</p>`:''}<button class="button" data-action="copy" type="button">📋 Скопировать расчёт</button>`;
  }
  function renderHistory(list){
    const box=root.querySelector('[data-history]');
    if(!list.length){box.innerHTML='<p class="muted">Пока нет сохранённых расчётов.</p>';return}
    box.innerHTML=list.map(item=>`<div class="history-item"><div><strong>${esc(item.state.client.name||item.state.client.phone||item.result.cleaningLabel)}</strong><br><span class="muted">${esc(item.result.cleaningLabel)} · ${esc(item.result.area)} м²</span></div><div><strong>${calc.money(item.result.total)}</strong><br><button type="button" data-action="load" data-id="${esc(item.id)}">Открыть</button></div></div>`).join('');
  }
  function toast(text){const t=root.querySelector('[data-toast]');t.textContent=text;t.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('visible'),2200)}
  function init(el){root=el;renderShell();return {root}}
  window.AuroomUI={init,collectState,fillState,updateActive,updateDynamic,renderResult,renderHistory,toast};
})();
