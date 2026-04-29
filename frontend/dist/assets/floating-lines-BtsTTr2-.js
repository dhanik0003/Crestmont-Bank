import{V as C,S as Ie,O as $e,W as Me,a as x,b as Te,P as De,M as Ae,C as Fe}from"./three-vendor-CmwIgQyH.js";function ze(e,t){for(var o=0;o<t.length;o++){const r=t[o];if(typeof r!="string"&&!Array.isArray(r)){for(const n in r)if(n!=="default"&&!(n in e)){const u=Object.getOwnPropertyDescriptor(r,n);u&&Object.defineProperty(e,n,u.get?u:{enumerable:!0,get:()=>r[n]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}function Be(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var pe={exports:{}},I={},ve={exports:{}},i={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var w=Symbol.for("react.element"),Ge=Symbol.for("react.portal"),Ne=Symbol.for("react.fragment"),Ve=Symbol.for("react.strict_mode"),qe=Symbol.for("react.profiler"),Ke=Symbol.for("react.provider"),He=Symbol.for("react.context"),Pe=Symbol.for("react.forward_ref"),Xe=Symbol.for("react.suspense"),Ye=Symbol.for("react.memo"),Je=Symbol.for("react.lazy"),se=Symbol.iterator;function Qe(e){return e===null||typeof e!="object"?null:(e=se&&e[se]||e["@@iterator"],typeof e=="function"?e:null)}var ye={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},he=Object.assign,_e={};function R(e,t,o){this.props=e,this.context=t,this.refs=_e,this.updater=o||ye}R.prototype.isReactComponent={};R.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};R.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function ge(){}ge.prototype=R.prototype;function F(e,t,o){this.props=e,this.context=t,this.refs=_e,this.updater=o||ye}var z=F.prototype=new ge;z.constructor=F;he(z,R.prototype);z.isPureReactComponent=!0;var ae=Array.isArray,be=Object.prototype.hasOwnProperty,B={current:null},Ce={key:!0,ref:!0,__self:!0,__source:!0};function xe(e,t,o){var r,n={},u=null,l=null;if(t!=null)for(r in t.ref!==void 0&&(l=t.ref),t.key!==void 0&&(u=""+t.key),t)be.call(t,r)&&!Ce.hasOwnProperty(r)&&(n[r]=t[r]);var f=arguments.length-2;if(f===1)n.children=o;else if(1<f){for(var c=Array(f),d=0;d<f;d++)c[d]=arguments[d+2];n.children=c}if(e&&e.defaultProps)for(r in f=e.defaultProps,f)n[r]===void 0&&(n[r]=f[r]);return{$$typeof:w,type:e,key:u,ref:l,props:n,_owner:B.current}}function Ze(e,t){return{$$typeof:w,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function G(e){return typeof e=="object"&&e!==null&&e.$$typeof===w}function We(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(o){return t[o]})}var de=/\/+/g;function A(e,t){return typeof e=="object"&&e!==null&&e.key!=null?We(""+e.key):t.toString(36)}function k(e,t,o,r,n){var u=typeof e;(u==="undefined"||u==="boolean")&&(e=null);var l=!1;if(e===null)l=!0;else switch(u){case"string":case"number":l=!0;break;case"object":switch(e.$$typeof){case w:case Ge:l=!0}}if(l)return l=e,n=n(l),e=r===""?"."+A(l,0):r,ae(n)?(o="",e!=null&&(o=e.replace(de,"$&/")+"/"),k(n,t,o,"",function(d){return d})):n!=null&&(G(n)&&(n=Ze(n,o+(!n.key||l&&l.key===n.key?"":(""+n.key).replace(de,"$&/")+"/")+e)),t.push(n)),1;if(l=0,r=r===""?".":r+":",ae(e))for(var f=0;f<e.length;f++){u=e[f];var c=r+A(u,f);l+=k(u,t,o,c,n)}else if(c=Qe(e),typeof c=="function")for(e=c.call(e),f=0;!(u=e.next()).done;)u=u.value,c=r+A(u,f++),l+=k(u,t,o,c,n);else if(u==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return l}function U(e,t,o){if(e==null)return e;var r=[],n=0;return k(e,r,"","",function(u){return t.call(o,u,n++)}),r}function et(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(o){(e._status===0||e._status===-1)&&(e._status=1,e._result=o)},function(o){(e._status===0||e._status===-1)&&(e._status=2,e._result=o)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var a={current:null},j={transition:null},tt={ReactCurrentDispatcher:a,ReactCurrentBatchConfig:j,ReactCurrentOwner:B};function Re(){throw Error("act(...) is not supported in production builds of React.")}i.Children={map:U,forEach:function(e,t,o){U(e,function(){t.apply(this,arguments)},o)},count:function(e){var t=0;return U(e,function(){t++}),t},toArray:function(e){return U(e,function(t){return t})||[]},only:function(e){if(!G(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};i.Component=R;i.Fragment=Ne;i.Profiler=qe;i.PureComponent=F;i.StrictMode=Ve;i.Suspense=Xe;i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=tt;i.act=Re;i.cloneElement=function(e,t,o){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=he({},e.props),n=e.key,u=e.ref,l=e._owner;if(t!=null){if(t.ref!==void 0&&(u=t.ref,l=B.current),t.key!==void 0&&(n=""+t.key),e.type&&e.type.defaultProps)var f=e.type.defaultProps;for(c in t)be.call(t,c)&&!Ce.hasOwnProperty(c)&&(r[c]=t[c]===void 0&&f!==void 0?f[c]:t[c])}var c=arguments.length-2;if(c===1)r.children=o;else if(1<c){f=Array(c);for(var d=0;d<c;d++)f[d]=arguments[d+2];r.children=f}return{$$typeof:w,type:e.type,key:n,ref:u,props:r,_owner:l}};i.createContext=function(e){return e={$$typeof:He,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:Ke,_context:e},e.Consumer=e};i.createElement=xe;i.createFactory=function(e){var t=xe.bind(null,e);return t.type=e,t};i.createRef=function(){return{current:null}};i.forwardRef=function(e){return{$$typeof:Pe,render:e}};i.isValidElement=G;i.lazy=function(e){return{$$typeof:Je,_payload:{_status:-1,_result:e},_init:et}};i.memo=function(e,t){return{$$typeof:Ye,type:e,compare:t===void 0?null:t}};i.startTransition=function(e){var t=j.transition;j.transition={};try{e()}finally{j.transition=t}};i.unstable_act=Re;i.useCallback=function(e,t){return a.current.useCallback(e,t)};i.useContext=function(e){return a.current.useContext(e)};i.useDebugValue=function(){};i.useDeferredValue=function(e){return a.current.useDeferredValue(e)};i.useEffect=function(e,t){return a.current.useEffect(e,t)};i.useId=function(){return a.current.useId()};i.useImperativeHandle=function(e,t,o){return a.current.useImperativeHandle(e,t,o)};i.useInsertionEffect=function(e,t){return a.current.useInsertionEffect(e,t)};i.useLayoutEffect=function(e,t){return a.current.useLayoutEffect(e,t)};i.useMemo=function(e,t){return a.current.useMemo(e,t)};i.useReducer=function(e,t,o){return a.current.useReducer(e,t,o)};i.useRef=function(e){return a.current.useRef(e)};i.useState=function(e){return a.current.useState(e)};i.useSyncExternalStore=function(e,t,o){return a.current.useSyncExternalStore(e,t,o)};i.useTransition=function(){return a.current.useTransition()};i.version="18.3.1";ve.exports=i;var v=ve.exports;const nt=Be(v),vt=ze({__proto__:null,default:nt},[v]);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rt=v,ot=Symbol.for("react.element"),ut=Symbol.for("react.fragment"),it=Object.prototype.hasOwnProperty,lt=rt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,ct={key:!0,ref:!0,__self:!0,__source:!0};function we(e,t,o){var r,n={},u=null,l=null;o!==void 0&&(u=""+o),t.key!==void 0&&(u=""+t.key),t.ref!==void 0&&(l=t.ref);for(r in t)it.call(t,r)&&!ct.hasOwnProperty(r)&&(n[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)n[r]===void 0&&(n[r]=t[r]);return{$$typeof:ot,type:e,key:u,ref:l,props:n,_owner:lt.current}}I.Fragment=ut;I.jsx=we;I.jsxs=we;pe.exports=I;var ft=pe.exports;const st=`
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,at=`
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;

  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];

    gradientColor = mix(c1, c2, f);
  }

  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);

      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`,me=8;function dt(e){let t=e.trim();t.startsWith("#")&&(t=t.slice(1));let o=255,r=255,n=255;return t.length===3?(o=parseInt(t[0]+t[0],16),r=parseInt(t[1]+t[1],16),n=parseInt(t[2]+t[2],16)):t.length===6&&(o=parseInt(t.slice(0,2),16),r=parseInt(t.slice(2,4),16),n=parseInt(t.slice(4,6),16)),new x(o/255,r/255,n/255)}function mt({linesGradient:e,enabledWaves:t=["top","middle","bottom"],lineCount:o=[6],lineDistance:r=[5],topWavePosition:n,middleWavePosition:u,bottomWavePosition:l={x:2,y:-.7,rotate:-1},animationSpeed:f=1,interactive:c=!0,bendRadius:d=5,bendStrength:N=-.5,mouseDamping:E=.05,parallax:L=!0,parallaxStrength:S=.2,mixBlendMode:Ee="screen"}){const V=v.useRef(null),q=v.useRef(new C(-1e3,-1e3)),K=v.useRef(new C(-1e3,-1e3)),$=v.useRef(0),M=v.useRef(0),H=v.useRef(new C(0,0)),P=v.useRef(new C(0,0)),T=m=>{if(typeof o=="number")return o;if(!t.includes(m))return 0;const y=t.indexOf(m);return o[y]??6},D=m=>{if(typeof r=="number")return r;if(!t.includes(m))return .1;const y=t.indexOf(m);return r[y]??.1},X=t.includes("top")?T("top"):0,Y=t.includes("middle")?T("middle"):0,J=t.includes("bottom")?T("bottom"):0,Q=t.includes("top")?D("top")*.01:.01,Z=t.includes("middle")?D("middle")*.01:.01,W=t.includes("bottom")?D("bottom")*.01:.01;return v.useEffect(()=>{const m=V.current;if(!m)return;let y=!0;const ee=new Ie,te=new $e(-1,1,1,-1,0,1);te.position.z=1;const s=new Me({antialias:!0,alpha:!1});s.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),s.domElement.style.width="100%",s.domElement.style.height="100%",m.appendChild(s.domElement);const h={iTime:{value:0},iResolution:{value:new x(1,1,1)},animationSpeed:{value:f},enableTop:{value:t.includes("top")},enableMiddle:{value:t.includes("middle")},enableBottom:{value:t.includes("bottom")},topLineCount:{value:X},middleLineCount:{value:Y},bottomLineCount:{value:J},topLineDistance:{value:Q},middleLineDistance:{value:Z},bottomLineDistance:{value:W},topWavePosition:{value:new x((n==null?void 0:n.x)??10,(n==null?void 0:n.y)??.5,(n==null?void 0:n.rotate)??-.4)},middleWavePosition:{value:new x((u==null?void 0:u.x)??5,(u==null?void 0:u.y)??0,(u==null?void 0:u.rotate)??.2)},bottomWavePosition:{value:new x((l==null?void 0:l.x)??2,(l==null?void 0:l.y)??-.7,(l==null?void 0:l.rotate)??.4)},iMouse:{value:new C(-1e3,-1e3)},interactive:{value:c},bendRadius:{value:d},bendStrength:{value:N},bendInfluence:{value:0},parallax:{value:L},parallaxStrength:{value:S},parallaxOffset:{value:new C(0,0)},lineGradient:{value:Array.from({length:me},()=>new x(1,1,1))},lineGradientCount:{value:0}};if(e&&e.length>0){const g=e.slice(0,me);h.lineGradientCount.value=g.length,g.forEach((p,b)=>{const _=dt(p);h.lineGradient.value[b].set(_.x,_.y,_.z)})}const ne=new Te({uniforms:h,vertexShader:st,fragmentShader:at}),re=new De(2,2),Le=new Ae(re,ne);ee.add(Le);const Se=new Fe,oe=()=>{if(!y)return;const g=m.clientWidth||1,p=m.clientHeight||1;s.setSize(g,p,!1);const b=s.domElement.width,_=s.domElement.height;h.iResolution.value.set(b,_,1)};oe();const O=typeof ResizeObserver<"u"?new ResizeObserver(()=>{y&&oe()}):null;O&&O.observe(m);const ue=g=>{const p=s.domElement.getBoundingClientRect(),b=g.clientX-p.left,_=g.clientY-p.top,fe=s.getPixelRatio();if(q.current.set(b*fe,(p.height-_)*fe),$.current=1,L){const Oe=p.width/2,Ue=p.height/2,ke=(b-Oe)/p.width,je=-(_-Ue)/p.height;H.current.set(ke*S,je*S)}},ie=()=>{$.current=0};c&&(s.domElement.addEventListener("pointermove",ue),s.domElement.addEventListener("pointerleave",ie));let le=0;const ce=()=>{y&&(h.iTime.value=Se.getElapsedTime(),c&&(K.current.lerp(q.current,E),h.iMouse.value.copy(K.current),M.current+=($.current-M.current)*E,h.bendInfluence.value=M.current),L&&(P.current.lerp(H.current,E),h.parallaxOffset.value.copy(P.current)),s.render(ee,te),le=window.requestAnimationFrame(ce))};return ce(),()=>{y=!1,window.cancelAnimationFrame(le),O&&O.disconnect(),c&&(s.domElement.removeEventListener("pointermove",ue),s.domElement.removeEventListener("pointerleave",ie)),re.dispose(),ne.dispose(),s.dispose(),s.forceContextLoss(),s.domElement.parentElement&&s.domElement.parentElement.removeChild(s.domElement)}},[f,d,N,J,W,l,t,c,r,e,o,Y,Z,u,E,L,S,X,Q,n]),ft.jsx("div",{ref:V,className:"floating-lines-container",style:{mixBlendMode:Ee}})}const yt=Object.freeze(Object.defineProperty({__proto__:null,default:mt},Symbol.toStringTag,{value:"Module"}));export{yt as F,vt as R,nt as a,ft as j,v as r};
