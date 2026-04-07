/* ================================================
   GAMENIC VIRTUAL STUDIO - Main JavaScript
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR ----
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const navCta = document.querySelector('.nav-cta');
  let mobileOpen = false;

  function getNavbarOffset() {
    if (!navbar) return 0;
    const navHeight = navbar.getBoundingClientRect().height || navbar.offsetHeight || 0;
    return Math.max(0, navHeight);
  }

  function smoothScrollToTarget(target) {
    if (!target) return;
    const navOffset = getNavbarOffset();
    const targetY = target.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  // Scroll handler
  const sections = Array.from(navLinks)
    .map(link => (link.getAttribute('href') || '').trim())
    .filter(href => href.startsWith('#') && href.length > 1)
    .map(href => href.replace(/^#/, ''))
    .filter(sectionId => sectionId !== 'home' && sectionId !== 'hero')
    .filter((sectionId, index, list) => list.indexOf(sectionId) === index);

  // Keep Contact CTA glow behavior even when Contact isn't in admin menu.
  if (document.getElementById('contact') && !sections.includes('contact')) {
    sections.push('contact');
  }
  
  function updateNav() {
    const scrollY = window.scrollY;
    
    // Navbar background
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active section detection
    let activeSection = '';
    const orderedSectionElements = sections
      .map(sectionId => document.getElementById(sectionId))
      .filter(Boolean)
      .sort((a, b) => a.offsetTop - b.offsetTop);
    for (let i = orderedSectionElements.length - 1; i >= 0; i--) {
      const el = orderedSectionElements[i];
      if (scrollY >= el.offsetTop - 200) {
        activeSection = el.id;
        break;
      }
    }

    // Update nav links
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const section = (href && href.startsWith('#')) ? href.replace('#', '') : '';
      const isHomeLink = href === '#' || href === '#home' || href === '#hero';
      if (section === activeSection || (isHomeLink && !activeSection)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // CTA glow when contact is active
    if (navCta) {
      if (activeSection === 'contact') {
        navCta.classList.add('contact-active');
      } else {
        navCta.classList.remove('contact-active');
      }
    }

    // Scroll to top button
    const scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
      if (scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileOpen = !mobileOpen;
      mobileMenu.classList.toggle('open', mobileOpen);
      mobileToggle.innerHTML = mobileOpen
        ? '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      mobileOpen = false;
      mobileMenu.classList.remove('open');
      mobileToggle.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const selector = a.getAttribute('href');
      if (!selector || selector === '#') return;

      let target = null;
      try {
        target = document.querySelector(selector);
      } catch (err) {
        target = null;
      }

      if (target) {
        e.preventDefault();
        const normalizedSelector = selector.trim().toLowerCase();
        if (normalizedSelector === '#career' || target.id === 'career') {
          smoothScrollToTarget(target);
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Scroll indicator action (hero -> about)
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const aboutSection = document.getElementById('about');
  if (scrollIndicator && aboutSection) {
    const scrollToAbout = () => {
      smoothScrollToTarget(aboutSection);
    };

    scrollIndicator.addEventListener('click', scrollToAbout);
    scrollIndicator.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        scrollToAbout();
      }
    });
  }

  // ---- HERO SLIDER ----
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator');
  let currentSlide = 0;
  const SLIDE_DURATION = 5000;
  let slideTimer;

  function goToSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === index);
      // Reset fill animation
      const fill = ind.querySelector('.hero-indicator-fill');
      if (fill) {
        fill.style.animation = 'none';
        fill.offsetHeight; // trigger reflow
        fill.style.animation = '';
      }
    });
    currentSlide = index;
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }

  function startSlider() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, SLIDE_DURATION);
  }

  if (slides.length > 0) {
    goToSlide(0);
    startSlider();
  }

  indicators.forEach((ind, i) => {
    ind.addEventListener('click', () => {
      goToSlide(i);
      startSlider();
    });
  });

  // ---- SCROLL REVEAL ----
  const revealElements = document.querySelectorAll('.reveal');
  
  function checkReveal() {
    const windowHeight = window.innerHeight;
    revealElements.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < windowHeight - 80) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', checkReveal, { passive: true });
  checkReveal();

  // ---- SCROLL TO TOP ----
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- CONTACT FORM ----
  const form = document.getElementById('contact-form');
  if (form && form.dataset.gamenicContactBound !== '1') {
    form.dataset.gamenicContactBound = '1';
    const fields = ['name', 'email', 'subject', 'message'];
    const touched = {};
    const successMsg = document.querySelector('.form-success');
    const submitBtn = form.querySelector('.form-submit');

    function validate() {
      const errors = {};
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const subject = form.querySelector('[name="subject"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();

      if (!name) errors.name = 'Name is required';
      else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
      if (!email) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
      if (!subject) errors.subject = 'Subject is required';
      else if (subject.length < 3) errors.subject = 'Subject must be at least 3 characters';
      if (!message) errors.message = 'Message is required';
      else if (message.length < 10) errors.message = 'Message must be at least 10 characters';

      return errors;
    }

    function showErrors(errors) {
      fields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        const errorEl = form.querySelector(`.error-${field}`);
        if (touched[field] && errors[field]) {
          input.classList.add('error');
          if (errorEl) { errorEl.textContent = errors[field]; errorEl.classList.add('show'); }
        } else {
          input.classList.remove('error');
          if (errorEl) { errorEl.classList.remove('show'); }
        }
      });
    }

    fields.forEach(field => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.addEventListener('blur', () => {
          touched[field] = true;
          showErrors(validate());
        });
        input.addEventListener('input', () => {
          if (touched[field]) showErrors(validate());
        });
      }
    });

    function getApiRootAjaxUrl() {
      const apiLink = document.querySelector('link[rel="https://api.w.org/"]');
      const href = apiLink ? apiLink.getAttribute('href') : '';
      if (!href) return '';

      try {
        const apiUrl = new URL(href, window.location.href);
        const root = apiUrl.pathname.replace(/\/wp-json\/?$/, '/');
        apiUrl.pathname = root.replace(/\/+$/, '') + '/wp-admin/admin-ajax.php';
        apiUrl.search = '';
        apiUrl.hash = '';
        return apiUrl.toString();
      } catch (error) {
        return '';
      }
    }

    function getAjaxEndpointCandidates(formEl) {
      const candidates = [];
      const pushCandidate = (url) => {
        if (!url || typeof url !== 'string') return;
        const trimmed = url.trim();
        if (!trimmed) return;
        if (!candidates.includes(trimmed)) candidates.push(trimmed);
      };

      pushCandidate(formEl.getAttribute('action'));
      pushCandidate(formEl.action);

      if (window.gamenicConfig) {
        pushCandidate(window.gamenicConfig.ajaxUrl);
        if (Array.isArray(window.gamenicConfig.ajaxUrls)) {
          window.gamenicConfig.ajaxUrls.forEach(pushCandidate);
        }
      }

      pushCandidate(getApiRootAjaxUrl());
      pushCandidate(window.location.origin + '/wp-admin/admin-ajax.php');

      return candidates;
    }

    async function postFormWithFallback(formEl, defaultMessage) {
      const endpoints = getAjaxEndpointCandidates(formEl);
      const formData = new FormData(formEl);
      let lastError = null;

      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        let response;
        let payload = {};

        try {
          response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
          });
        } catch (networkError) {
          lastError = new Error(defaultMessage);
          continue;
        }

        const raw = await response.text();
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch (e) {
          payload = {};
        }

        if (response.status === 404 && i < endpoints.length - 1) {
          lastError = new Error('Form endpoint not found (HTTP 404).');
          continue;
        }

        if (!response.ok || !payload.success) {
          const message = payload && payload.data && payload.data.message
            ? payload.data.message
            : (response.status ? `${defaultMessage} (HTTP ${response.status}).` : defaultMessage);
          throw new Error(message);
        }

        return payload;
      }

      throw lastError || new Error(defaultMessage);
    }

    async function submitContactForm() {
      return postFormWithFallback(form, 'Message could not be sent right now. Please try again later.');
    }

    function showFormStatus(message, isError) {
      if (!successMsg) return;
      const msgText = successMsg.querySelector('span');
      if (msgText) msgText.textContent = message;
      successMsg.classList.toggle('error', !!isError);
      successMsg.classList.add('show');
      setTimeout(() => successMsg.classList.remove('show'), 5000);
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.dataset.gamenicSubmitting === '1') return;
      form.dataset.gamenicSubmitting = '1';

      fields.forEach(f => touched[f] = true);
      const errors = validate();
      showErrors(errors);
      if (Object.keys(errors).length > 0) {
        form.dataset.gamenicSubmitting = '0';
        return;
      }

      const originalBtnLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';
      }

      try {
        await submitContactForm();
        form.reset();
        fields.forEach(f => touched[f] = false);
        showErrors({});
        showFormStatus("Message sent successfully! We'll get back to you soon.", false);
      } catch (err) {
        showFormStatus(err.message || 'Something went wrong while sending your message.', true);
      } finally {
        form.dataset.gamenicSubmitting = '0';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnLabel;
        }
      }
    });
  }

  // ---- VIDEO / 3D MODAL ----
  const modal = document.getElementById('video-modal');
  const modalFrameWrap = modal ? modal.querySelector('.video-frame') : null;
  const modalTitle = document.getElementById('modal-title');
  const modalCat = document.getElementById('modal-cat');
  const modalPolys = document.getElementById('modal-polys');
  const modalTool = document.getElementById('modal-tool');
  const modalToolBadge = document.getElementById('modal-tool-badge');
  const modalDesc = document.getElementById('modal-desc');
  const MODEL_VIEWER_SCRIPT_URL = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
  let modalMediaEl = null;
  let modalShortcodeCleanupObserver = null;
  const modalShortcodeCleanupTimers = [];
  let modelViewerLoadPromise = null;
  const warmedModelUrls = new Set();

  function normalizeVideoInput(videoInput) {
    const raw = (videoInput || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\/\//.test(raw)) return 'https:' + raw;
    return `https://www.youtube.com/watch?v=${encodeURIComponent(raw)}`;
  }

  function tryParseUrl(url) {
    try {
      return new URL(url);
    } catch (e) {
      return null;
    }
  }

  function isDirectVideoUrl(videoInput) {
    const normalized = normalizeVideoInput(videoInput);
    const parsed = tryParseUrl(normalized);
    const path = parsed ? parsed.pathname : normalized;
    return /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(path);
  }

  function is3DModelAssetUrl(mediaInput) {
    const normalized = normalizeVideoInput(mediaInput);
    const parsed = tryParseUrl(normalized);
    const path = parsed ? parsed.pathname : normalized;
    return /\.(glb|gltf|usdz)(?:$|[?#])/i.test(path);
  }

  function isSameOriginUrl(inputUrl) {
    const parsed = tryParseUrl(inputUrl);
    if (!parsed) return false;
    return parsed.origin === window.location.origin;
  }

  function buildModelProxyUrl(modelUrl) {
    const normalized = normalizeVideoInput(modelUrl);
    if (!normalized || !is3DModelAssetUrl(normalized)) return normalized;
    if (isSameOriginUrl(normalized)) return normalized;

    const proxyBase = (
      window.gamenicConfig
      && typeof window.gamenicConfig.modelProxyUrl === 'string'
      && window.gamenicConfig.modelProxyUrl.trim() !== ''
    ) ? window.gamenicConfig.modelProxyUrl : '';

    if (!proxyBase) return normalized;

    const proxyUrl = new URL(proxyBase, window.location.href);
    proxyUrl.searchParams.set('gamenic_model_url', normalized);
    return proxyUrl.toString();
  }

  function ensureModelViewerScript() {
    if (window.customElements && window.customElements.get('model-viewer')) {
      return Promise.resolve();
    }

    if (modelViewerLoadPromise) {
      return modelViewerLoadPromise;
    }

    const existingScript = document.getElementById('gamenic-model-viewer-loader');
    if (existingScript) {
      modelViewerLoadPromise = new Promise(resolve => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => {
          modelViewerLoadPromise = null;
          resolve();
        }, { once: true });
      });
      return modelViewerLoadPromise;
    }

    if (!document.querySelector('link[data-gamenic-model-viewer-preconnect="1"]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://unpkg.com';
      preconnect.crossOrigin = 'anonymous';
      preconnect.setAttribute('data-gamenic-model-viewer-preconnect', '1');
      document.head.appendChild(preconnect);
    }

    if (!document.querySelector('link[data-gamenic-model-viewer-modulepreload="1"]')) {
      const preload = document.createElement('link');
      preload.rel = 'modulepreload';
      preload.href = MODEL_VIEWER_SCRIPT_URL;
      preload.crossOrigin = 'anonymous';
      preload.setAttribute('data-gamenic-model-viewer-modulepreload', '1');
      document.head.appendChild(preload);
    }

    const script = document.createElement('script');
    script.id = 'gamenic-model-viewer-loader';
    script.type = 'module';
    script.src = MODEL_VIEWER_SCRIPT_URL;
    modelViewerLoadPromise = new Promise(resolve => {
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => {
        modelViewerLoadPromise = null;
        resolve();
      }, { once: true });
    });
    document.head.appendChild(script);
    return modelViewerLoadPromise;
  }

  function prefetchModelAsset(modelUrl) {
    const proxiedUrl = buildModelProxyUrl(modelUrl);
    if (!proxiedUrl || warmedModelUrls.has(proxiedUrl)) return;
    warmedModelUrls.add(proxiedUrl);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'fetch';
    link.href = proxiedUrl;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  function warm3DModalFromButton(buttonEl) {
    if (!buttonEl) return;
    const mediaType = (buttonEl.getAttribute('data-media-type') || '').trim();
    if (mediaType !== 'model' && mediaType !== 'model_shortcode') return;

    ensureModelViewerScript();

    if (mediaType === 'model') {
      const mediaUrl = (buttonEl.getAttribute('data-media-url') || '').trim();
      if (mediaUrl) {
        prefetchModelAsset(mediaUrl);
      }
      return;
    }

    const embedHtmlB64 = (buttonEl.getAttribute('data-embed-b64') || '').trim();
    if (!embedHtmlB64) return;
    const embedHtml = decodeBase64Utf8(embedHtmlB64);
    const extracted = extract3DViewerConfigFromShortcodeHtml(embedHtml);
    if (extracted && extracted.modelUrl) {
      prefetchModelAsset(extracted.modelUrl);
    }
  }

  function initialize3DModalWarmup() {
    const modelButtons = document.querySelectorAll('.model-play[data-media-type]');
    if (!modelButtons.length) return;

    let found3DTrigger = false;
    let prefetchedCount = 0;
    modelButtons.forEach(buttonEl => {
      const mediaType = (buttonEl.getAttribute('data-media-type') || '').trim();
      if (mediaType !== 'model' && mediaType !== 'model_shortcode') return;

      found3DTrigger = true;

      const warmOnIntent = () => warm3DModalFromButton(buttonEl);
      buttonEl.addEventListener('pointerenter', warmOnIntent, { once: true, passive: true });
      buttonEl.addEventListener('focus', warmOnIntent, { once: true });

      if (prefetchedCount < 2) {
        warm3DModalFromButton(buttonEl);
        prefetchedCount += 1;
      }
    });

    if (found3DTrigger) {
      ensureModelViewerScript();
    }
  }

  function buildEmbedUrl(videoInput) {
    const normalized = normalizeVideoInput(videoInput);
    const parsed = tryParseUrl(normalized);
    if (!parsed) return normalized;

    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&mute=1&playsinline=1`;
    }

    if (host.endsWith('youtube.com')) {
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/i);
      const id = embedMatch ? embedMatch[1] : parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&mute=1&playsinline=1`;
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)(?:$|\/)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1`;
    }

    if (!parsed.searchParams.has('autoplay')) {
      parsed.searchParams.set('autoplay', '1');
    }
    if (!parsed.searchParams.has('muted') && !parsed.searchParams.has('mute')) {
      parsed.searchParams.set('muted', '1');
    }

    return parsed.toString();
  }

  function attemptModalVideoAutoplay(mediaEl) {
    if (!mediaEl || mediaEl.tagName !== 'VIDEO') return;

    const playVideo = () => {
      const playPromise = mediaEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          mediaEl.muted = true;
          mediaEl.setAttribute('muted', '');
          const mutedPlayPromise = mediaEl.play();
          if (mutedPlayPromise && typeof mutedPlayPromise.catch === 'function') {
            mutedPlayPromise.catch(() => {});
          }
        });
      }
    };

    if (mediaEl.readyState >= 2) {
      playVideo();
      return;
    }

    mediaEl.addEventListener('loadeddata', playVideo, { once: true });
  }

  function clearModalShortcodeCleanupWatch() {
    if (modalShortcodeCleanupObserver) {
      modalShortcodeCleanupObserver.disconnect();
      modalShortcodeCleanupObserver = null;
    }

    while (modalShortcodeCleanupTimers.length) {
      const timeoutId = modalShortcodeCleanupTimers.pop();
      window.clearTimeout(timeoutId);
    }
  }

  function cleanupModalViewerAuxiliaryContent(rootEl) {
    if (!rootEl) return;

    const removableSelector = [
      '.summary.entry-summary .price',
      '.summary.entry-summary .product_meta',
      '.summary.entry-summary .posted_in',
      '.summary.entry-summary .tagged_as',
      '.summary.entry-summary .sku_wrapper',
      '.summary.entry-summary .wc-block-components-product-price',
      '.summary.entry-summary .wp-block-woocommerce-product-price'
    ].join(',');

    rootEl.querySelectorAll(removableSelector).forEach(node => node.remove());

    const textBlockSelector = '.summary.entry-summary p, .summary.entry-summary div, .summary.entry-summary span, .summary.entry-summary li';
    const categoryLinePattern = /^(?:Category|Categories)\s*:/i;
    const priceLinePattern = /^(?:[A-Z]{2,3}\s*)?[$€£₹]\s*\d[\d,]*(?:\.\d+)?(?:\s*[-–]\s*(?:[A-Z]{2,3}\s*)?[$€£₹]?\s*\d[\d,]*(?:\.\d+)?)?$/;
    rootEl.querySelectorAll(textBlockSelector).forEach(node => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (categoryLinePattern.test(text) || priceLinePattern.test(text)) {
        node.remove();
      }
    });
  }

  function watchModalShortcodeCleanup(rootEl) {
    clearModalShortcodeCleanupWatch();
    if (!rootEl) return;

    const applyCleanup = () => cleanupModalViewerAuxiliaryContent(rootEl);
    applyCleanup();

    if (typeof MutationObserver === 'function') {
      modalShortcodeCleanupObserver = new MutationObserver(() => {
        applyCleanup();
      });
      modalShortcodeCleanupObserver.observe(rootEl, { childList: true, subtree: true });
    }

    [120, 360, 900].forEach(delay => {
      modalShortcodeCleanupTimers.push(window.setTimeout(applyCleanup, delay));
    });
  }

  function clearModalMedia() {
    clearModalShortcodeCleanupWatch();
    if (!modalFrameWrap || !modalMediaEl) return;

    if (modalMediaEl.tagName === 'IFRAME') {
      modalMediaEl.src = '';
    }

    if (modalMediaEl.tagName === 'VIDEO') {
      modalMediaEl.pause();
      modalMediaEl.removeAttribute('src');
      modalMediaEl.load();
    }

    if (modalMediaEl.tagName === 'MODEL-VIEWER') {
      modalMediaEl.removeAttribute('src');
    }

    modalFrameWrap.innerHTML = '';
    modalMediaEl = null;
  }

  function decodeBase64Utf8(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(value), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      try {
        return atob(value);
      } catch (e2) {
        return '';
      }
    }
  }

  function decodeHtmlEntities(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = (value || '').toString();
    return textarea.value;
  }

  function extract3DViewerConfigFromShortcodeHtml(embedHtml) {
    const rawHtml = (embedHtml || '').toString().trim();
    if (!rawHtml) return null;

    const holder = document.createElement('div');
    holder.innerHTML = rawHtml;

    const modelBlock = holder.querySelector('.modelViewerBlock');
    if (!modelBlock) return null;

    const attributesRaw = modelBlock.getAttribute('data-attributes');
    if (!attributesRaw) return null;

    const decoded = decodeHtmlEntities(attributesRaw);
    let attributes = null;
    try {
      attributes = JSON.parse(decoded);
    } catch (e) {
      return null;
    }

    const modelUrl = (
      (attributes && attributes.model && attributes.model.modelUrl) ||
      (Array.isArray(attributes && attributes.models) && attributes.models[0] ? attributes.models[0].modelUrl : '') ||
      ''
    ).toString().trim();

    if (!modelUrl) return null;

    return {
      modelUrl: modelUrl.replace(/^http:/i, window.location.protocol),
      poster: (((attributes && attributes.model && attributes.model.poster) || '') + '').trim(),
      autoRotate: !!(attributes && attributes.autoRotate),
      exposure: (((attributes && attributes.exposure) || '1') + '').trim(),
      height: (((attributes && attributes.styles && attributes.styles.height) || '') + '').trim(),
      canControlCamera: !attributes || !attributes.O3DVSettings || attributes.O3DVSettings.mouseControl !== false,
    };
  }

  initialize3DModalWarmup();

  function renderModalMedia(mediaInput, mediaType, customEmbedHtml) {
    if (!modalFrameWrap) return null;

    function attachModelLoadingState(viewerEl) {
      if (!viewerEl || !modalFrameWrap) return;
      modalFrameWrap.style.position = 'relative';

      const loadingNote = document.createElement('div');
      loadingNote.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.65);font-family:var(--font-sans);font-size:13px;letter-spacing:.05em;text-transform:uppercase;pointer-events:none;z-index:2;';
      loadingNote.textContent = 'Loading 3D model...';
      modalFrameWrap.appendChild(loadingNote);

      const clearLoading = () => {
        if (loadingNote.parentNode) loadingNote.parentNode.removeChild(loadingNote);
      };

      viewerEl.addEventListener('load', clearLoading, { once: true });
      viewerEl.addEventListener('model-visibility', clearLoading, { once: true });
      viewerEl.addEventListener('progress', event => {
        const totalProgress = event && event.detail && typeof event.detail.totalProgress === 'number'
          ? event.detail.totalProgress
          : 0;
        if (totalProgress >= 1) {
          clearLoading();
        }
      });
      viewerEl.addEventListener('error', () => {
        loadingNote.textContent = 'Unable to load 3D model. Check model URL.';
      }, { once: true });
    }

    if (mediaType === 'model_shortcode') {
      const embedHtml = (customEmbedHtml || '').toString().trim();
      if (!embedHtml) return null;

      const extractedConfig = extract3DViewerConfigFromShortcodeHtml(embedHtml);
      if (extractedConfig) {
        ensureModelViewerScript();
        modalFrameWrap.innerHTML = '';

        const viewer = document.createElement('model-viewer');
        viewer.id = 'modal-model-viewer';
        viewer.setAttribute('src', buildModelProxyUrl(extractedConfig.modelUrl));
        if (extractedConfig.poster) {
          viewer.setAttribute('poster', extractedConfig.poster.replace(/^http:/i, window.location.protocol));
        }
        if (extractedConfig.canControlCamera) {
          viewer.setAttribute('camera-controls', '');
        }
        if (extractedConfig.autoRotate) {
          viewer.setAttribute('auto-rotate', '');
        }
        viewer.setAttribute('ar', '');
        viewer.setAttribute('loading', 'eager');
        viewer.setAttribute('exposure', extractedConfig.exposure || '1');
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        if (modalFrameWrap.style && extractedConfig.height) {
          modalFrameWrap.style.minHeight = extractedConfig.height;
        }
        viewer.style.background = 'linear-gradient(160deg,rgba(8,9,15,.98),rgba(14,16,26,.96))';
        attachModelLoadingState(viewer);
        modalFrameWrap.appendChild(viewer);
        return viewer;
      }

      modalFrameWrap.innerHTML = embedHtml;
      const scripts = modalFrameWrap.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        for (const attr of oldScript.attributes) {
          newScript.setAttribute(attr.name, attr.value);
        }
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      watchModalShortcodeCleanup(modalFrameWrap);
      return modalFrameWrap;
    }

    const normalized = normalizeVideoInput(mediaInput);
    if (!normalized) return null;

    if (mediaType === 'model') {
      modalFrameWrap.innerHTML = '';

      if (is3DModelAssetUrl(normalized)) {
        ensureModelViewerScript();
        const viewer = document.createElement('model-viewer');
        viewer.id = 'modal-model-viewer';
        viewer.setAttribute('src', buildModelProxyUrl(normalized));
        viewer.setAttribute('camera-controls', '');
        viewer.setAttribute('ar', '');
        viewer.setAttribute('loading', 'eager');
        viewer.style.width = '100%';
        viewer.style.height = 'min(70vh,560px)';
        viewer.style.background = 'linear-gradient(160deg,rgba(8,9,15,.98),rgba(14,16,26,.96))';
        attachModelLoadingState(viewer);
        modalFrameWrap.appendChild(viewer);
        return viewer;
      }

      const modelIframe = document.createElement('iframe');
      modelIframe.id = 'modal-iframe';
      modelIframe.src = normalized;
      modelIframe.allow = 'autoplay; encrypted-media; picture-in-picture; xr-spatial-tracking';
      modelIframe.allowFullscreen = true;
      modalFrameWrap.appendChild(modelIframe);
      return modelIframe;
    }

    if (isDirectVideoUrl(normalized)) {
      const video = document.createElement('video');
      video.id = 'modal-video';
      video.src = normalized;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'metadata';
      modalFrameWrap.innerHTML = '';
      modalFrameWrap.appendChild(video);
      return video;
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'modal-iframe';
    iframe.src = buildEmbedUrl(normalized);
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    modalFrameWrap.innerHTML = '';
    modalFrameWrap.appendChild(iframe);
    return iframe;
  }

  window.openVideoModal = function(videoUrl, title, category, polyCount, tool, mediaType, description, customEmbedHtml) {
    if (!modal || !modalFrameWrap) return;
    const resolvedMediaType = (mediaType === 'model' || mediaType === 'model_shortcode') ? mediaType : 'video';
    const isModelLike = (resolvedMediaType === 'model' || resolvedMediaType === 'model_shortcode');
    const metaValue = (polyCount || '').toString().trim();
    const toolLabel = (tool || '').toString();
    const descriptionText = (description || '').toString().trim();

    clearModalMedia();
    modalMediaEl = renderModalMedia(videoUrl, resolvedMediaType, customEmbedHtml);
    if (!modalMediaEl) return;

    if (modalTitle) modalTitle.textContent = title;
    if (modalCat) modalCat.textContent = category;
    if (modalPolys) modalPolys.textContent = metaValue === '' ? '' : (isModelLike ? metaValue : (metaValue + ' polys'));
    if (modalTool) modalTool.textContent = toolLabel;
    if (modalDesc) modalDesc.textContent = descriptionText;
    if (modalToolBadge) {
      modalToolBadge.textContent = toolLabel;
      modalToolBadge.className = 'video-tool-badge ' + (toolLabel.toLowerCase().includes('unreal') ? 'unreal' : 'blender');
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      attemptModalVideoAutoplay(modalMediaEl);
    });
  };

  window.openVideoModalFromButton = function(buttonEl) {
    if (!buttonEl) return;

    const mediaUrl = buttonEl.getAttribute('data-media-url') || '';
    const title = buttonEl.getAttribute('data-title') || '';
    const category = buttonEl.getAttribute('data-category') || '';
    const detail = buttonEl.getAttribute('data-detail') || '';
    const tool = buttonEl.getAttribute('data-tool') || '';
    const mediaType = buttonEl.getAttribute('data-media-type') || 'video';
    const description = buttonEl.getAttribute('data-description') || '';
    const embedHtmlB64 = buttonEl.getAttribute('data-embed-b64') || '';
    const embedHtml = decodeBase64Utf8(embedHtmlB64);

    window.openVideoModal(mediaUrl, title, category, detail, tool, mediaType, description, embedHtml);
  };

  function isCardInteractiveTarget(targetEl, cardEl) {
    if (!targetEl || !cardEl || !(targetEl instanceof Element)) return false;
    const interactiveEl = targetEl.closest('a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"]');
    if (!interactiveEl || !cardEl.contains(interactiveEl)) return false;
    return interactiveEl !== cardEl;
  }

  function triggerProductCardAction(cardEl, sourceEvent) {
    if (!cardEl) return;
    const action = (cardEl.getAttribute('data-card-action') || '').trim();
    if (!action) return;

    if (action === 'modal') {
      const playButton = cardEl.querySelector('.model-play');
      if (playButton && typeof window.openVideoModalFromButton === 'function') {
        if (sourceEvent) sourceEvent.preventDefault();
        window.openVideoModalFromButton(playButton);
      }
      return;
    }

    if (action === 'detail') {
      const targetUrl = (cardEl.getAttribute('data-card-url') || '').trim();
      if (!targetUrl) return;
      if (sourceEvent) sourceEvent.preventDefault();
      window.location.href = targetUrl;
    }
  }

  function initializeProductCardActions() {
    const cardSelector = '.model-card[data-card-action]';

    document.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const clickTarget = event.target;
      if (!(clickTarget instanceof Element)) return;
      const cardEl = clickTarget.closest(cardSelector);
      if (!cardEl) return;
      if (isCardInteractiveTarget(clickTarget, cardEl)) return;
      triggerProductCardAction(cardEl, event);
    });

    document.addEventListener('keydown', event => {
      if (event.defaultPrevented) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const keyTarget = event.target;
      if (!(keyTarget instanceof Element)) return;
      const cardEl = keyTarget.closest(cardSelector);
      if (!cardEl) return;
      if (isCardInteractiveTarget(keyTarget, cardEl)) return;
      triggerProductCardAction(cardEl, event);
    });
  }

  initializeProductCardActions();

  window.closeVideoModal = function() {
    if (!modal) return;
    modal.classList.remove('open');
    clearModalMedia();
    document.body.style.overflow = '';
  };

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.classList.contains('video-backdrop')) {
        closeVideoModal();
      }
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVideoModal();
  });

});
