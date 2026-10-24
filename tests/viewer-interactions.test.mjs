import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/source-viewer.js',import.meta.url),'utf8');

// A small event/DOM fixture exercises navigation cancellation and real viewer creation,
// without provider requests or an installed browser. Browser layout is checked separately.
function fixture(){
 const events=new Map(),created=[];
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.dataset={};this.className='';this.textContent='';this.listeners=new Map();this.open=false;this.isConnected=true;this.style={removeProperty(){}};this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};created.push(this);}
  set innerHTML(value){this.html=value;if(this.tagName==='dialog'){this.fields={};for(const key of ['title','provider','address','note','status','retry','copy','size','close','content']){const el=new Element(key==='content'?'div':'span');el.parent=this;this.fields[key]=el;}this.children=Object.values(this.fields);}}
  appendChild(el){el.parent=this;this.children.push(el);return el;}
  replaceChildren(){this.children.forEach(e=>{e.parent=null;e.isConnected=false;});this.children=[];}
  setAttribute(key,value){this.attributes[key]=String(value);}
  getAttribute(key){return key in this.attributes?this.attributes[key]:null;}
  removeAttribute(key){delete this.attributes[key];}
  hasAttribute(key){return key in this.attributes;}
  querySelector(selector){const match=selector.match(/^\[data-viewer="([^"]+)"\]$/);if(match)return this.fields?.[match[1]]||null;return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){const names=selector.split(',');return this.children.flatMap(el=>[...(names.includes(el.tagName)?[el]:[]),...el.querySelectorAll(selector)]);}
  closest(selector){if(selector==='a[href]'&&this.tagName==='a'&&this.hasAttribute('href'))return this;if(selector==='.source-viewer'&&this.className.split(' ').includes('source-viewer'))return this;return this.parent?.closest(selector)||null;}
  addEventListener(name,handler){const handlers=this.listeners.get(name)||[];handlers.push(handler);this.listeners.set(name,handlers);}
  showModal(){this.open=true;this.modal=true;}
  show(){this.open=true;this.modal=false;}
  close(){this.open=false;(this.listeners.get('close')||[]).forEach(handler=>handler({type:'close'}));}
  focus(){doc.activeElement=this;}
  pause(){this.paused=true;}
  load(){}
 }
 const doc={body:new Element('body'),activeElement:null,createElement:tag=>new Element(tag),addEventListener(type,handler,capture){const list=events.get(type)||[];list.push({handler,capture});events.set(type,list);}};
 doc.activeElement=new Element('button');
 const context=vm.createContext({window:{location:{origin:'https://voraleaf.invalid'}},document:doc,navigator:{},URL});
 vm.runInContext(source,context,{timeout:1000});
 function link(url,attrs={}){const el=new Element('a');el.setAttribute('href',url);el.target=attrs.target||'_blank';el.textContent='Watch video';for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);doc.body.appendChild(el);return el;}
 function dispatch(type,target,overrides={}){const event={type,target,button:0,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...overrides};for(const entry of events.get(type)||[])entry.handler(event);return event;}
 return {api:context.window.VoraleafViewer,created,events,doc,link,dispatch,Element,frames:()=>created.filter(el=>el.tagName==='iframe'),dialog:()=>created.find(el=>el.tagName==='dialog')};
}
const youtube='https://www.youtube.com/watch?v=KBpoBc98BwM';

test('single, double and keyboard source activation cancel target=_blank and reuse one player',()=>{
 const f=fixture(),link=f.link(youtube);
 for(const type of ['click','click','dblclick']){const event=f.dispatch(type,link);assert.equal(event.defaultPrevented,true);assert.equal(event.stopped,true);}
 const keyboard=f.dispatch('click',link,{detail:0});assert.equal(keyboard.defaultPrevented,true);
 assert.equal(f.frames().length,1);assert.equal(f.dialog().open,true);assert.equal(f.dialog().modal,true);
 for(const name of ['click','dblclick','auxclick'])assert.equal(f.events.get(name)[0].capture,true);
});
test('middle click and modified left clicks stay in the same viewer',()=>{
 const f=fixture(),link=f.link(youtube);
 for(const overrides of [{button:0,ctrlKey:true},{button:0,metaKey:true},{button:0,shiftKey:true}])assert.equal(f.dispatch('click',link,overrides).defaultPrevented,true);
 assert.equal(f.dispatch('auxclick',link,{button:1}).defaultPrevented,true);assert.equal(f.frames().length,1);
 assert.equal(f.dispatch('auxclick',link,{button:2}).defaultPrevented,false);
});
test('repeated direct opens and equivalent YouTube links preserve frame identity and mode',()=>{
 const f=fixture();f.api.open({url:youtube,title:'First source'});const frame=f.frames()[0],dialog=f.dialog();
 dialog.querySelector('[data-viewer="size"]').listeners.get('click')[0]();assert.equal(dialog.modal,false);
 f.api.open({url:'https://youtu.be/KBpoBc98BwM',title:'Repeated source'});assert.equal(f.frames().length,1);assert.equal(f.frames()[0],frame);assert.equal(dialog.modal,false);assert.notEqual(frame.src,'about:blank');
 f.api.open({url:'https://www.youtube.com/watch?v=IB-8SWyylME',title:'Another source'});assert.equal(frame.src,'about:blank');assert.equal(f.frames().length,2);
});
test('OAuth, explicit contact handoffs, downloads and ordinary app navigation remain untouched',()=>{
 const f=fixture();for(const [url,attrs]of [
  ['/api/studio/oauth/youtube/start',{}],['/signin-with-chatgpt?return_to=/studio',{}],['https://accounts.google.com/o/oauth2/auth',{}],['https://provider.example/oauth/authorize',{}],['/collection',{target:''}],
  [youtube,{'data-native-link':'true'}],[youtube,{download:'clip.webm'}]
 ]){const event=f.dispatch('click',f.link(url,attrs));assert.equal(event.defaultPrevented,false,url);}
 assert.equal(f.frames().length,0);
});
test('own media and member-watch links are captured but provider-owned links are left available',()=>{
 const f=fixture();assert.equal(f.dispatch('click',f.link('/assets/ritual-motion-study.mp4')).defaultPrevented,true);
 assert.equal(f.dispatch('dblclick',f.link('/watch/example-member-room')).defaultPrevented,true);
 const providerLink=f.link(youtube);f.dialog().appendChild(providerLink);assert.equal(f.dispatch('click',providerLink).defaultPrevented,false);
});
test('unrelated double clicks and already-cancelled events do not open sources',()=>{
 const f=fixture();assert.equal(f.dispatch('dblclick',new f.Element('p')).defaultPrevented,false);
 f.dispatch('click',f.link(youtube),{defaultPrevented:true});assert.equal(f.frames().length,0);
});
