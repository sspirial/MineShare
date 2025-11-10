// Content script: collects allowed interaction signals
(function (){
  // Keep original overlay behavior but also collect allowed interaction signals.

  // ensure we don't run multiple times
  if (window.__sample_extension_overlay_setup) return;
  window.__sample_extension_overlay_setup = true;

  // -------------------- Activity collection (allowed signals only) --------------------
  // Helpers that avoid input, textarea, select, and contenteditable elements
  function isProtectedElement(node) {
    if (!node || node.nodeType !== 1) return false;
    const tag = node.tagName.toLowerCase();
    if (['input', 'textarea', 'select', 'option'].includes(tag)) return true;
    if (node.isContentEditable) return true;
    return false;
  }

  // Send an activity event to background (background will hash URL before storage)
  function sendActivity(event, meta) {
    try {
      chrome.runtime.sendMessage({type: 'activity_event', event, meta}, (resp) => {
        // optional callback
      });
    } catch (e) {
      // ignore
    }
  }

  // Click interactions: only record that a click happened and a coarse CSS selector/element tag
  document.addEventListener('click', (ev) => {
    try {
      const target = ev.target;
      if (!target) return;
      // ignore clicks inside protected inputs
      if (isProtectedElement(target)) return;

      // build a coarse descriptor (tag and classes) without any text from inputs
      const desc = {tag: target.tagName, classes: target.className ? String(target.className).split(/\s+/).slice(0,3) : []};
      const evt = {type: 'interaction', interactionType: 'click', descriptor: desc};
      sendActivity(evt, {language: navigator.language, screen: {width: window.screen.width, height: window.screen.height}});
    } catch (e) {}
  }, {capture: true});

  // Scroll depth: periodically track max scroll percentage during the page lifecycle
  let maxScrollPercent = 0;
  function updateScrollDepth() {
    try {
      const doc = document.documentElement || document.body;
      const scrollTop = (window.scrollY || window.pageYOffset || doc.scrollTop || 0);
      const height = Math.max(doc.scrollHeight || 0, document.body.scrollHeight || 0) - window.innerHeight;
      const pct = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
      if (pct > maxScrollPercent) maxScrollPercent = pct;
    } catch (e) {}
  }
  window.addEventListener('scroll', throttle(updateScrollDepth, 200), {passive: true});

  // Dwell time tracking: measure active (visible) time on page
  let visibleStart = document.visibilityState === 'visible' ? Date.now() : null;
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.visibilityState === 'visible') {
      visibleStart = now;
    } else {
      if (visibleStart) {
        const duration = now - visibleStart;
        sendActivity({type: 'dwell', duration_ms: duration});
        visibleStart = null;
      }
    }
  });

  // When the page unloads, send final interactions summary (max scroll, dwell since visibleStart)
  window.addEventListener('beforeunload', () => {
    try {
      updateScrollDepth();
      const now = Date.now();
      if (visibleStart) {
        const duration = now - visibleStart;
        sendActivity({type: 'dwell', duration_ms: duration});
      }
      if (maxScrollPercent > 0) {
        sendActivity({type: 'interaction', interactionType: 'scroll', maxScrollPercent});
      }
    } catch (e) {}
  });

  // Extract top keywords from visible text excluding protected elements
  function extractTopKeywords(limit = 10) {
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          // ignore if inside a protected element
          let cur = node.parentElement;
          while (cur) {
            if (isProtectedElement(cur)) return NodeFilter.FILTER_REJECT;
            cur = cur.parentElement;
          }
          // ignore very short nodes or whitespace
          if (!node.nodeValue || node.nodeValue.trim().length < 5) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textPieces = [];
      let n;
      while (n = walker.nextNode()) {
        textPieces.push(n.nodeValue.trim());
        if (textPieces.length > 200) break; // limit work
      }
      const text = textPieces.join(' ');
      // very simple tokenization + stopword filtering
      const stop = new Set(['the','and','that','this','with','from','your','for','you','are','was','have','but','not','they','their','will','what','about','which']);
      const counts = Object.create(null);
      text.split(/[^\p{L}0-9]+/u).forEach(tok => {
        const w = tok.toLowerCase();
        if (w.length < 4) return;
        if (stop.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
      const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit).map(p=>p[0]);
      return top;
    } catch (e) {
      return [];
    }
  }

  // Periodically sample keywords (non-sensitive, only visible page text)
  setTimeout(() => {
    const kws = extractTopKeywords(10);
    if (kws && kws.length) sendActivity({type: 'keywords', keywords: kws}, {language: navigator.language, screen: {width: window.screen.width, height: window.screen.height}});
  }, 3000);

  // Utility: throttle
  function throttle(fn, wait) {
    let last = 0, t = null;
    return function(...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        if (t) { clearTimeout(t); t = null; }
        last = now;
        fn.apply(this, args);
      } else if (!t) {
        t = setTimeout(() => { last = Date.now(); t = null; fn.apply(this, args); }, remaining);
      }
    };
  }

})();
