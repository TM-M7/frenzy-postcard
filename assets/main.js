/* ===== Theme (auto + manual) ===== */
const THEME_KEY = 'frenzy_theme';
function detectAutoTheme() { const h = new Date().getHours(); return (h >= 6 && h < 18) ? 'day' : 'night'; }
function applyTheme(mode) {
    document.body.classList.remove('theme-day', 'theme-night');
    document.body.classList.add('theme-' + mode);
}
(function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved || detectAutoTheme());
})();
document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDay = document.body.classList.contains('theme-day');
    const next = isDay ? 'night' : 'day';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
});

/* Bootstrap tooltip */
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));

/* ===== Smooth scroll ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

/* ===== Canvas leaves (enable when you add #treeArt later) ===== */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);
function resize() {
    W = canvas.width = Math.floor(innerWidth * DPR); H = canvas.height = Math.floor(innerHeight * DPR);
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
}
addEventListener('resize', resize); resize();

const leaves = []; let wind = 0.10; let mouseX = innerWidth / 2;
function spawnLeaf(px, py, boost = false) {
    leaves.push({
        x: px * DPR, y: py * DPR,
        vx: (Math.random() * 0.6 + 0.2) * (boost ? 1.8 : 1),
        vy: (Math.random() * 0.6 + 0.3),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() * 0.04 - 0.02),
        hue: 30 + Math.random() * 25,
        life: 0
    });
}
function drawLeaves() {
    for (let i = leaves.length - 1; i >= 0; i--) {
        const L = leaves[i];
        L.x += wind + L.vx;
        L.y += L.vy * 2.0 + Math.sin(L.rot) * 0.8;
        L.rot += L.vr + wind * 0.01;
        L.life++;

        ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(L.rot);
        const w = 14 * DPR, h = 8 * DPR; const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        grad.addColorStop(0, `hsl(${L.hue},80%,65%)`); grad.addColorStop(1, `hsl(${L.hue + 18},70%,45%)`);
        ctx.fillStyle = grad; ctx.beginPath();
        ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, -h, w / 2, 0); ctx.quadraticCurveTo(0, h, -w / 2, 0);
        ctx.fill(); ctx.restore();

        if (L.x > W + 40 || L.y > H + 40 || L.life > 1200) leaves.splice(i, 1);
    }
}

/* Optional: enable when tree image appears */
const treeEl = document.getElementById('treeArt');
if (treeEl) {
    treeEl.addEventListener('click', () => {
        const r = treeEl.getBoundingClientRect();
        const bx = r.left + r.width * 0.5, by = r.top + r.height * 0.35;
        for (let i = 0; i < 24; i++) spawnLeaf(bx + Math.random() * 40 - 20, by + Math.random() * 40 - 20, true);
    });
    let shedTimer = 0;
    treeEl.addEventListener('mousemove', e => {
        const now = performance.now();
        if (now - shedTimer > 90) { shedTimer = now; spawnLeaf(e.clientX, e.clientY, false); }
    });
}

addEventListener('mousemove', e => { mouseX = e.clientX; });
function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLeaves();
    const targetWind = ((mouseX / innerWidth) - 0.5) * 0.6;
    wind = 0.98 * wind + 0.02 * targetWind;
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* Footer year */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


