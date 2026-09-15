import test from 'node:test';
import assert from 'node:assert/strict';
import {createBestPeopleLayer,projectBestFloor} from './best-live-people.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('the Good grid maps into the four measured floor corners of the approved Best perspective',()=>{
  for(const [col,row,x,y] of [[0,0,.355,.245],[14,0,.905,.505],[0,8,.085,.525],[14,8,.605,.925]]){
    const point=projectBestFloor(col,row);near(point.x,x);near(point.y,y);
  }
  const center=projectBestFloor(7,4);near(center.x,.4875);near(center.y,.55);near(center.depth,.5);
  assert.deepEqual(projectBestFloor(-10,-10),projectBestFloor(0,0));
  assert.deepEqual(projectBestFloor(99,99),projectBestFloor(14,8));
});

const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const at=(col,row)=>({x:iso.ox+(col-row)*iso.tileW/2-7,y:iso.oy+(col+row)*iso.tileH/2-20});
function fixture(){
  return {active:true,iso,layout:[],footprints:{},realTrafficActive:false,game:{
    staff:[{...at(3,2),hired:true,name:'Player',shirt:0,hair:3,role:3,dir:1,look:{skin:0,pants:2,shoes:1}}],
    custs:[{...at(6,4),id:12,dir:-1,st:'browse',look:{shirt:2,hair:1,skin:4,pants:3,shoes:2}}],
    passersby:[{...at(15,4),outside:true,dir:1,look:{shirt:4,hair:5,skin:1}}],custIn:1,gameTime:14,doorAnim:0
  }};
}

test('the overlay follows live actor positions, excludes outdoor traffic and disposes every DOM resource',()=>{
  const originalDocument=globalThis.document,frames=[],cancelled=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
    setAttribute(name,value){(this.attrs??={})[name]=String(value);}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
  }
  globalThis.document={hidden:false,createElement:tag=>new Element(tag)};
  try{
    const state=fixture(),container=new Element('scene');
    const people=createBestPeopleLayer({container,getState:()=>state,requestFrame:callback=>(frames.push(callback),frames.length),cancelFrame:id=>cancelled.push(id)});
    const [layer,status]=container.children;
    assert.equal(people.count,2);assert.equal(layer.children.length,2);assert.match(status.textContent,/1 cliente simulado/);
    assert.equal(layer.children.some(node=>node.className.includes('passerby')),false);
    const customer=layer.children.find(node=>node.className.includes('kind-customer')),left=customer.style.left;
    Object.assign(state.game.custs[0],at(7,4));people.update();
    assert.notEqual(customer.style.left,left);assert.match(customer.className,/is-walking/);
    people.dispose();people.dispose();assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
  }finally{globalThis.document=originalDocument;}
});
