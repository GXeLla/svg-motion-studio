/* Ungroup without flattening paths or losing inherited transforms/styles.
   Neutral SVG containers remain as structure, but no longer own editor layers. */
function ungroupSelected() {
  const groups=topSelection().filter(id=>Object.values(state.objects).some(o=>o.parent===id));
  if(!groups.length)return notifyError('Select a group with child layers to ungroup.');
  if(groups.some(id=>object(id).clips.length||object(id).morph))return notifyError('Remove the group animation before ungrouping. Child animations are kept.');
  checkpoint();const selected=[];
  for(const id of groups){
    const group=object(id),wrapper=nodes.get(id),base=qs(`[data-base="${id}"]`,wrapper),shape=visual(id);
    for(const child of Object.values(state.objects).filter(o=>o.parent===id)){child.parent=group.parent;selected.push(child.id);}
    wrapper.removeAttribute('data-layer-id');base.removeAttribute('data-base');shape.removeAttribute('data-visual');
    delete state.objects[id];nodes.delete(id);
  }
  state.selected=selected;state.activeClip=null;applyAll();renderAll();autosave();toast('Group released. Child layers and artwork preserved.');
}
$('groupBtn').title='Group selected objects · Shift-click to ungroup';
$('groupBtn').onclick=event=>event.shiftKey?ungroupSelected():groupSelected();
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='g'&&!event.target.closest('input,textarea,select,[contenteditable=true]')&&!qsa('dialog').some(dialog=>dialog.open)){event.preventDefault();ungroupSelected();}
});
// Catch serialization failures at the UI boundary as well as download failures.
for(const button of qsa('[data-export],#variantExport,#saveBtn')){
  const action=button.onclick;button.onclick=event=>{try{action?.call(button,event);}catch(error){notifyError('Could not save or export: '+error.message);}};
}
