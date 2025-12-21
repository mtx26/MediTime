const r=t=>{if(!t)return null;try{if(t.startsWith("/"))return t;const n=new URL(t);if(n.origin===window.location.origin)return n.pathname+n.search+n.hash}catch{}return null};export{r as g};
