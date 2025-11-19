/* ====================== ЧТО ТЫ МОЖЕШЬ МЕНЯТЬ САМ ====================== */
const COLS = 150;        // Кол-во символов по ширине (100–200)
const ROWS = 70;         // Кол-во строк (50–90)

const CHAR_SETS = [      // 0 = минимум деталей, 5 = максимум
  " .:-=+*#%@",
  " .,:;i1tfLCG08@",
  " .'\"^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  " .:-=+*abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  " .:-=+*abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  " .:-=+*abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?=+-*/\\|()[]{}<>"
];

const COLORS = [         // Добавляй свои цвета сюда!
  {n:"GREEN",  c:"#00ff00", d:"#003300"},
  {n:"RED",    c:"#ff0066", d:"#330011"},
  {n:"BLUE",   c:"#0088ff", d:"#000033"},
  {n:"PURPLE", c:"#ff00ff", d:"#330033"},
  {n:"CYAN",   c:"#00ffff", d:"#003333"},
  {n:"YELLOW", c:"#ffff00", d:"#333300"},
  {n:"WHITE",  c:"#ffffff", d:"#333333"},
  {n:"PINK",   c:"#ff69b4", d:"#330022"},
  {n:"ORANGE", c:"#ff8800", d:"#332200"}
];
/* ========================================================================= */

let video = document.getElementById('video');
let canvas = document.getElementById('cam');
let ctx = canvas.getContext('2d');
let screen = document.getElementById('screen');

let detailLevel = 3, colorIdx = 0, reverse = false;
const FX = {Glitch:false, Noise:false, Trail:false, Scanlines:false};
let trail = null, last = performance.now();

navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}})
  .then(s => { video.srcObject = s; video.play(); })
  .catch(() => alert("Разреши доступ к камере!"));

function setColor(i) {
  colorIdx = (i + COLORS.length) % COLORS.length;
  const col = COLORS[colorIdx];
  document.documentElement.style.setProperty('--main', col.c);
  document.documentElement.style.setProperty('--dark', col.d);
  document.getElementById('col').textContent = col.n;
  screen.style.color = col.c;
}

function changeDetail(d) { 
  detailLevel = Math.max(0, Math.min(5, detailLevel + d)); 
  document.getElementById('det').textContent = detailLevel; 
}
function changeColor(d) { setColor(colorIdx + d); }
function toggleReverse() { 
  reverse = !reverse; 
  document.getElementById('rev').textContent = reverse ? "ON" : "OFF";
  document.getElementById('revBtn').textContent = `ИНВЕРСИЯ ${reverse?"ON":"OFF"}`; 
}
function toggle(name) { 
  FX[name] = !FX[name]; 
  document.querySelector(`button[onclick="toggle('${name}')"]`).classList.toggle('active', FX[name]);
}

function render() {
  if (video.readyState < 2) { requestAnimationFrame(render); return; }
  ctx.save(); ctx.scale(-1,1); ctx.drawImage(video, -640, 0, 640, 480); ctx.restore();
  let d = ctx.getImageData(0,0,640,480).data;

  // Эффекты
  if (FX.Noise) for(let i=0;i<d.length;i+=4){let n=(Math.random()-0.5)*120; d[i]+=n;d[i+1]+=n;d[i+2]+=n;}
  if (FX.Glitch && Math.random()<0.15){
    let y = Math.floor(Math.random()*460), h=25, s=Math.floor(Math.random()*80-40);
    if(s>0) for(let r=y;r<y+h;r++) for(let i=0;i<(640-s)*4;i+=4){ let o=r*640*4; d[o+i]=d[o+i+s*4]; d[o+i+1]=d[o+i+s*4+1]; d[o+i+2]=d[o+i+s*4+2]; }
  }
  if (FX.Trail){
    if(!trail) trail = new Uint8ClampedArray(d);
    for(let i=0;i<d.length;i+=4){
      trail[i] = trail[i]*0.93 + d[i]*0.07; d[i] = trail[i];
      trail[i+1] = trail[i+1]*0.93 + d[i+1]*0.07; d[i+1] = trail[i+1];
      trail[i+2] = trail[i+2]*0.93 + d[i+2]*0.07; d[i+2] = trail[i+2];
    }
  }
  if (FX.Scanlines) for(let y=1;y<480;y+=2) for(let x=0;x<640;x++){ let i=(y*640+x)*4; d[i]*=0.65; d[i+1]*=0.65; d[i+2]*=0.65; }

  // ASCII
  let out = "";
  const chars = CHAR_SETS[detailLevel];
  for (let y=0; y<ROWS; y++) {
    for (let x=0; x<COLS; x++) {
      const i = (Math.floor(y/ROWS*480)*640 + Math.floor(x/COLS*640))*4;
      let br = (d[i] + d[i+1] + d[i+2])/3;
      if (reverse) br = 255 - br;
      out += chars[Math.floor(br/255 * (chars.length-1))];
    }
    out += "\n";
  }
  screen.textContent = out;

  // FPS
  const now = performance.now();
  document.getElementById('fps').textContent = Math.round(1000/(now-last));
  last = now;
  requestAnimationFrame(render);
}

setColor(0);
requestAnimationFrame(render);