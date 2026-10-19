/* Declaration slots are authoritative; getAnimations() only supplies live handles. */
function cssList(value) {
  const items=[];let token='',quote='',depth=0,escaped=false;
  for(const char of value){if(escaped){token+=char;escaped=false;continue;}if(char==='\\'){token+=char;escaped=true;continue;}if(quote){token+=char;if(char===quote)quote='';continue;}if(char==='"'||char==="'"){quote=char;token+=char;continue;}if(char==='(')depth++;if(char===')')depth--;if(char===','&&!depth){items.push(token.trim());token='';}else token+=char;}items.push(token.trim());return items;
}
let cssReferenceRoot=null,cssAnimationHandles=new Map();
function collectImportedCSS(found) {
  if(cssReferenceRoot!==root){cssReferenceRoot=root;cssAnimationHandles.clear();}
  const targets=new Set(),liveByTarget=new Map();
  const native=root.getAnimations?.({subtree:true})||[];
  for(const animation of native){const target=animation.effect?.target;if(!animation.animationName||!target)continue;if(!liveByTarget.has(target))liveByTarget.set(target,[]);liveByTarget.get(target).push(animation);targets.add(target);}
  for(const element of [root,...qsa('[style]',root)])if(element.style.animation||element.style.animationName)targets.add(element);
  for(const node of qsa('style',root)){
    if(node.id==='ms-motion-style'||!/(?:animation|\ball)\s*[-:]/i.test(node.textContent))continue;
    const sheet=new CSSStyleSheet();sheet.replaceSync(node.textContent);
    const visit=rules=>{for(const rule of rules){if(rule.selectorText&&(rule.style.animation||rule.style.animationName||rule.style.getPropertyValue('all'))){try{if(root.matches(rule.selectorText))targets.add(root);root.querySelectorAll(rule.selectorText).forEach(el=>targets.add(el));}catch{}}else if(rule.cssRules&&rule.type!==CSSRule.KEYFRAMES_RULE)visit(rule.cssRules);}};visit(sheet.cssRules);
  }
  for(const target of targets){
    if(!root.contains(target)&&target!==root)continue;
    const computed=getComputedStyle(target);if(computed.display==='none')continue;
    const names=cssList(computed.animationName),durations=cssList(computed.animationDuration),delays=cssList(computed.animationDelay),repeats=cssList(computed.animationIterationCount),easings=cssList(computed.animationTimingFunction);
    const live=(liveByTarget.get(target)||[]).filter(a=>a.playState!=='idle'),used=new Set();
    names.forEach((declaration,slot)=>{
      if(declaration==='none')return;
      const name=declaration.replace(/^['"]|['"]$/g,'');
      if(name.startsWith('ms_')&&(target.hasAttribute('data-clip-id')||target.closest('[data-curve-generated]')||Array.from(target.classList).some(c=>c.startsWith('ms-draw-'))))return;
      const animation=live.find(a=>!used.has(a)&&a.animationName===name);if(animation)used.add(animation);
      const id=`css-${importedElementId(target)}-${slot}-${declaration}`;
      if(!animation&&cssAnimationHandles.get(id)?.playState==='idle')return;
      if(animation)cssAnimationHandles.set(id,animation);
      importedAnimationTargets.set(id,{target,animation,slot,name:declaration});
      const repeat=repeats[slot%repeats.length];
      found.push({id,kind:'css',type:'CSS · '+name,attribute:'style',duration:clockSeconds(durations[slot%durations.length]),delay:clockSeconds(delays[slot%delays.length]),repeat:repeat==='infinite'?'∞':repeat,target:animationTargetName(target),timing:easings[slot%easings.length]});
    });
  }
}
