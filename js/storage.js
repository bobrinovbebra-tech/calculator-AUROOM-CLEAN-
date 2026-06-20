(function(){
  'use strict';
  const config=window.AUROOM_CONFIG;
  const key=config.storage.key;
  const limit=config.storage.historyLimit;

  function all(){
    try{return JSON.parse(localStorage.getItem(key))||[]}catch(e){return[]}
  }
  function save(entry){
    const list=all().filter(item=>item.id!==entry.id);
    list.unshift(entry);
    localStorage.setItem(key,JSON.stringify(list.slice(0,limit)));
    return list.slice(0,limit);
  }
  function remove(id){
    const list=all().filter(item=>item.id!==id);
    localStorage.setItem(key,JSON.stringify(list));
    return list;
  }
  function clear(){localStorage.removeItem(key)}

  window.AuroomStorage={all,save,remove,clear};
})();
