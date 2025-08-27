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

/* ===== Lightbox ===== */
(function lightboxInit() {
    const open = (url) => {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;z-index:1055;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:24px;';
        modal.innerHTML = `<img src="${url}" alt="" style="max-width:96%;max-height:90%;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6)">`;
        const close = () => { modal.remove(); document.removeEventListener('keydown', onEsc); };
        const onEsc = (ev) => { if (ev.key === 'Escape') close(); };
        modal.addEventListener('click', close);
        document.addEventListener('keydown', onEsc);
        document.body.appendChild(modal);
    };
    document.querySelectorAll('[data-gallery]').forEach(a => {
        a.addEventListener('click', (e) => { e.preventDefault(); open(a.getAttribute('href')); });
    });
})();

// ===== Ambient (единый трек + контрол справа) =====
document.addEventListener('DOMContentLoaded', async () => {
    const track = document.getElementById('ambTrack');
    const btnPlay = document.getElementById('ambToggle');
    const btnMute = document.getElementById('ambMute');
    const vol = document.getElementById('ambVolume');
    if (!track || !btnPlay || !btnMute || !vol) return;

    // ——— начальные настройки ———
    // стартуем ГАРАНТИРОВАННО mute
    track.muted = true;

    // восстановим громкость
    const savedVol = localStorage.getItem('amb_vol');
    vol.value = savedVol !== null ? savedVol : '0.5';
    track.volume = +vol.value;

    // сохраним, что мы стартуем в mute
    localStorage.setItem('amb_muted', '1');

    // попытка автозапуска (будет играть без звука)
    try { await track.play(); } catch { }  // молча, т.к. muted autoplay разрешён

    updateIcons();

    // Play/Pause
    btnPlay.addEventListener('click', async () => {
        if (track.paused) { try { await track.play(); } catch { } }
        else { track.pause(); }
        updateIcons();
    });

    // Mute/Unmute
    btnMute.addEventListener('click', () => {
        track.muted = !track.muted;
        localStorage.setItem('amb_muted', track.muted ? '1' : '0');
        updateIcons();
    });

    // Volume
    vol.addEventListener('input', () => {
        track.volume = +vol.value;
        localStorage.setItem('amb_vol', vol.value);
    });

    function updateIcons() {
        btnPlay.innerHTML = track.paused
            ? '<i class="bi bi-music-note-beamed"></i>'
            : '<i class="bi bi-pause-fill"></i>';

        btnMute.innerHTML = track.muted
            ? '<i class="bi bi-volume-mute"></i>'
            : '<i class="bi bi-volume-up"></i>';
    }
});


// === Подсказка у амбиента: светлая стрелка и "Окей" ===
function showAmbHint() {
  // если уже отрисована — не дублируем
  if (document.getElementById('ambHint')) return;

  const ctrl  = document.getElementById('ambientControl');
  const track = document.getElementById('ambTrack');
  if (!ctrl || !track) return;

  const hint = document.createElement('div');
  hint.id = 'ambHint';
  hint.innerHTML = `
    <div>Здесь можно включить <b>атмосферу</b> 🌬️</div>
    <button class="btn-ok" type="button">Окей</button>
    <div class="arrow"></div>
  `;
  document.body.appendChild(hint);

  // позиционируем возле блока управления
  function place() {
    const r = ctrl.getBoundingClientRect();
    hint.style.top  = (window.scrollY + r.bottom + 10) + 'px';
    hint.style.left = (window.scrollX + r.right - 220) + 'px';
  }
  place();
  window.addEventListener('resize', place);

  const close = () => hint.remove();
  hint.querySelector('.btn-ok').addEventListener('click', close);

  // закрыть по клику вне
  setTimeout(() => {
    document.addEventListener('click', function onDoc(e){
      if (!hint.contains(e.target) && !ctrl.contains(e.target)) {
        close(); document.removeEventListener('click', onDoc);
      }
    });
  }, 0);

  // если пользователь нажал play/mute — тоже убрать
  document.getElementById('ambToggle')?.addEventListener('click', close, { once:true });
  document.getElementById('ambMute')?.addEventListener('click', close, { once:true });
}

// Показываем КАЖДУЮ загрузку (без localStorage), если трек ещё молчит
window.addEventListener('load', () => {
  const t = document.getElementById('ambTrack');
  if (!t) return;
  // если браузер заблокировал автоплей — трек будет paused или muted
  if (t.muted || t.volume === 0) {
    setTimeout(showAmbHint, 700);
  }
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


// ===== Request Slot modal =====
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openRequestModal');
    const modalEl = document.getElementById('requestModal');
    if (!openBtn || !modalEl || !window.bootstrap) return;

    const bsModal = new bootstrap.Modal(modalEl, { keyboard: true });
    const ta = document.getElementById('slotMsg');
    const copyBtn = document.getElementById('copyMsg');
    const tgBtn = document.getElementById('sendTg');
    const mailBtn = document.getElementById('sendEmail');

    const TG_USERNAME = 'Vex_Sun';                         // <— её @
    const TG_CHAT_URL = `https://t.me/${TG_USERNAME}`;     // открыть личку
    const TG_SHARE = (txt) => `https://t.me/share/url?url=&text=${encodeURIComponent(txt)}`;

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

    function updateLinks() {
        const txt = ta.value || '';
        // общий шэрер — текст предзаполняется
        tgBtn.href = TG_SHARE(txt);
        // mailto
        const subject = 'Коммишн — запрос слота';
        mailBtn.href = `mailto:hello@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(txt)}`;
    }

    openBtn.addEventListener('click', () => {
        ta.value = template();
        updateLinks();
        bsModal.show();
    });

    ta.addEventListener('input', updateLinks);

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(ta.value || '');
            copyBtn.textContent = 'Скопировано!';
            setTimeout(() => (copyBtn.textContent = 'Скопировать'), 1200);
        } catch (e) {
            alert('Не удалось скопировать :(');
        }
    });

    // Доп.клик: "открыть чат @Vex_Sun" с уже скопированным текстом
    tgBtn.insertAdjacentHTML('afterend',
        `<a id="openTgChat" class="btn btn-light-subtle border rounded-4" target="_blank" rel="noopener">
       Открыть чат @${TG_USERNAME}
     </a>`
    );
    document.getElementById('openTgChat').addEventListener('click', async (e) => {
        // копируем текст → открываем чат
        try { await navigator.clipboard.writeText(ta.value || ''); } catch { }
        e.currentTarget.href = TG_CHAT_URL;
    });
});

