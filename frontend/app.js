/**
 * pua - Main application entry
 * User Story 1: View and Vote on Content
 * User Story 3: Graceful Loading and Error Handling
 * Offline: PWA with local content and vote storage
 */

// T031: API_BASE configurable for production — data-api-base on <script>, window.API_BASE, or relative URL when same-origin
const API_BASE = (() => {
  const base = document.currentScript?.dataset?.apiBase
    || window.API_BASE
    || (window.location.port === '3000' ? 'http://localhost:8000' : window.location.port === '3001' ? 'http://localhost:8001' : '');
  return (base || '').replace(/\/$/, '');
})();

const SESSION_COOKIE_NAME = 'pua_session';
const SESSION_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const OFFLINE_DB_NAME = 'pua_offline';
const OFFLINE_STORE = 'votes';

/**
 * Get or create session ID. Uses first-party cookie for persistence across refresh.
 * @returns {string} UUID session ID
 */
function getOrCreateSessionId() {
  const match = document.cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match) return match[1];
  const id = crypto.randomUUID();
  document.cookie = `${SESSION_COOKIE_NAME}=${id}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
  return id;
}

/**
 * Normalize content item to API shape.
 */
function normalizeItem(item) {
  return {
    id: item.id,
    text: item.text,
    content_type: item.content_type || 'neg',
    created_at: item.created_at || '',
  };
}

/**
 * Fetch one random content item from API.
 * @param {number|null} excludeId - Content item ID to exclude (for no-repeat-in-row)
 * @returns {Promise<{id: number, text: string, content_type: string, created_at: string}|null>}
 */
async function fetchContent(excludeId = null) {
  const url = new URL(`${API_BASE}/api/content`);
  if (excludeId != null) url.searchParams.set('exclude_id', excludeId);
  const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Load offline content from bundled content.json (cached by service worker).
 * @returns {Promise<Array<{id: number, text: string}>>}
 */
async function loadOfflineContent() {
  const res = await fetch('/content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Offline content unavailable');
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

/**
 * Pick random item from array, excluding excludeId.
 * @param {Array} items - Content items
 * @param {number|null} excludeId - ID to exclude
 */
function pickRandom(items, excludeId) {
  const filtered = excludeId != null ? items.filter((i) => i.id !== excludeId) : [...items];
  if (filtered.length === 0) return null;
  return normalizeItem(filtered[Math.floor(Math.random() * filtered.length)]);
}

/**
 * Post a vote for a content item.
 * @param {number} contentItemId - ID of the content item
 * @param {'up'|'down'} voteType - Thumbs up or down
 * @returns {Promise<object>} Vote response
 */
async function postVote(contentItemId, voteType) {
  const res = await fetch(`${API_BASE}/api/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({
      content_item_id: contentItemId,
      vote_type: voteType,
      session_id: getOrCreateSessionId(),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Vote failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Store vote locally when offline (IndexedDB).
 */
async function storeVoteOffline(contentItemId, voteType) {
  if (!indexedDB) return Promise.resolve({ offline: true });
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.close();
        return resolve({ offline: true });
      }
      const tx = db.transaction(OFFLINE_STORE, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE);
      store.add({
        content_item_id: contentItemId,
        vote_type: voteType,
        session_id: getOrCreateSessionId(),
        created_at: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve({ offline: true });
      tx.onerror = () => reject(tx.error);
    };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Get deterministic background variant index from content item id.
 * @param {number} id - Content item ID
 * @returns {number} Index into background variants
 */
function getBackgroundVariantIndex(id) {
  const variants = 6; // matches .bg-variant-0..5 in styles.css
  return (id - 1) % variants;
}

/** Theme colors per variant (primary/base) — matches status bar to background on mobile */
const THEME_COLORS = ['#5a67d8', '#ed64a6', '#4299e1', '#48bb78', '#ed8936', '#b2f5ea'];

function setThemeColor(variantIndex) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && THEME_COLORS[variantIndex]) {
    meta.setAttribute('content', THEME_COLORS[variantIndex]);
  }
}

/**
 * Quick confetti burst animation (thumbs up feedback).
 * @param {HTMLCanvasElement} canvas
 * @param {number} durationMs
 */
function runConfetti(canvas, durationMs = 1200) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'];
  const particleCount = 60;
  const particles = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
    });
  }

  const start = performance.now();
  const onResize = () => { resize(); };
  window.addEventListener('resize', onResize);

  function tick(now) {
    const elapsed = now - start;
    if (elapsed > durationMs) {
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Register service worker for PWA — check for updates when app becomes visible
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const contentEl = document.getElementById('content-text');
  const contentBlock = document.getElementById('content-block');
  const thumbsUp = document.getElementById('thumbs-up');
  const thumbsDown = document.getElementById('thumbs-down');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const emptyState = document.getElementById('empty-state');
  const retryFetchBtn = document.getElementById('retry-fetch');
  const voteErrorOverlay = document.getElementById('vote-error-overlay');
  const retryVoteBtn = document.getElementById('retry-vote');
  const voteFeedbackOverlay = document.getElementById('vote-feedback-overlay');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const boohFeedback = document.getElementById('booh-feedback');

  let lastShownId = null;
  let isTransitioning = false;
  let pendingVote = null; // { id, voteType } for retry
  let offlineContent = []; // Cached for offline use

  function showState(which) {
    loadingState?.classList.toggle('hidden', which !== 'loading');
    errorState?.classList.toggle('hidden', which !== 'error');
    emptyState?.classList.toggle('hidden', which !== 'empty');
    contentBlock?.classList.toggle('hidden', which !== 'content');
    voteErrorOverlay?.classList.toggle('hidden', which !== 'vote-error');
    if (which !== 'content') setThemeColor(0); /* loading/error/empty use default variant */
  }

  function setContent(item) {
    if (!item) return;
    lastShownId = item.id;
    contentEl.textContent = item.text;
    contentEl.setAttribute('data-content-id', item.id);
    const variant = getBackgroundVariantIndex(item.id);
    main.classList.remove('bg-variant-0', 'bg-variant-1', 'bg-variant-2', 'bg-variant-3', 'bg-variant-4', 'bg-variant-5');
    main.classList.add(`bg-variant-${variant}`);
    setThemeColor(variant);
    showState('content');
  }

  function showTransition(callback) {
    if (isTransitioning) return;
    isTransitioning = true;
    main.classList.add('transition-out');
    setTimeout(() => {
      callback();
      main.classList.remove('transition-out');
      main.classList.add('transition-in');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => main.classList.remove('transition-in'));
      });
      setTimeout(() => { isTransitioning = false; }, 400);
    }, 300);
  }

  /** Show confetti (thumbs up) or booh (thumbs down) instead of loading. */
  function showVoteFeedback(voteType) {
    if (!voteFeedbackOverlay) return;
    voteFeedbackOverlay.classList.remove('hidden');
    boohFeedback?.classList.add('hidden');
    const ctx = confettiCanvas?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    if (voteType === 'up') {
      runConfetti(confettiCanvas, 1200);
      setTimeout(() => {
        voteFeedbackOverlay?.classList.add('hidden');
      }, 1200);
    } else {
      boohFeedback?.classList.remove('hidden');
      setTimeout(() => {
        voteFeedbackOverlay?.classList.add('hidden');
        boohFeedback?.classList.add('hidden');
      }, 800);
    }
  }

  async function loadNext(prevVoteType = null) {
    if (prevVoteType === 'up' || prevVoteType === 'down') {
      showVoteFeedback(prevVoteType);
    } else {
      showState('loading');
    }
    try {
      if (navigator.onLine && API_BASE) {
        let item = await fetchContent(lastShownId);
        if (item) {
          showTransition(() => setContent(item));
          return;
        }
        item = await fetchContent(null);
        if (item) {
          showTransition(() => setContent(item));
          return;
        }
      }
      // Offline or API empty: use local content
      if (offlineContent.length === 0) {
        offlineContent = await loadOfflineContent();
      }
      const item = pickRandom(offlineContent, lastShownId);
      if (item) {
        showTransition(() => setContent(item));
      } else {
        showState('empty');
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      if (offlineContent.length === 0) {
        try {
          offlineContent = await loadOfflineContent();
          const item = pickRandom(offlineContent, lastShownId);
          if (item) {
            showTransition(() => setContent(item));
            return;
          }
        } catch (_) {}
      }
      showState('error');
    }
  }

  async function handleVote(voteType) {
    const id = lastShownId;
    if (!id || isTransitioning) return;
    pendingVote = { id, voteType };
    try {
      if (navigator.onLine && API_BASE) {
        await postVote(id, voteType);
      } else {
        await storeVoteOffline(id, voteType);
      }
      pendingVote = null;
      loadNext(voteType);
    } catch (err) {
      console.error('Vote failed:', err);
      try {
        await storeVoteOffline(id, voteType);
        pendingVote = null;
        loadNext(voteType);
        return;
      } catch (_) {}
      showState('content');
      voteErrorOverlay?.classList.remove('hidden');
    }
  }

  async function retryVote() {
    if (!pendingVote) return;
    const { id, voteType } = pendingVote;
    voteErrorOverlay?.classList.add('hidden');
    try {
      if (navigator.onLine && API_BASE) {
        await postVote(id, voteType);
      } else {
        await storeVoteOffline(id, voteType);
      }
      pendingVote = null;
      loadNext(voteType);
    } catch (err) {
      console.error('Vote retry failed:', err);
      try {
        await storeVoteOffline(id, voteType);
        pendingVote = null;
        loadNext(voteType);
        return;
      } catch (_) {}
      voteErrorOverlay?.classList.remove('hidden');
    }
  }

  thumbsUp?.addEventListener('click', () => handleVote('up'));
  thumbsDown?.addEventListener('click', () => handleVote('down'));
  retryFetchBtn?.addEventListener('click', () => loadNext());
  retryVoteBtn?.addEventListener('click', () => retryVote());

  // Info overlay: glossary of PUA terms
  const infoBtn = document.getElementById('info-btn');
  const infoOverlay = document.getElementById('info-overlay');
  const infoClose = document.getElementById('info-close');
  function openInfoOverlay() {
    infoOverlay?.classList.remove('hidden');
    infoBtn?.setAttribute('aria-expanded', 'true');
  }
  function closeInfoOverlay() {
    infoOverlay?.classList.add('hidden');
    infoBtn?.setAttribute('aria-expanded', 'false');
  }
  infoBtn?.addEventListener('click', openInfoOverlay);
  infoClose?.addEventListener('click', closeInfoOverlay);
  infoOverlay?.addEventListener('click', (e) => {
    if (e.target === infoOverlay) closeInfoOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && infoOverlay && !infoOverlay.classList.contains('hidden')) {
      closeInfoOverlay();
    }
  });

  // Touch swipe: right = up, left = down
  let touchStartX = 0;
  const SWIPE_THRESHOLD = 60;
  main?.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  main?.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (dx < 0) handleVote('up');   // right-to-left = thumbs up (confetti)
      else handleVote('down');         // left-to-right = thumbs down (booh)
    },
    { passive: true }
  );

  // T028: Keyboard support — ArrowUp/u = thumbs up, ArrowDown/d = thumbs down
  document.addEventListener('keydown', (e) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowUp' || e.key === 'u' || e.key === 'U') {
      e.preventDefault();
      handleVote('up');
    } else if (e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      handleVote('down');
    }
  });

  // Initial load — T023: show loading while fetching
  (async () => {
    showState('loading');
    try {
      if (navigator.onLine && API_BASE) {
        const item = await fetchContent(null);
        if (item) {
          setContent(item);
          return;
        }
      }
      offlineContent = await loadOfflineContent();
      const item = pickRandom(offlineContent, null);
      if (item) setContent(item);
      else showState('empty');
    } catch (err) {
      console.error('Initial fetch failed:', err);
      try {
        offlineContent = await loadOfflineContent();
        const item = pickRandom(offlineContent, null);
        if (item) setContent(item);
        else showState('empty');
        return;
      } catch (_) {}
      showState('error');
    }
  })();
});
