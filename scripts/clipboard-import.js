/* Import inline SVG geometry, never an external Iconify embed or script. */
function clipboardSVG(text, html='') {
 const candidate=text.trim();
 if(/^(?:<\?xml[^>]*>\s*)?<svg\b/i.test(candidate))return serialize(sanitize(candidate));
 const markup=html||candidate;
 if(!/<svg\b/i.test(markup))throw Error('Copy the SVG code, not the Iconify HTML embed: the embed does not contain the artwork paths.');
 if(markup.length>8e6)throw Error('SVG is too large (8 MB maximum).');
 // A template is inert: surrounding HTML, images and scripts are never mounted.
 const template=document.createElement('template');template.innerHTML=markup;
 const icons=template.content.querySelectorAll('svg');
 if(icons.length!==1)throw Error('Please copy one SVG at a time.');
 return serialize(sanitize(serialize(icons[0])));
}
document.addEventListener('paste',event=>{
 if(event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')||qsa('dialog').some(dialog=>dialog.open)||document.documentElement.classList.contains('booting'))return;
 const text=event.clipboardData?.getData('text/plain')||'',html=event.clipboardData?.getData('text/html')||'';
 if(!/<(?:svg|iconify-icon)\b|\biconify\b/i.test(text+' '+html))return;
 event.preventDefault();
 try{const svg=clipboardSVG(text,html);checkpoint();insertSVG(svg,'Pasted SVG');toast('SVG pasted — external links removed.');}
 catch(error){notifyError(error.message);}
});