// ===== Request Slot modal (singleton & safe close) =====
document.addEventListener("DOMContentLoaded", () => {
  const items = [...document.querySelectorAll("[data-gallery]")];
  if (!items.length) return;

  let current = -1;
  let root = document.getElementById("lb-root");
  let content;

  function ensureRoot() {
    if (root) return;

    root = document.createElement("div");
    root.id = "lb-root";
    root.style.cssText = `
      position:fixed; inset:0; z-index:2000;
      background:rgba(0,0,0,.92);
      display:none; align-items:center; justify-content:center;
    `;

    root.innerHTML = `
      <div style="position:relative; max-width:92vw; max-height:86vh;">
        <div id="lb-content"></div>

        <button id="lb-prev" aria-label="Previous"
          style="position:absolute;left:-10px;top:50%;transform:translate(-100%,-50%);
                 font-size:2rem;color:#fff;background:none;border:none;cursor:pointer;padding:1rem;">
          ⟨
        </button>
        <button id="lb-next" aria-label="Next"
          style="position:absolute;right:-10px;top:50%;transform:translate(100%,-50%);
                 font-size:2rem;color:#fff;background:none;border:none;cursor:pointer;padding:1rem;">
          ⟩
        </button>
        <button id="lb-close" aria-label="Close"
          style="position:absolute;right:0;top:-10px;transform:translateY(-100%);
                 font-size:2rem;color:#fff;background:none;border:none;cursor:pointer;">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(root);
    content = root.querySelector("#lb-content");

    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    root.querySelector("#lb-close").addEventListener("click", close);
    root.querySelector("#lb-prev").addEventListener("click", (e) => { e.stopPropagation(); prev(); });
    root.querySelector("#lb-next").addEventListener("click", (e) => { e.stopPropagation(); next(); });

    document.addEventListener("keydown", (e) => {
      if (root.style.display !== "flex") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });
  }

  function render(i) {
    const a = items[i];
    const src = a.getAttribute("href");
    const type = a.dataset.type || (src?.match(/\.(webm|mp4)$/i) ? "video" : "image");

    content.innerHTML = "";

    if (type === "video") {
      const v = document.createElement("video");
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      v.style.cssText = "max-width:92vw; max-height:86vh; border-radius:12px; box-shadow:0 0 30px rgba(0,0,0,.6);";
      content.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = a.querySelector("img")?.alt || "Gallery";
      img.style.cssText = "max-width:92vw; max-height:86vh; border-radius:12px; box-shadow:0 0 30px rgba(0,0,0,.6);";
      content.appendChild(img);
    }
  }

  function open(i) {
    ensureRoot();
    current = i;
    root.style.display = "flex";
    document.body.classList.add("lb-open");
    render(current);
  }

  function close() {
    if (!root) return;
    root.style.display = "none";
    document.body.classList.remove("lb-open");
    content.innerHTML = "";
    current = -1;
  }

  function prev() {
    if (current < 0) return;
    current = (current - 1 + items.length) % items.length;
    render(current);
  }

  function next() {
    if (current < 0) return;
    current = (current + 1) % items.length;
    render(current);
  }

  items.forEach((a, i) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      open(i);
    });
  });
});



document.addEventListener('DOMContentLoaded', () => {
    // найдём контейнер галереи и последнюю карточку
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    const items = grid.querySelectorAll('.gallery-item');
    if (!items.length) return;

    const last = items[items.length - 1];
    last.classList.add('more-overlay');

    // цель перехода: страница или якорь с полной галереей
    const targetHref = 'gallery.html'; // <-- поменяй на свой маршрут/якорь

    // создаём оверлей: 3 полоски + подпись
    const link = document.createElement('a');
    link.href = targetHref;
    link.className = 'more-link';
    link.setAttribute('aria-label', 'Открыть полную галерею');

    const btn = document.createElement('div');
    btn.className = 'more-btn';
    btn.innerHTML = `
    <div class="more-bars" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <div class="more-caption">БОЛЬШЕ?</div>
  `;

    last.appendChild(btn);
    last.appendChild(link);

    // не даём «клику по картинке» открыть лайтбокс на последней — только наш оверлей
    const imgLink = last.querySelector('a, [data-gallery], img');
    if (imgLink && imgLink !== link) {
        imgLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = targetHref;
        }, { capture: true });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    const TARGET_HREF = 'gallery.html'; // куда ведёт «БОЛЬШЕ?»

    // вытаскиваем число из имени файла: work-07.jpg -> 7, img-010.png -> 10
    const getNum = el => {
        const href = el.getAttribute('href') || '';
        const src = el.querySelector('img')?.getAttribute('src') || '';
        const str = href || src;
        const m = str.match(/(\d+)(?=\.[a-z]{3,4}$)/i) || str.match(/(?:work|img)[^\d]*(\d+)/i);
        return m ? parseInt(m[1], 10) : -Infinity;
    };

    const ensureMoreOverlay = (tile) => {
        // снять прошлые артефакты
        tile.classList.add('more-overlay');
        tile.removeAttribute('data-gallery');

        if (!tile.querySelector('.more-btn')) {
            const btn = document.createElement('div');
            btn.className = 'more-btn';
            btn.innerHTML = `
        <div class="more-bars"><span></span><span></span><span></span></div>
        <div class="more-caption">БОЛЬШЕ?</div>
      `;
            tile.appendChild(btn);

            const link = document.createElement('a');
            link.href = TARGET_HREF;
            link.className = 'more-link';
            tile.appendChild(link);
        }
    };

    const removeMoreOverlay = (tile) => {
        tile.classList.remove('more-overlay');
        if (!tile.hasAttribute('data-gallery')) tile.setAttribute('data-gallery', '');
        tile.querySelectorAll('.more-btn, .more-link').forEach(n => n.remove());
        // убрать фильтры, если остались
        const img = tile.querySelector('img');
        if (img) img.style.filter = '';
    };

    const resortAndOverlay = () => {
        const tiles = Array.from(grid.querySelectorAll('.tile'));
        if (!tiles.length) return;

        // сортировка по убыванию чисел в именах
        tiles.sort((a, b) => getNum(b) - getNum(a));

        // сбросим оверлей у всех
        tiles.forEach(removeMoreOverlay);

        // перерисовать порядок
        grid.append(...tiles);

        // навесить «БОЛЬШЕ?» на последнюю
        ensureMoreOverlay(tiles[tiles.length - 1]);
    };

    // первичная раскладка
    resortAndOverlay();

    // если ты динамически добавишь новую плитку — пересоберём
    const mo = new MutationObserver(() => resortAndOverlay());
    mo.observe(grid, { childList: true });

});
// --- LIGHTBOX: singleton, no duplicates, no double-init ---
(() => {
  if (window.__LB_INIT__) return;               // защита от повторной инициализации
  window.__LB_INIT__ = true;

  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const links = () => [...grid.querySelectorAll('.tile[data-gallery]')];

  let current = -1;
  let root = document.getElementById('lb-root');  // уже есть? — переиспользуем
  if (!root) {
    root = document.createElement('div');
    root.id = 'lb-root';
    root.style.cssText = `
      position:fixed; inset:0; z-index:2000; display:none;
      background:rgba(0,0,0,.92); align-items:center; justify-content:center;
    `;
    root.innerHTML = `
      <img id="lb-img" style="max-width:90%;max-height:85%;border-radius:12px;box-shadow:0 0 30px rgba(0,0,0,.6)">
      <button id="lb-prev" aria-label="prev" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:32px;color:#fff;background:none;border:none;cursor:pointer;">⟨</button>
      <button id="lb-next" aria-label="next" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:32px;color:#fff;background:none;border:none;cursor:pointer;">⟩</button>
      <button id="lb-close" aria-label="close" style="position:absolute;right:18px;top:12px;font-size:28px;color:#fff;background:none;border:none;cursor:pointer;">✕</button>
    `;
    document.body.appendChild(root);
  }

  const img   = root.querySelector('#lb-img');
  const btnL  = root.querySelector('#lb-prev');
  const btnR  = root.querySelector('#lb-next');
  const btnX  = root.querySelector('#lb-close');

  function openAt(i){
    const arr = links();
    if (!arr.length) return;
    current = (i + arr.length) % arr.length;
    img.src = arr[current].getAttribute('href');
    root.style.display = 'flex';
    document.body.classList.add('lb-open');
  }
  function close(){
    root.style.display = 'none';
    document.body.classList.remove('lb-open');
    img.src = '';
    current = -1;
  }
  function prev(){ if (current>=0) openAt(current-1); }
  function next(){ if (current>=0) openAt(current+1); }

  // клики: фон закрывает, внутренние элементы не всплывают
  root.addEventListener('click', (e)=>{ if (e.target === root) close(); });
  [img, btnL, btnR, btnX].forEach(el => el.addEventListener('click', e => e.stopPropagation()));
  btnL.addEventListener('click', prev);
  btnR.addEventListener('click', next);
  btnX.addEventListener('click', close);

  // клавиатура
  document.addEventListener('keydown', (e)=>{
    if (root.style.display === 'flex'){
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
  });

  // делегируем клик по превью (и гасим чужие обработчики)
  grid.addEventListener('click', (e)=>{
    const a = e.target.closest('.tile[data-gallery]');
    if (!a) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // <-- не даём другим «лайтбоксам» тоже открыться
    const arr = links();
    openAt(arr.indexOf(a));
  }, true); // capture: true — перехват раньше сторонних скриптов

  // если у тебя есть MutationObserver, он не должен снова инициализировать лайтбокс —
  // наш код защищён флагом __LB_INIT__

})();

document.addEventListener('DOMContentLoaded', () => {
  const ac = document.getElementById('ambientControl');
  if (!ac) return;

  function clampPlayer(){
    const r = ac.getBoundingClientRect();
    if (r.height > 90) {
      // кого-то занесло — жёстко зажимаем
      ac.style.height = '64px';
      ac.style.maxHeight = '64px';
      // убираем абсолютные фоны внутри
      [...ac.children].forEach(ch => {
        const cs = getComputedStyle(ch);
        if (cs.position === 'absolute' || cs.height === '100%' || cs.inset !== 'auto') {
          ch.style.position = 'static';
          ch.style.inset = 'auto';
          ch.style.height = 'auto';
          ch.style.maxHeight = '48px';
        }
      });
    }
  }
  clampPlayer();
  window.addEventListener('resize', clampPlayer);
  // если у тебя ещё есть мутации DOM — реагируем
  new MutationObserver(clampPlayer).observe(ac, { attributes:true, childList:true, subtree:true });
});
