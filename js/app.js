(function(){
  'use strict';
  const ui=window.AuroomUI;
  const calc=window.AuroomCalculator;
  const storage=window.AuroomStorage;
  let lastResult=null;

  function recalc(){
    ui.updateActive();
    const state=ui.collectState();
    lastResult=calc.calculate(state);
    ui.renderResult(lastResult);
  }
  function saveCurrent(){
    const state=ui.collectState();
    const result=calc.calculate(state);
    storage.save({id:`calc-${Date.now()}`,createdAt:new Date().toISOString(),state,result});
    ui.renderHistory(storage.all());
    ui.toast('Расчёт сохранён');
  }
  async function copyCurrent(){
    const state=ui.collectState();
    const result=calc.calculate(state);
    const text=calc.copyText(state,result);
    try{await navigator.clipboard.writeText(text);ui.toast('Расчёт скопирован')}catch(e){ui.toast('Не удалось скопировать')}
    storage.save({id:`calc-${Date.now()}`,createdAt:new Date().toISOString(),state,result});
    ui.renderHistory(storage.all());
  }
  function init(){
    ui.init(document.getElementById('app'));
    ui.renderHistory(storage.all());
    recalc();
    document.addEventListener('input',e=>{if(e.target.closest('[data-form]'))recalc()});
    document.addEventListener('change',e=>{
      if(e.target.name==='objectType'||e.target.name==='cleaningType'){ui.updateDynamic()}
      if(e.target.closest('[data-form]'))recalc();
    });
    document.addEventListener('click',e=>{
      const action=e.target.closest('[data-action]')?.dataset.action;
      if(!action)return;
      if(action==='save')saveCurrent();
      if(action==='copy')copyCurrent();
      if(action==='load'){
        const entry=storage.all().find(item=>item.id===e.target.closest('[data-action]').dataset.id);
        if(entry){ui.fillState(entry.state);recalc();window.scrollTo({top:0,behavior:'smooth'});ui.toast('Расчёт открыт')}
      }
    });
  }
  document.addEventListener('DOMContentLoaded',init);
})();
