"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([["4019"],{9526(t,e,i){i.d(e,{A:()=>a});var r=i(4848);i(6540);var o=i(9863);function a({children:t,fallback:e}){return(0,o.A)()?(0,r.jsx)(r.Fragment,{children:t?.()}):e??null}},3385(t,e,i){i.d(e,{EJ:()=>w});var r=i(6540);let o=`#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;

  // ===================================================

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;

  #ifdef ADD_HELPERS
  v_responsiveHelperBox = uv;
  v_responsiveHelperBox *= responsiveBoxScale;
  v_responsiveHelperBox += boxOrigin * (responsiveBoxScale - 1.);
  #endif

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;
}`,a=8294400;class n{parentElement;canvasElement;gl;program=null;uniformLocations={};fragmentShader;rafId=null;lastRenderTime=0;currentFrame=0;speed=0;currentSpeed=0;providedUniforms;mipmaps=[];hasBeenDisposed=!1;resolutionChanged=!0;textures=new Map;minPixelRatio;maxPixelCount;isSafari=(function(){let t=navigator.userAgent.toLowerCase();return t.includes("safari")&&!t.includes("chrome")&&!t.includes("android")})();uniformCache={};textureUnitMap=new Map;ownerDocument;constructor(t,e,i,r,o=0,n=0,s=2,h=a,c=[]){if(t?.nodeType===1)this.parentElement=t;else throw Error("Paper Shaders: parent element must be an HTMLElement");if(this.ownerDocument=t.ownerDocument,!this.ownerDocument.querySelector("style[data-paper-shader]")){let t=this.ownerDocument.createElement("style");t.innerHTML=l,t.setAttribute("data-paper-shader",""),this.ownerDocument.head.prepend(t)}let u=this.ownerDocument.createElement("canvas");this.canvasElement=u,this.parentElement.prepend(u),this.fragmentShader=e,this.providedUniforms=i,this.mipmaps=c,this.currentFrame=n,this.minPixelRatio=s,this.maxPixelCount=h;let d=u.getContext("webgl2",r);if(!d)throw Error("Paper Shaders: WebGL is not supported in this browser");this.gl=d,this.initProgram(),this.setupPositionAttribute(),this.setupUniforms(),this.setUniformValues(this.providedUniforms),this.setupResizeObserver(),visualViewport?.addEventListener("resize",this.handleVisualViewportChange),this.setSpeed(o),this.parentElement.setAttribute("data-paper-shader",""),this.parentElement.paperShaderMount=this,this.ownerDocument.addEventListener("visibilitychange",this.handleDocumentVisibilityChange)}initProgram=()=>{let t=function(t,e,i){let r=t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.MEDIUM_FLOAT),o=r?r.precision:null;o&&o<23&&(e=e.replace(/precision\s+(lowp|mediump)\s+float;/g,"precision highp float;"),i=i.replace(/precision\s+(lowp|mediump)\s+float/g,"precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,"$1 highp $3"));let a=s(t,t.VERTEX_SHADER,e),n=s(t,t.FRAGMENT_SHADER,i);if(!a||!n)return null;let l=t.createProgram();return l?(t.attachShader(l,a),t.attachShader(l,n),t.linkProgram(l),t.getProgramParameter(l,t.LINK_STATUS))?(t.detachShader(l,a),t.detachShader(l,n),t.deleteShader(a),t.deleteShader(n),l):(console.error("Unable to initialize the shader program: "+t.getProgramInfoLog(l)),t.deleteProgram(l),t.deleteShader(a),t.deleteShader(n),null):null}(this.gl,o,this.fragmentShader);t&&(this.program=t)};setupPositionAttribute=()=>{let t=this.gl.getAttribLocation(this.program,"a_position"),e=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(t),this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,0,0)};setupUniforms=()=>{let t={u_time:this.gl.getUniformLocation(this.program,"u_time"),u_pixelRatio:this.gl.getUniformLocation(this.program,"u_pixelRatio"),u_resolution:this.gl.getUniformLocation(this.program,"u_resolution")};Object.entries(this.providedUniforms).forEach(([e,i])=>{if(t[e]=this.gl.getUniformLocation(this.program,e),i instanceof HTMLImageElement){let i=`${e}AspectRatio`;t[i]=this.gl.getUniformLocation(this.program,i)}}),this.uniformLocations=t};renderScale=1;parentWidth=0;parentHeight=0;parentDevicePixelWidth=0;parentDevicePixelHeight=0;devicePixelsSupported=!1;resizeObserver=null;setupResizeObserver=()=>{this.resizeObserver=new ResizeObserver(([t])=>{if(t?.borderBoxSize[0]){let e=t.devicePixelContentBoxSize?.[0];void 0!==e&&(this.devicePixelsSupported=!0,this.parentDevicePixelWidth=e.inlineSize,this.parentDevicePixelHeight=e.blockSize),this.parentWidth=t.borderBoxSize[0].inlineSize,this.parentHeight=t.borderBoxSize[0].blockSize}this.handleResize()}),this.resizeObserver.observe(this.parentElement)};handleVisualViewportChange=()=>{this.resizeObserver?.disconnect(),this.setupResizeObserver()};handleResize=()=>{let t=0,e=0,i=Math.max(1,window.devicePixelRatio),r=visualViewport?.scale??1;if(this.devicePixelsSupported){let o=Math.max(1,this.minPixelRatio/i);t=this.parentDevicePixelWidth*o*r,e=this.parentDevicePixelHeight*o*r}else{var o;let a,n,s=Math.max(i,this.minPixelRatio)*r;this.isSafari&&(s*=Math.max(1,(o=this.ownerDocument,(n=Math.round(100*(a=outerWidth/((visualViewport?.scale??1)*(visualViewport?.width??window.innerWidth)+(window.innerWidth-o.documentElement.clientWidth)))))%5==0?n/100:33===n?1/3:67===n?2/3:133===n?4/3:a))),t=Math.round(this.parentWidth)*s,e=Math.round(this.parentHeight)*s}let a=Math.min(1,Math.sqrt(this.maxPixelCount)/Math.sqrt(t*e)),n=Math.round(t*a),s=Math.round(e*a),l=n/Math.round(this.parentWidth);(this.canvasElement.width!==n||this.canvasElement.height!==s||this.renderScale!==l)&&(this.renderScale=l,this.canvasElement.width=n,this.canvasElement.height=s,this.resolutionChanged=!0,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height),this.render(performance.now()))};render=t=>{if(this.hasBeenDisposed)return;if(null===this.program)return void console.warn("Tried to render before program or gl was initialized");let e=t-this.lastRenderTime;this.lastRenderTime=t,0!==this.currentSpeed&&(this.currentFrame+=e*this.currentSpeed),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.useProgram(this.program),this.gl.uniform1f(this.uniformLocations.u_time,.001*this.currentFrame),this.resolutionChanged&&(this.gl.uniform2f(this.uniformLocations.u_resolution,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.uniformLocations.u_pixelRatio,this.renderScale),this.resolutionChanged=!1),this.gl.drawArrays(this.gl.TRIANGLES,0,6),0!==this.currentSpeed?this.requestRender():this.rafId=null};requestRender=()=>{null!==this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=requestAnimationFrame(this.render)};setTextureUniform=(t,e)=>{if(!e.complete||0===e.naturalWidth)throw Error(`Paper Shaders: image for uniform ${t} must be fully loaded`);let i=this.textures.get(t);i&&this.gl.deleteTexture(i),this.textureUnitMap.has(t)||this.textureUnitMap.set(t,this.textureUnitMap.size);let r=this.textureUnitMap.get(t);this.gl.activeTexture(this.gl.TEXTURE0+r);let o=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,o),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,e),this.mipmaps.includes(t)&&(this.gl.generateMipmap(this.gl.TEXTURE_2D),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR_MIPMAP_LINEAR));let a=this.gl.getError();if(a!==this.gl.NO_ERROR||null===o)return void console.error("Paper Shaders: WebGL error when uploading texture:",a);this.textures.set(t,o);let n=this.uniformLocations[t];if(n){this.gl.uniform1i(n,r);let i=`${t}AspectRatio`,o=this.uniformLocations[i];if(o){let t=e.naturalWidth/e.naturalHeight;this.gl.uniform1f(o,t)}}};areUniformValuesEqual=(t,e)=>t===e||!!(Array.isArray(t)&&Array.isArray(e))&&t.length===e.length&&t.every((t,i)=>this.areUniformValuesEqual(t,e[i]));setUniformValues=t=>{this.gl.useProgram(this.program),Object.entries(t).forEach(([t,e])=>{let i=e;if(e instanceof HTMLImageElement&&(i=`${e.src.slice(0,200)}|${e.naturalWidth}x${e.naturalHeight}`),this.areUniformValuesEqual(this.uniformCache[t],i))return;this.uniformCache[t]=i;let r=this.uniformLocations[t];if(!r)return void console.warn(`Uniform location for ${t} not found`);if(e instanceof HTMLImageElement)this.setTextureUniform(t,e);else if(Array.isArray(e)){let i=null,o=null;if(void 0!==e[0]&&Array.isArray(e[0])){let r=e[0].length;if(!e.every(t=>t.length===r))return void console.warn(`All child arrays must be the same length for ${t}`);i=e.flat(),o=r}else o=(i=e).length;switch(o){case 2:this.gl.uniform2fv(r,i);break;case 3:this.gl.uniform3fv(r,i);break;case 4:this.gl.uniform4fv(r,i);break;case 9:this.gl.uniformMatrix3fv(r,!1,i);break;case 16:this.gl.uniformMatrix4fv(r,!1,i);break;default:console.warn(`Unsupported uniform array length: ${o}`)}}else"number"==typeof e?this.gl.uniform1f(r,e):"boolean"==typeof e?this.gl.uniform1i(r,+!!e):console.warn(`Unsupported uniform type for ${t}: ${typeof e}`)})};getCurrentFrame=()=>this.currentFrame;setFrame=t=>{this.currentFrame=t,this.lastRenderTime=performance.now(),this.render(performance.now())};setSpeed=(t=1)=>{this.speed=t,this.setCurrentSpeed(this.ownerDocument.hidden?0:t)};setCurrentSpeed=t=>{this.currentSpeed=t,null===this.rafId&&0!==t&&(this.lastRenderTime=performance.now(),this.rafId=requestAnimationFrame(this.render)),null!==this.rafId&&0===t&&(cancelAnimationFrame(this.rafId),this.rafId=null)};setMaxPixelCount=(t=a)=>{this.maxPixelCount=t,this.handleResize()};setMinPixelRatio=(t=2)=>{this.minPixelRatio=t,this.handleResize()};setUniforms=t=>{this.setUniformValues(t),this.providedUniforms={...this.providedUniforms,...t},this.render(performance.now())};handleDocumentVisibilityChange=()=>{this.setCurrentSpeed(this.ownerDocument.hidden?0:this.speed)};dispose=()=>{this.hasBeenDisposed=!0,null!==this.rafId&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.gl&&this.program&&(this.textures.forEach(t=>{this.gl.deleteTexture(t)}),this.textures.clear(),this.gl.deleteProgram(this.program),this.program=null,this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.getError()),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),visualViewport?.removeEventListener("resize",this.handleVisualViewportChange),this.ownerDocument.removeEventListener("visibilitychange",this.handleDocumentVisibilityChange),this.uniformLocations={},this.canvasElement.remove(),delete this.parentElement.paperShaderMount}}function s(t,e,i){let r=t.createShader(e);return r?(t.shaderSource(r,i),t.compileShader(r),t.getShaderParameter(r,t.COMPILE_STATUS))?r:(console.error("An error occurred compiling the shaders: "+t.getShaderInfoLog(r)),t.deleteShader(r),null):null}let l=`@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;function h(t){if(t.naturalWidth<1024&&t.naturalHeight<1024){if(t.naturalWidth<1||t.naturalHeight<1)return;let e=t.naturalWidth/t.naturalHeight;t.width=Math.round(e>1?1024*e:1024),t.height=Math.round(e>1?1024:1024/e)}}var c=i(4848);async function u(t){let e={},i=[];return Object.entries(t).forEach(([t,r])=>{if("string"==typeof r){let o=r||"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";if(!(t=>{try{if(t.startsWith("/"))return!0;return new URL(t),!0}catch{return!1}})(o))return void console.warn(`Uniform "${t}" has invalid URL "${o}". Skipping image loading.`);let a=new Promise((i,r)=>{let a=new Image;(t=>{try{if(t.startsWith("/"))return!1;return new URL(t,window.location.origin).origin!==window.location.origin}catch{return!1}})(o)&&(a.crossOrigin="anonymous"),a.onload=()=>{h(a),e[t]=a,i()},a.onerror=()=>{console.error(`Could not set uniforms. Failed to load image at ${o}`),r()},a.src=o});i.push(a)}else r instanceof HTMLImageElement&&h(r),e[t]=r}),await Promise.all(i),e}let d=(0,r.forwardRef)(function({fragmentShader:t,uniforms:e,webGlContextAttributes:i,speed:o=0,frame:a=0,width:s,height:l,minPixelRatio:h,maxPixelCount:d,mipmaps:p,style:g,...f},m){var v;let x,y,[k,b]=(0,r.useState)(!1),_=(0,r.useRef)(null),w=(0,r.useRef)(null),S=(0,r.useRef)(i);(0,r.useEffect)(()=>((async()=>{let i=await u(e);_.current&&!w.current&&(w.current=new n(_.current,t,i,S.current,o,a,h,d,p),b(!0))})(),()=>{w.current?.dispose(),w.current=null}),[t]),(0,r.useEffect)(()=>{let t=!1;return(async()=>{let i=await u(e);t||w.current?.setUniforms(i)})(),()=>{t=!0}},[e,k]),(0,r.useEffect)(()=>{w.current?.setSpeed(o)},[o,k]),(0,r.useEffect)(()=>{w.current?.setMaxPixelCount(d)},[d,k]),(0,r.useEffect)(()=>{w.current?.setMinPixelRatio(h)},[h,k]),(0,r.useEffect)(()=>{w.current?.setFrame(a)},[a,k]);let B=(v=[_,m],x=r.useRef(void 0),y=r.useCallback(t=>{let e=v.map(e=>{if(null!=e){if("function"==typeof e){let i=e(t);return"function"==typeof i?i:()=>{e(null)}}return e.current=t,()=>{e.current=null}}});return()=>{e.forEach(t=>t?.())}},v),r.useMemo(()=>v.every(t=>null==t)?null:t=>{x.current&&(x.current(),x.current=void 0),null!=t&&(x.current=y(t))},v));return(0,c.jsx)("div",{ref:B,style:void 0!==s||void 0!==l?{width:"string"==typeof s&&!1===isNaN(+s)?+s:s,height:"string"==typeof l&&!1===isNaN(+l)?+l:l,...g}:g,...f})});d.displayName="ShaderMount";let p={fit:"contain",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},g={none:0,contain:1,cover:2};function f(t){if(Array.isArray(t))return 4===t.length?t:3===t.length?[...t,1]:v;if("string"!=typeof t)return v;let e,i,r,o=1;if(t.startsWith("#")){var a;[e,i,r,o]=(3===(a=(a=t).replace(/^#/,"")).length&&(a=a.split("").map(t=>t+t).join("")),6===a.length&&(a+="ff"),[parseInt(a.slice(0,2),16)/255,parseInt(a.slice(2,4),16)/255,parseInt(a.slice(4,6),16)/255,parseInt(a.slice(6,8),16)/255])}else if(t.startsWith("rgb")){let a;[e,i,r,o]=(a=t.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(a[1]??"0")/255,parseInt(a[2]??"0")/255,parseInt(a[3]??"0")/255,void 0===a[4]?1:parseFloat(a[4])]:[0,0,0,1]}else{let a;if(!t.startsWith("hsl"))return console.error("Unsupported color format",t),v;[e,i,r,o]=function(t){let e,i,r,[o,a,n,s]=t,l=o/360,h=a/100,c=n/100;if(0===a)e=i=r=c;else{let t=(t,e,i)=>(i<0&&(i+=1),i>1&&(i-=1),i<1/6)?t+(e-t)*6*i:i<.5?e:i<2/3?t+(e-t)*(2/3-i)*6:t,o=c<.5?c*(1+h):c+h-c*h,a=2*c-o;e=t(a,o,l+1/3),i=t(a,o,l),r=t(a,o,l-1/3)}return[e,i,r,s]}((a=t.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i))?[parseInt(a[1]??"0"),parseInt(a[2]??"0"),parseInt(a[3]??"0"),void 0===a[4]?1:parseFloat(a[4])]:[0,0,0,1])}return[m(e,0,1),m(i,0,1),m(r,0,1),m(o,0,1)]}let m=(t,e,i)=>Math.min(Math.max(t,e),i),v=[0,0,0,1],x=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,y=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,k=`
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`,b=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colorHighlight;

uniform sampler2D u_image;
uniform float u_imageAspectRatio;

uniform float u_size;
uniform float u_highlights;
uniform float u_layering;
uniform float u_edges;
uniform float u_caustic;
uniform float u_waves;

in vec2 v_imageUV;

out vec4 fragColor;

${x}
${y}
${k}

float getUvFrame(vec2 uv) {
  float aax = 2. * fwidth(uv.x);
  float aay = 2. * fwidth(uv.y);

  float left   = smoothstep(0., aax, uv.x);
  float right = 1.0 - smoothstep(1. - aax, 1., uv.x);
  float bottom = smoothstep(0., aay, uv.y);
  float top = 1.0 - smoothstep(1. - aay, 1., uv.y);

  return left * right * bottom * top;
}

mat2 rotate2D(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float getCausticNoise(vec2 uv, float t, float scale) {
  vec2 n = vec2(.1);
  vec2 N = vec2(.1);
  mat2 m = rotate2D(.5);
  for (int j = 0; j < 6; j++) {
    uv *= m;
    n *= m;
    vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
    n += sin(q);
    N += cos(q) / scale;
    scale *= 1.1;
  }
  return (N.x + N.y + 1.);
}

void main() {
  vec2 imageUV = v_imageUV;
  vec2 patternUV = v_imageUV - .5;
  patternUV = (patternUV * vec2(u_imageAspectRatio, 1.));
  patternUV /= (.01 + .09 * u_size);

  float t = u_time;

  float wavesNoise = snoise((.3 + .1 * sin(t)) * .1 * patternUV + vec2(0., .4 * t));

  float causticNoise = getCausticNoise(patternUV + u_waves * vec2(1., -1.) * wavesNoise, 2. * t, 1.5);

  causticNoise += u_layering * getCausticNoise(patternUV + 2. * u_waves * vec2(1., -1.) * wavesNoise, 1.5 * t, 2.);
  causticNoise = causticNoise * causticNoise;

  float edgesDistortion = smoothstep(0., .1, imageUV.x);
  edgesDistortion *= smoothstep(0., .1, imageUV.y);
  edgesDistortion *= (smoothstep(1., 1.1, imageUV.x) + (1.0 - smoothstep(.8, .95, imageUV.x)));
  edgesDistortion *= (1.0 - smoothstep(.9, 1., imageUV.y));
  edgesDistortion = mix(edgesDistortion, 1., u_edges);

  float causticNoiseDistortion = .02 * causticNoise * edgesDistortion;

  float wavesDistortion = .1 * u_waves * wavesNoise;

  imageUV += vec2(wavesDistortion, -wavesDistortion);
  imageUV += (u_caustic * causticNoiseDistortion);

  float frame = getUvFrame(imageUV);

  vec4 image = texture(u_image, imageUV);
  vec4 backColor = u_colorBack;
  backColor.rgb *= backColor.a;

  vec3 color = mix(backColor.rgb, image.rgb, image.a * frame);
  float opacity = backColor.a + image.a * frame;

  causticNoise = max(-.2, causticNoise);

  float hightlight = .025 * u_highlights * causticNoise;
  hightlight *= u_colorHighlight.a;
  color = mix(color, u_colorHighlight.rgb, .05 * u_highlights * causticNoise);
  opacity += hightlight;

  color += hightlight * (.5 + .5 * wavesNoise);
  opacity += hightlight * (.5 + .5 * wavesNoise);

  opacity = clamp(opacity, 0., 1.);

  fragColor = vec4(color, opacity);
}
`,_={name:"Default",params:{...p,scale:.8,speed:1,frame:0,colorBack:"#909090",colorHighlight:"#ffffff",highlights:.07,layering:.5,edges:.8,waves:.3,caustic:.1,size:1}},w=(0,r.memo)(function({speed:t=_.params.speed,frame:e=_.params.frame,colorBack:i=_.params.colorBack,colorHighlight:r=_.params.colorHighlight,image:o="",highlights:a=_.params.highlights,layering:n=_.params.layering,waves:s=_.params.waves,edges:l=_.params.edges,caustic:h=_.params.caustic,effectScale:u,size:p=void 0===u?_.params.size:10/9/u-1/9,fit:m=_.params.fit,scale:v=_.params.scale,rotation:x=_.params.rotation,originX:y=_.params.originX,originY:k=_.params.originY,offsetX:w=_.params.offsetX,offsetY:S=_.params.offsetY,worldWidth:B=_.params.worldWidth,worldHeight:C=_.params.worldHeight,...E}){let L={u_image:o,u_colorBack:f(i),u_colorHighlight:f(r),u_highlights:a,u_layering:n,u_waves:s,u_edges:l,u_caustic:h,u_size:p,u_fit:g[m],u_rotation:x,u_scale:v,u_offsetX:w,u_offsetY:S,u_originX:y,u_originY:k,u_worldWidth:B,u_worldHeight:C};return(0,c.jsx)(d,{...E,speed:t,frame:e,fragmentShader:b,mipmaps:["u_image"],uniforms:L})},function(t,e){for(let i in t){if("colors"===i){let i=Array.isArray(t.colors),r=Array.isArray(e.colors);if(!i||!r){if(!1===Object.is(t.colors,e.colors))return!1;continue}if(t.colors?.length!==e.colors?.length||!t.colors?.every((t,i)=>t===e.colors?.[i]))return!1;continue}if(!1===Object.is(t[i],e[i]))return!1}return!0})},9197(t,e,i){i.d(e,{QEs:()=>o,ao$:()=>a,gt3:()=>s,hL4:()=>n});var r=i(1148);function o(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"},child:[]}]})(t)}function a(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"},child:[]}]})(t)}function n(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 496 512"},child:[{tag:"path",attr:{d:"M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"},child:[]}]})(t)}function s(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"},child:[]}]})(t)}},6250(t,e,i){i.d(e,{eS$:()=>o});var r=i(1148);function o(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24"},child:[{tag:"path",attr:{d:"M14 20.408c-.492.308-.903.546-1.192.709-.153.086-.308.17-.463.252h-.002a.75.75 0 0 1-.686 0 16.709 16.709 0 0 1-.465-.252 31.147 31.147 0 0 1-4.803-3.34C3.8 15.572 1 12.331 1 8.513 1 5.052 3.829 2.5 6.736 2.5 9.03 2.5 10.881 3.726 12 5.605 13.12 3.726 14.97 2.5 17.264 2.5 20.17 2.5 23 5.052 23 8.514c0 3.818-2.801 7.06-5.389 9.262A31.146 31.146 0 0 1 14 20.408Z"},child:[]}]})(t)}},1148(t,e,i){i.d(e,{k5:()=>c});var r=i(6540),o={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},a=r.createContext&&r.createContext(o),n=["attr","size","title"];function s(){return(s=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var r in i)({}).hasOwnProperty.call(i,r)&&(t[r]=i[r])}return t}).apply(null,arguments)}function l(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),i.push.apply(i,r)}return i}function h(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?l(Object(i),!0).forEach(function(e){var r,o,a;r=t,o=e,a=i[e],(o=function(t){var e=function(t,e){if("object"!=typeof t||!t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var r=i.call(t,e||"default");if("object"!=typeof r)return r;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==typeof e?e:e+""}(o))in r?Object.defineProperty(r,o,{value:a,enumerable:!0,configurable:!0,writable:!0}):r[o]=a}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):l(Object(i)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))})}return t}function c(t){return e=>r.createElement(u,s({attr:h({},t.attr)},e),function t(e){return e&&e.map((e,i)=>r.createElement(e.tag,h({key:i},e.attr),t(e.child)))}(t.child))}function u(t){var e=e=>{var i,o=t.attr,a=t.size,l=t.title,c=function(t,e){if(null==t)return{};var i,r,o=function(t,e){if(null==t)return{};var i={};for(var r in t)if(({}).hasOwnProperty.call(t,r)){if(-1!==e.indexOf(r))continue;i[r]=t[r]}return i}(t,e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);for(r=0;r<a.length;r++)i=a[r],-1===e.indexOf(i)&&({}).propertyIsEnumerable.call(t,i)&&(o[i]=t[i])}return o}(t,n),u=a||e.size||"1em";return e.className&&(i=e.className),t.className&&(i=(i?i+" ":"")+t.className),r.createElement("svg",s({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},e.attr,o,c,{className:i,style:h(h({color:t.color||e.color},e.style),t.style),height:u,width:u,xmlns:"http://www.w3.org/2000/svg"}),l&&r.createElement("title",null,l),t.children)};return void 0!==a?r.createElement(a.Consumer,null,t=>e(t)):e(o)}},37(t,e,i){i.d(e,{$G0:()=>_,KZv:()=>g,MbK:()=>C,NZl:()=>L,Qv8:()=>c,SXS:()=>o,Szr:()=>E,Tcv:()=>A,VIB:()=>h,Z5q:()=>M,_rf:()=>p,bQY:()=>k,c2m:()=>w,e8Y:()=>S,f0L:()=>d,gXU:()=>x,h2r:()=>m,lfb:()=>z,m1s:()=>b,nOZ:()=>v,o07:()=>s,pmW:()=>n,qbB:()=>u,sVt:()=>R,sk9:()=>B,tXg:()=>a,tn0:()=>l,u$o:()=>y,wwB:()=>U,z9i:()=>f});var r=i(1148);function o(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M18 6 6 18"},child:[]},{tag:"path",attr:{d:"m6 6 12 12"},child:[]}]})(t)}function a(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"},child:[]},{tag:"path",attr:{d:"m14 7 3 3"},child:[]},{tag:"path",attr:{d:"M5 6v4"},child:[]},{tag:"path",attr:{d:"M19 14v4"},child:[]},{tag:"path",attr:{d:"M10 2v2"},child:[]},{tag:"path",attr:{d:"M7 8H3"},child:[]},{tag:"path",attr:{d:"M21 16h-4"},child:[]},{tag:"path",attr:{d:"M11 3H9"},child:[]}]})(t)}function n(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"},child:[]},{tag:"circle",attr:{cx:"12",cy:"7",r:"4"},child:[]}]})(t)}function s(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"4 17 10 11 4 5"},child:[]},{tag:"line",attr:{x1:"12",x2:"20",y1:"19",y2:"19"},child:[]}]})(t)}function l(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"},child:[]},{tag:"path",attr:{d:"M9 12h6"},child:[]},{tag:"path",attr:{d:"M12 9v6"},child:[]}]})(t)}function h(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"},child:[]},{tag:"path",attr:{d:"m9 12 2 2 4-4"},child:[]}]})(t)}function c(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"},child:[]},{tag:"path",attr:{d:"m21.854 2.147-10.94 10.939"},child:[]}]})(t)}function u(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"11",cy:"11",r:"8"},child:[]},{tag:"path",attr:{d:"m21 21-4.3-4.3"},child:[]}]})(t)}function d(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 7V5a2 2 0 0 1 2-2h2"},child:[]},{tag:"path",attr:{d:"M17 3h2a2 2 0 0 1 2 2v2"},child:[]},{tag:"path",attr:{d:"M21 17v2a2 2 0 0 1-2 2h-2"},child:[]},{tag:"path",attr:{d:"M7 21H5a2 2 0 0 1-2-2v-2"},child:[]},{tag:"circle",attr:{cx:"12",cy:"12",r:"3"},child:[]},{tag:"path",attr:{d:"m16 16-1.9-1.9"},child:[]}]})(t)}function p(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M5 12h14"},child:[]},{tag:"path",attr:{d:"M12 5v14"},child:[]}]})(t)}function g(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"},child:[]},{tag:"path",attr:{d:"M12 22V12"},child:[]},{tag:"path",attr:{d:"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"},child:[]},{tag:"path",attr:{d:"m7.5 4.27 9 5.15"},child:[]}]})(t)}function f(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"4",x2:"20",y1:"12",y2:"12"},child:[]},{tag:"line",attr:{x1:"4",x2:"20",y1:"6",y2:"6"},child:[]},{tag:"line",attr:{x1:"4",x2:"20",y1:"18",y2:"18"},child:[]}]})(t)}function m(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{width:"20",height:"16",x:"2",y:"4",rx:"2"},child:[]},{tag:"path",attr:{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"},child:[]}]})(t)}function v(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"m3 17 2 2 4-4"},child:[]},{tag:"path",attr:{d:"m3 7 2 2 4-4"},child:[]},{tag:"path",attr:{d:"M13 6h8"},child:[]},{tag:"path",attr:{d:"M13 12h8"},child:[]},{tag:"path",attr:{d:"M13 18h8"},child:[]}]})(t)}function x(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{width:"7",height:"7",x:"3",y:"3",rx:"1"},child:[]},{tag:"rect",attr:{width:"7",height:"7",x:"14",y:"3",rx:"1"},child:[]},{tag:"rect",attr:{width:"7",height:"7",x:"14",y:"14",rx:"1"},child:[]},{tag:"rect",attr:{width:"7",height:"7",x:"3",y:"14",rx:"1"},child:[]}]})(t)}function y(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"},child:[]},{tag:"path",attr:{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"},child:[]}]})(t)}function k(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"},child:[]},{tag:"path",attr:{d:"M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"},child:[]},{tag:"path",attr:{d:"m18 15-2-2"},child:[]},{tag:"path",attr:{d:"m15 18-2-2"},child:[]}]})(t)}function b(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"},child:[]},{tag:"path",attr:{d:"M22 10v6"},child:[]},{tag:"path",attr:{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5"},child:[]}]})(t)}function _(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2"},child:[]},{tag:"path",attr:{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"},child:[]}]})(t)}function w(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"10"},child:[]}]})(t)}function S(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M21.801 10A10 10 0 1 1 17 3.335"},child:[]},{tag:"path",attr:{d:"m9 11 3 3L22 4"},child:[]}]})(t)}function B(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M20 6 9 17l-5-5"},child:[]}]})(t)}function C(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"},child:[]},{tag:"path",attr:{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"},child:[]},{tag:"path",attr:{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"},child:[]},{tag:"path",attr:{d:"M10 6h4"},child:[]},{tag:"path",attr:{d:"M10 10h4"},child:[]},{tag:"path",attr:{d:"M10 14h4"},child:[]},{tag:"path",attr:{d:"M10 18h4"},child:[]}]})(t)}function E(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"},child:[]},{tag:"path",attr:{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"},child:[]},{tag:"path",attr:{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"},child:[]},{tag:"path",attr:{d:"M17.599 6.5a3 3 0 0 0 .399-1.375"},child:[]},{tag:"path",attr:{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5"},child:[]},{tag:"path",attr:{d:"M3.477 10.896a4 4 0 0 1 .585-.396"},child:[]},{tag:"path",attr:{d:"M19.938 10.5a4 4 0 0 1 .585.396"},child:[]},{tag:"path",attr:{d:"M6 18a4 4 0 0 1-1.967-.516"},child:[]},{tag:"path",attr:{d:"M19.967 17.484A4 4 0 0 1 18 18"},child:[]}]})(t)}function L(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M12 8V4H8"},child:[]},{tag:"rect",attr:{width:"16",height:"12",x:"4",y:"8",rx:"2"},child:[]},{tag:"path",attr:{d:"M2 14h2"},child:[]},{tag:"path",attr:{d:"M20 14h2"},child:[]},{tag:"path",attr:{d:"M15 13v2"},child:[]},{tag:"path",attr:{d:"M9 13v2"},child:[]}]})(t)}function M(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M12 7v14"},child:[]},{tag:"path",attr:{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"},child:[]}]})(t)}function R(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{width:"7",height:"7",x:"14",y:"3",rx:"1"},child:[]},{tag:"path",attr:{d:"M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"},child:[]}]})(t)}function A(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"},child:[]},{tag:"path",attr:{d:"m9 12 2 2 4-4"},child:[]}]})(t)}function U(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"m12 19-7-7 7-7"},child:[]},{tag:"path",attr:{d:"M19 12H5"},child:[]}]})(t)}function z(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M12 5v14"},child:[]},{tag:"path",attr:{d:"m19 12-7 7-7-7"},child:[]}]})(t)}},5066(t,e,i){i.d(e,{A9x:()=>s,AUp:()=>a,HRP:()=>l,tgc:()=>o,tvk:()=>n});var r=i(1148);function o(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"},child:[]},{tag:"path",attr:{d:"M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3v-4h4"},child:[]}]})(t)}function a(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"},child:[]},{tag:"path",attr:{d:"M10 8v3a1 1 0 0 0 1 1h3"},child:[]},{tag:"path",attr:{d:"M14 8v8"},child:[]}]})(t)}function n(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"},child:[]},{tag:"path",attr:{d:"M10 9a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1"},child:[]}]})(t)}function s(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"},child:[]},{tag:"path",attr:{d:"M10 8h3a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h3"},child:[]}]})(t)}function l(t){return(0,r.k5)({tag:"svg",attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"},child:[]},{tag:"path",attr:{d:"M10 10l2 -2v8"},child:[]}]})(t)}},8631(t,e,i){i.d(e,{i:()=>h});var r=i(6540);function o(){return(o=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var r in i)Object.prototype.hasOwnProperty.call(i,r)&&(t[r]=i[r])}return t}).apply(this,arguments)}var a={strings:["These are the default values...","You know what you should do?","Use your own!","Have a great day!"],stringsElement:null,typeSpeed:0,startDelay:0,backSpeed:0,smartBackspace:!0,shuffle:!1,backDelay:700,fadeOut:!1,fadeOutClass:"typed-fade-out",fadeOutDelay:500,loop:!1,loopCount:1/0,showCursor:!0,cursorChar:"|",autoInsertCss:!0,attr:null,bindInputFocusEvents:!1,contentType:"html",onBegin:function(t){},onComplete:function(t){},preStringTyped:function(t,e){},onStringTyped:function(t,e){},onLastStringBackspaced:function(t){},onTypingPaused:function(t,e){},onTypingResumed:function(t,e){},onReset:function(t){},onStop:function(t,e){},onStart:function(t,e){},onDestroy:function(t){}},n=new(function(){function t(){}var e=t.prototype;return e.load=function(t,e,i){if(t.el="string"==typeof i?document.querySelector(i):i,t.options=o({},a,e),t.isInput="input"===t.el.tagName.toLowerCase(),t.attr=t.options.attr,t.bindInputFocusEvents=t.options.bindInputFocusEvents,t.showCursor=!t.isInput&&t.options.showCursor,t.cursorChar=t.options.cursorChar,t.cursorBlinking=!0,t.elContent=t.attr?t.el.getAttribute(t.attr):t.el.textContent,t.contentType=t.options.contentType,t.typeSpeed=t.options.typeSpeed,t.startDelay=t.options.startDelay,t.backSpeed=t.options.backSpeed,t.smartBackspace=t.options.smartBackspace,t.backDelay=t.options.backDelay,t.fadeOut=t.options.fadeOut,t.fadeOutClass=t.options.fadeOutClass,t.fadeOutDelay=t.options.fadeOutDelay,t.isPaused=!1,t.strings=t.options.strings.map(function(t){return t.trim()}),t.stringsElement="string"==typeof t.options.stringsElement?document.querySelector(t.options.stringsElement):t.options.stringsElement,t.stringsElement){t.strings=[],t.stringsElement.style.cssText="clip: rect(0 0 0 0);clip-path:inset(50%);height:1px;overflow:hidden;position:absolute;white-space:nowrap;width:1px;";var r=Array.prototype.slice.apply(t.stringsElement.children),n=r.length;if(n)for(var s=0;s<n;s+=1)t.strings.push(r[s].innerHTML.trim())}for(var l in t.strPos=0,t.currentElContent=this.getCurrentElContent(t),t.currentElContent&&t.currentElContent.length>0&&(t.strPos=t.currentElContent.length-1,t.strings.unshift(t.currentElContent)),t.sequence=[],t.strings)t.sequence[l]=l;t.arrayPos=0,t.stopNum=0,t.loop=t.options.loop,t.loopCount=t.options.loopCount,t.curLoop=0,t.shuffle=t.options.shuffle,t.pause={status:!1,typewrite:!0,curString:"",curStrPos:0},t.typingComplete=!1,t.autoInsertCss=t.options.autoInsertCss,t.autoInsertCss&&(this.appendCursorAnimationCss(t),this.appendFadeOutAnimationCss(t))},e.getCurrentElContent=function(t){return t.attr?t.el.getAttribute(t.attr):t.isInput?t.el.value:"html"===t.contentType?t.el.innerHTML:t.el.textContent},e.appendCursorAnimationCss=function(t){var e="data-typed-js-cursor-css";if(t.showCursor&&!document.querySelector("["+e+"]")){var i=document.createElement("style");i.setAttribute(e,"true"),i.innerHTML="\n        .typed-cursor{\n          opacity: 1;\n        }\n        .typed-cursor.typed-cursor--blink{\n          animation: typedjsBlink 0.7s infinite;\n          -webkit-animation: typedjsBlink 0.7s infinite;\n                  animation: typedjsBlink 0.7s infinite;\n        }\n        @keyframes typedjsBlink{\n          50% { opacity: 0.0; }\n        }\n        @-webkit-keyframes typedjsBlink{\n          0% { opacity: 1; }\n          50% { opacity: 0.0; }\n          100% { opacity: 1; }\n        }\n      ",document.body.appendChild(i)}},e.appendFadeOutAnimationCss=function(t){var e="data-typed-fadeout-js-css";if(t.fadeOut&&!document.querySelector("["+e+"]")){var i=document.createElement("style");i.setAttribute(e,"true"),i.innerHTML="\n        .typed-fade-out{\n          opacity: 0;\n          transition: opacity .25s;\n        }\n        .typed-cursor.typed-cursor--blink.typed-fade-out{\n          -webkit-animation: 0;\n          animation: 0;\n        }\n      ",document.body.appendChild(i)}},t}()),s=new(function(){function t(){}var e=t.prototype;return e.typeHtmlChars=function(t,e,i){if("html"!==i.contentType)return e;var r,o=t.substring(e).charAt(0);if("<"===o||"&"===o){for(r="<"===o?">":";";t.substring(e+1).charAt(0)!==r&&!(1+ ++e>t.length););e++}return e},e.backSpaceHtmlChars=function(t,e,i){if("html"!==i.contentType)return e;var r,o=t.substring(e).charAt(0);if(">"===o||";"===o){for(r=">"===o?"<":"&";t.substring(e-1).charAt(0)!==r&&!(--e<0););e--}return e},t}()),l=function(){function t(t,e){n.load(this,e,t),this.begin()}var e=t.prototype;return e.toggle=function(){this.pause.status?this.start():this.stop()},e.stop=function(){this.typingComplete||this.pause.status||(this.toggleBlinking(!0),this.pause.status=!0,this.options.onStop(this.arrayPos,this))},e.start=function(){this.typingComplete||this.pause.status&&(this.pause.status=!1,this.pause.typewrite?this.typewrite(this.pause.curString,this.pause.curStrPos):this.backspace(this.pause.curString,this.pause.curStrPos),this.options.onStart(this.arrayPos,this))},e.destroy=function(){this.reset(!1),this.options.onDestroy(this)},e.reset=function(t){void 0===t&&(t=!0),clearInterval(this.timeout),this.replaceText(""),this.cursor&&this.cursor.parentNode&&(this.cursor.parentNode.removeChild(this.cursor),this.cursor=null),this.strPos=0,this.arrayPos=0,this.curLoop=0,t&&(this.insertCursor(),this.options.onReset(this),this.begin())},e.begin=function(){var t=this;this.options.onBegin(this),this.typingComplete=!1,this.shuffleStringsIfNeeded(this),this.insertCursor(),this.bindInputFocusEvents&&this.bindFocusEvents(),this.timeout=setTimeout(function(){0===t.strPos?t.typewrite(t.strings[t.sequence[t.arrayPos]],t.strPos):t.backspace(t.strings[t.sequence[t.arrayPos]],t.strPos)},this.startDelay)},e.typewrite=function(t,e){var i=this;this.fadeOut&&this.el.classList.contains(this.fadeOutClass)&&(this.el.classList.remove(this.fadeOutClass),this.cursor&&this.cursor.classList.remove(this.fadeOutClass));var r=this.humanizer(this.typeSpeed),o=1;!0!==this.pause.status?this.timeout=setTimeout(function(){e=s.typeHtmlChars(t,e,i);var r,a=0,n=t.substring(e);if("^"===n.charAt(0)&&/^\^\d+/.test(n)&&(r=1+(n=/\d+/.exec(n)[0]).length,a=parseInt(n),i.temporaryPause=!0,i.options.onTypingPaused(i.arrayPos,i),t=t.substring(0,e)+t.substring(e+r),i.toggleBlinking(!0)),"`"===n.charAt(0)){for(;"`"!==t.substring(e+o).charAt(0)&&(o++,!(e+o>t.length)););var l=t.substring(0,e),h=t.substring(l.length+1,e+o);t=l+h+t.substring(e+o+1),o--}i.timeout=setTimeout(function(){i.toggleBlinking(!1),e>=t.length?i.doneTyping(t,e):i.keepTyping(t,e,o),i.temporaryPause&&(i.temporaryPause=!1,i.options.onTypingResumed(i.arrayPos,i))},a)},r):this.setPauseStatus(t,e,!0)},e.keepTyping=function(t,e,i){0===e&&(this.toggleBlinking(!1),this.options.preStringTyped(this.arrayPos,this));var r=t.substring(0,e+=i);this.replaceText(r),this.typewrite(t,e)},e.doneTyping=function(t,e){var i=this;this.options.onStringTyped(this.arrayPos,this),this.toggleBlinking(!0),this.arrayPos===this.strings.length-1&&(this.complete(),!1===this.loop||this.curLoop===this.loopCount)||(this.timeout=setTimeout(function(){i.backspace(t,e)},this.backDelay))},e.backspace=function(t,e){var i=this;if(!0!==this.pause.status){if(this.fadeOut)return this.initFadeOut();this.toggleBlinking(!1);var r=this.humanizer(this.backSpeed);this.timeout=setTimeout(function(){e=s.backSpaceHtmlChars(t,e,i);var r=t.substring(0,e);if(i.replaceText(r),i.smartBackspace){var o=i.strings[i.arrayPos+1];i.stopNum=o&&r===o.substring(0,e)?e:0}e>i.stopNum?(e--,i.backspace(t,e)):e<=i.stopNum&&(i.arrayPos++,i.arrayPos===i.strings.length?(i.arrayPos=0,i.options.onLastStringBackspaced(),i.shuffleStringsIfNeeded(),i.begin()):i.typewrite(i.strings[i.sequence[i.arrayPos]],e))},r)}else this.setPauseStatus(t,e,!1)},e.complete=function(){this.options.onComplete(this),this.loop?this.curLoop++:this.typingComplete=!0},e.setPauseStatus=function(t,e,i){this.pause.typewrite=i,this.pause.curString=t,this.pause.curStrPos=e},e.toggleBlinking=function(t){this.cursor&&(this.pause.status||this.cursorBlinking!==t&&(this.cursorBlinking=t,t?this.cursor.classList.add("typed-cursor--blink"):this.cursor.classList.remove("typed-cursor--blink")))},e.humanizer=function(t){return Math.round(Math.random()*t/2)+t},e.shuffleStringsIfNeeded=function(){this.shuffle&&(this.sequence=this.sequence.sort(function(){return Math.random()-.5}))},e.initFadeOut=function(){var t=this;return this.el.className+=" "+this.fadeOutClass,this.cursor&&(this.cursor.className+=" "+this.fadeOutClass),setTimeout(function(){t.arrayPos++,t.replaceText(""),t.strings.length>t.arrayPos?t.typewrite(t.strings[t.sequence[t.arrayPos]],0):(t.typewrite(t.strings[0],0),t.arrayPos=0)},this.fadeOutDelay)},e.replaceText=function(t){this.attr?this.el.setAttribute(this.attr,t):this.isInput?this.el.value=t:"html"===this.contentType?this.el.innerHTML=t:this.el.textContent=t},e.bindFocusEvents=function(){var t=this;this.isInput&&(this.el.addEventListener("focus",function(e){t.stop()}),this.el.addEventListener("blur",function(e){t.el.value&&0!==t.el.value.length||t.start()}))},e.insertCursor=function(){this.showCursor&&(this.cursor||(this.cursor=document.createElement("span"),this.cursor.className="typed-cursor",this.cursor.setAttribute("aria-hidden",!0),this.cursor.innerHTML=this.cursorChar,this.el.parentNode&&this.el.parentNode.insertBefore(this.cursor,this.el.nextSibling)))},t}();let h=(0,r.memo)(({style:t,className:e,typedRef:i,parseRef:o,stopped:a,children:n,startWhenVisible:s,...h})=>{let c=(0,r.useRef)(null),u=(0,r.useMemo)(()=>[...Object.values(h).filter(t=>"boolean"==typeof t||"number"==typeof t||"string"==typeof t),h.strings?.join(",")],[h]);(0,r.useEffect)(()=>{let t=o&&o(c)||c.current,e=new l(t,{...h});if((a||s)&&e?.stop(),s){let i=new IntersectionObserver(([t])=>{t.isIntersecting&&(e?.start(),i.disconnect())});i.observe(t)}return i&&e&&i(e),()=>{e.destroy()}},u);let d=n?r.cloneElement(n,{ref:c}):r.createElement("span",{style:t,ref:c});return r.createElement("span",{style:t,className:e,"data-testid":"react-typed"},d)})}}]);