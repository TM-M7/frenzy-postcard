(() => {
  'use strict';

  /* ===== Helpers ===== */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // /* ===== Theme (auto + manual) ===== */
  // const THEME_KEY = 'frenzy_theme';
  // function detectAutoTheme() {
  //   const h = new Date().getHours();
  //   return (h >= 6 && h < 18) ? 'day' : 'night';
  // }
  // function applyTheme(mode) {
  //   document.body.classList.remove('theme-day', 'theme-night');
  //   document.body.classList.add('theme-' + (mode === 'day' ? 'day' : 'night'));
  // }
  // function initTheme() {
  //   const saved = localStorage.getItem(THEME_KEY);
  //   applyTheme(saved || detectAutoTheme());

  //   const toggle = $('#themeToggle');
  //   if (toggle) {
  //     toggle.addEventListener('click', () => {
  //       const isDay = document.body.classList.contains('theme-day');
  //       const next = isDay ? 'night' : 'day';
  //       applyTheme(next);
  //       localStorage.setItem(THEME_KEY, next);
  //     });
  //   }
  // }

  function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);

  // дефолт — night
  applyTheme(saved || 'night');

  const toggle = $('#themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const isDay = document.body.classList.contains('theme-day');
      const next = isDay ? 'night' : 'day';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }
}


  /* ===== Bootstrap tooltip (safe) ===== */
  function initTooltips() {
    if (!window.bootstrap || !bootstrap.Tooltip) return;
    $$('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
  }

  /* ===== Smooth scroll ===== */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ===== Footer year ===== */
  function initFooterYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ===== Canvas Leaves (efficient) ===== */
  function initCanvasLeaves() {
    const canvas = $('#bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    // если у человека reduce motion — уважим
    if (prefersReducedMotion) return;

    // optional: на совсем мелких экранах можно не включать (эконом батареи)
    // if (window.innerWidth < 420) return;

    let W = 0, H = 0;
    let DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.floor(window.innerWidth * DPR);
      H = Math.floor(window.innerHeight * DPR);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    const leaves = [];
    let wind = 0.10;
    let mouseX = window.innerWidth / 2;

    function spawnLeaf(px, py, boost = false) {
      leaves.push({
        x: px * DPR,
        y: py * DPR,
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

        ctx.save();
        ctx.translate(L.x, L.y);
        ctx.rotate(L.rot);

        const w = 14 * DPR, h = 8 * DPR;
        const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        grad.addColorStop(0, `hsl(${L.hue},80%,65%)`);
        grad.addColorStop(1, `hsl(${L.hue + 18},70%,45%)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.quadraticCurveTo(0, -h, w / 2, 0);
        ctx.quadraticCurveTo(0, h, -w / 2, 0);
        ctx.fill();
        ctx.restore();

        if (L.x > W + 40 || L.y > H + 40 || L.life > 1200) {
          leaves.splice(i, 1);
        }
      }
    }

    // optional hook: tree click / hover, если позже добавишь #treeArt
    const treeEl = $('#treeArt');
    if (treeEl) {
      treeEl.addEventListener('click', () => {
        const r = treeEl.getBoundingClientRect();
        const bx = r.left + r.width * 0.5;
        const by = r.top + r.height * 0.35;
        for (let i = 0; i < 24; i++) {
          spawnLeaf(bx + Math.random() * 40 - 20, by + Math.random() * 40 - 20, true);
        }
      });

      let shedTimer = 0;
      treeEl.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - shedTimer > 90) {
          shedTimer = now;
          spawnLeaf(e.clientX, e.clientY, false);
        }
      });
    }

    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; });

    let rafId = null;

    function loop() {
      // если вкладка скрыта — пауза (не жрём ресурс)
      if (document.hidden) {
        rafId = null;
        return;
      }

      ctx.clearRect(0, 0, W, H);
      drawLeaves();

      const targetWind = ((mouseX / window.innerWidth) - 0.5) * 0.6;
      wind = 0.98 * wind + 0.02 * targetWind;

      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (rafId) return;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    start();
  }

  /* ===== Gallery Lightbox (singleton) ===== */
  function initLightbox() {
    const grid = $('.gallery-grid');
    if (!grid) return;

    const getItems = () => $$('.tile[data-gallery]', grid);

    let current = -1;
    let root = $('#lb-root');
    let content, btnPrev, btnNext, btnClose;

    function ensureRoot() {
      if (root) return;

      root = document.createElement('div');
      root.id = 'lb-root';
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

      content = $('#lb-content', root);
      btnPrev = $('#lb-prev', root);
      btnNext = $('#lb-next', root);
      btnClose = $('#lb-close', root);

      root.addEventListener('click', (e) => { if (e.target === root) close(); });
      btnClose.addEventListener('click', close);
      btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
      btnNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });

      document.addEventListener('keydown', (e) => {
        if (!root || root.style.display !== 'flex') return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });
    }

    function render(i) {
      const items = getItems();
      if (!items.length) return;

      const a = items[i];
      const src = a.getAttribute('href');
      const isVideo = src && /\.(webm|mp4)$/i.test(src);

      content.innerHTML = '';

      if (isVideo) {
        const v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.autoplay = true;
        v.loop = true;
        v.playsInline = true;
        v.style.cssText = 'max-width:92vw; max-height:86vh; border-radius:12px; box-shadow:0 0 30px rgba(0,0,0,.6);';
        content.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = src;
        img.alt = a.querySelector('img')?.alt || 'Gallery';
        img.style.cssText = 'max-width:92vw; max-height:86vh; border-radius:12px; box-shadow:0 0 30px rgba(0,0,0,.6);';
        content.appendChild(img);
      }
    }

    function open(i) {
      const items = getItems();
      if (!items.length) return;

      ensureRoot();
      current = ((i % items.length) + items.length) % items.length;
      root.style.display = 'flex';
      document.body.classList.add('lb-open');
      render(current);
    }

    function close() {
      if (!root) return;
      root.style.display = 'none';
      document.body.classList.remove('lb-open');
      if (content) content.innerHTML = '';
      current = -1;
    }

    function prev() {
      const items = getItems();
      if (!items.length || current < 0) return;
      current = (current - 1 + items.length) % items.length;
      render(current);
    }

    function next() {
      const items = getItems();
      if (!items.length || current < 0) return;
      current = (current + 1) % items.length;
      render(current);
    }

    // Делегация клика по плиткам (один обработчик вместо кучи)
    grid.addEventListener('click', (e) => {
      const a = e.target.closest('.tile[data-gallery]');
      if (!a) return;
      e.preventDefault();

      const items = getItems();
      open(items.indexOf(a));
    });
  }

  /* ===== "MORE?" overlay on the last tile (optional) ===== */
  function initMoreOverlay() {
    const grid = $('.gallery-grid');
    if (!grid) return;

    const TARGET_HREF = 'https://t.me/AJFplayground'; // <- поменяй, если нужно

    const tiles = $$('.tile', grid);
    if (!tiles.length) return;

    // снимем старые оверлеи (на всякий)
    tiles.forEach(tile => {
      tile.classList.remove('more-overlay');
      tile.querySelectorAll('.more-btn, .more-link').forEach(n => n.remove());
    });

    const last = tiles[tiles.length - 1];

    // Если ты НЕ хочешь "БОЛЬШЕ?" — просто закомментируй следующий блок
    last.classList.add('more-overlay');

    // чтобы лайтбокс НЕ открывался на последней плитке — вырубаем data-gallery
    // (если хочешь, чтобы и на последней был лайтбокс — закомментируй следующую строку)
    last.removeAttribute('data-gallery');

    const btn = document.createElement('div');
    btn.className = 'more-btn';
    btn.innerHTML = `
      <div class="more-bars" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="more-caption">БОЛЬШЕ?</div>
    `;
    last.appendChild(btn);

    const link = document.createElement('a');
    link.href = TARGET_HREF;
    link.className = 'more-link';
    link.setAttribute('aria-label', 'Открыть полную галерею');
    last.appendChild(link);
  }

  /* ===== Ambient player controls (simple & safe) ===== */
  function initAmbient() {
    const audio = $('#ambTrack');
    const btnPlay = $('#ambToggle');
    const btnMute = $('#ambMute');
    const vol = $('#ambVolume');
    if (!audio || !btnPlay || !btnMute || !vol) return;

    function syncIcons() {
      const iconPlay = btnPlay.querySelector('i');
      const iconMute = btnMute.querySelector('i');

      if (iconPlay) {
        iconPlay.className = audio.paused ? 'bi bi-music-note-beamed' : 'bi bi-pause-fill';
      }
      if (iconMute) {
        iconMute.className = audio.muted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up';
      }
    }

    btnPlay.addEventListener('click', async () => {
      try {
        if (audio.paused) await audio.play();
        else audio.pause();
      } catch (e) {
        // autoplay restrictions — норм, просто не ломаем страницу
      }
      syncIcons();
    });

    btnMute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      syncIcons();
    });

    vol.addEventListener('input', () => {
      audio.volume = Math.max(0, Math.min(1, Number(vol.value)));
      if (audio.muted && audio.volume > 0) audio.muted = false;
      syncIcons();
    });

    // init
    audio.volume = Math.max(0, Math.min(1, Number(vol.value)));
    syncIcons();
  }

  /* ===== Init (DOM ready) ===== */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTooltips();
    initSmoothScroll();
    initFooterYear();

    initCanvasLeaves();
    initLightbox();
    initMoreOverlay();
    initAmbient();
  });

})();

/* ===== Request Slot Modal (Bootstrap) ===== */
function initRequestModal() {
  const openBtn = document.getElementById('openRequestModal');
  const modalEl = document.getElementById('requestModal');
  const ta = document.getElementById('slotMsg');
  const mailBtn = document.getElementById('sendEmail');

  if (!openBtn || !modalEl || !ta || !mailBtn) return;

  // bootstrap должен быть загружен
  if (!window.bootstrap || !bootstrap.Modal) return;

  const EMAIL = 'anonimanonimov820@gmail.com';
  const SUBJECT = 'Коммишн — запрос слота';

  const bsModal = new bootstrap.Modal(modalEl, { keyboard: true });

  function template() {
    const d = new Date().toLocaleDateString();
    return [
      'Привет! Хочу забронировать слот на коммишн 😊',
      '',
      'Имя / ник: ',
      'Контакт (TG/почта): ',
      'Идея / персонажи: ',
      'Рефы: (ссылки или прикреплю позже)',
      'Формат: (аватар / полурост / сцена)',
      'Срок / дедлайн: ',
      'Бюджет: ',
      '',
      `Отправлено со страницы Frenzy • ${d}`
    ].join('\n');
  }

  function updateMailLink() {
    const body = ta.value || '';
    mailBtn.href = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
  }

  openBtn.addEventListener('click', () => {
    ta.value = template();
    updateMailLink();
    bsModal.show();
  });

  ta.addEventListener('input', updateMailLink);
  updateMailLink();
}
