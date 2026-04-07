/* ================================================
   GAMENIC - Sub-page shared JavaScript
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Shared page scroll lock manager (prevents stuck overflow:hidden states)
  let pageScrollLockCount = 0;
  function applyPageScrollState() {
    const shouldLock = pageScrollLockCount > 0;
    document.documentElement.classList.toggle('gamenic-scroll-locked', shouldLock);
    document.body.classList.toggle('gamenic-scroll-locked', shouldLock);
    document.documentElement.classList.toggle('gamenic-scroll-unlocked', !shouldLock);
    document.body.classList.toggle('gamenic-scroll-unlocked', !shouldLock);
    // Clear potential stale inline locks from earlier scripts.
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
  function lockPageScroll() {
    pageScrollLockCount += 1;
    applyPageScrollState();
  }
  function unlockPageScroll(force) {
    if (force) {
      pageScrollLockCount = 0;
    } else {
      pageScrollLockCount = Math.max(pageScrollLockCount - 1, 0);
    }
    applyPageScrollState();
  }
  // Always start unlocked, including bfcache restores.
  unlockPageScroll(true);
  window.addEventListener('pageshow', () => unlockPageScroll(true));

  function hasOpenOverlay() {
    const careerModal = document.getElementById('career-modal');
    const videoModal = document.getElementById('video-modal');
    const careerOpen = !!(careerModal && !careerModal.hidden);
    const videoOpen = !!(videoModal && videoModal.classList.contains('open'));
    return careerOpen || videoOpen;
  }

  function forceEnablePageScroll() {
    if (hasOpenOverlay()) return;
    unlockPageScroll(true);
    document.documentElement.style.position = '';
    document.documentElement.style.height = '';
    document.body.style.position = '';
    document.body.style.height = '';
  }

  // Navbar scroll
  const navbar = document.querySelector('.navbar');
  const scrollTopBtn = document.querySelector('.scroll-top');
  function onScroll() {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 50);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  let mobileOpen = false;
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileOpen = !mobileOpen;
      mobileMenu.classList.toggle('open', mobileOpen);
      mobileToggle.innerHTML = mobileOpen
        ? '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  }
  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      mobileOpen = false;
      if (mobileMenu) mobileMenu.classList.remove('open');
    });
  });

  // Scroll to top
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  function checkReveal() {
    const wh = window.innerHeight;
    revealEls.forEach(el => {
      if (el.getBoundingClientRect().top < wh - 80) el.classList.add('active');
    });
  }
  window.addEventListener('scroll', checkReveal, { passive: true });
  checkReveal();

  // Cleanup for shortcode-based 3D viewers embedded in product detail pages.
  function cleanupShortcodeViewerContent() {
    const viewerRoots = document.querySelectorAll('.sd-media-shortcode');
    if (!viewerRoots.length) return;

    const removableSelector = [
      '.price',
      '.product_meta',
      '.posted_in',
      '.tagged_as',
      '.sku_wrapper',
      '.wc-block-components-product-price',
      '.wp-block-woocommerce-product-price'
    ].join(',');

    const textBlockSelector = 'p,div,span,li,h1,h2,h3,h4,h5,h6';
    const categoryLinePattern = /^(?:Category|Categories)\s*:/i;
    const priceLinePattern = /^(?:[A-Z]{2,3}\s*)?[$€£₹]\s*\d[\d,]*(?:\.\d+)?(?:\s*[-–]\s*(?:[A-Z]{2,3}\s*)?[$€£₹]?\s*\d[\d,]*(?:\.\d+)?)?$/;

    viewerRoots.forEach(root => {
      root.querySelectorAll(removableSelector).forEach(node => node.remove());

      const hasDescriptionTab = Array.from(root.querySelectorAll('.wc-tabs, .woocommerce-tabs, [role="tablist"]'))
        .some(node => (node.textContent || '').toLowerCase().includes('description'));

      root.querySelectorAll(textBlockSelector).forEach(node => {
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return;

        if (categoryLinePattern.test(text) || priceLinePattern.test(text)) {
          node.remove();
          return;
        }

        if (
          hasDescriptionTab &&
          /^h[1-6]$/i.test(node.tagName) &&
          text.toLowerCase() === 'description'
        ) {
          node.remove();
        }
      });
    });
  }

  const shortcodeViewerRoots = document.querySelectorAll('.sd-media-shortcode');
  if (shortcodeViewerRoots.length) {
    let cleanupScheduled = false;
    const scheduleCleanup = () => {
      if (cleanupScheduled) return;
      cleanupScheduled = true;
      window.requestAnimationFrame(() => {
        cleanupScheduled = false;
        cleanupShortcodeViewerContent();
      });
    };

    scheduleCleanup();

    shortcodeViewerRoots.forEach(root => {
      const observer = new MutationObserver(() => scheduleCleanup());
      observer.observe(root, { childList: true, subtree: true });
    });
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Models page filters (instant in-page switch, no full reload)
  const modelFilters = document.getElementById('model-filters');
  const modelsGrid = document.getElementById('models-grid');
  const noModelsState = document.getElementById('no-models');
  if (
    modelFilters &&
    modelsGrid &&
    modelFilters.dataset.gamenicInstantFilterBound !== '1' &&
    typeof window.fetch === 'function' &&
    typeof DOMParser !== 'undefined'
  ) {
    modelFilters.dataset.gamenicInstantFilterBound = '1';
    let filterRequestController = null;
    let activeFilterUrl = new URL(window.location.href).toString();
    let latestModelRequestId = 0;

    function normalizeUrl(url) {
      try {
        return new URL(url, window.location.href).toString();
      } catch (error) {
        return '';
      }
    }

    function setFilteringState(isFiltering) {
      if (isFiltering) {
        modelFilters.style.pointerEvents = 'none';
      } else {
        modelFilters.style.pointerEvents = '';
      }
    }

    function activateRevealCards(container) {
      const revealCards = container.querySelectorAll('.reveal');
      revealCards.forEach(el => {
        el.classList.add('active');
        if (el.classList.contains('model-card')) {
          el.style.animation = 'none';
        }
      });
    }

    function applyModelsFromDocument(nextDocument) {
      const nextFilters = nextDocument.getElementById('model-filters');
      const nextGrid = nextDocument.getElementById('models-grid');
      const nextNoModels = nextDocument.getElementById('no-models');
      if (!nextFilters || !nextGrid) {
        throw new Error('Missing models filter markup in response');
      }

      modelFilters.innerHTML = nextFilters.innerHTML;
      modelsGrid.innerHTML = nextGrid.innerHTML;

      if (noModelsState) {
        if (nextNoModels) {
          noModelsState.innerHTML = nextNoModels.innerHTML;
          noModelsState.style.display = nextNoModels.style.display === 'none' ? 'none' : 'block';
        } else {
          noModelsState.style.display = modelsGrid.children.length > 0 ? 'none' : 'block';
        }
      }

      activateRevealCards(modelsGrid);
      refreshIcons();
      initialize3DModalWarmup();
    }

    async function transitionToFilter(url, shouldPushState) {
      const normalizedTargetUrl = normalizeUrl(url);
      if (!normalizedTargetUrl || normalizedTargetUrl === activeFilterUrl) {
        return;
      }

      if (filterRequestController) {
        filterRequestController.abort();
      }
      filterRequestController = new AbortController();
      const requestId = ++latestModelRequestId;
      setFilteringState(true);

      try {
        const response = await fetch(normalizedTargetUrl, {
          method: 'GET',
          credentials: 'same-origin',
          signal: filterRequestController.signal
        });

        if (!response.ok) {
          throw new Error('Failed to load filtered products');
        }

        const responseHtml = await response.text();
        if (requestId !== latestModelRequestId) {
          return;
        }
        const parsedDocument = new DOMParser().parseFromString(responseHtml, 'text/html');
        applyModelsFromDocument(parsedDocument);
        activeFilterUrl = normalizedTargetUrl;

        if (shouldPushState && window.history && typeof window.history.pushState === 'function') {
          window.history.pushState({ gamenicModelFilter: true }, '', activeFilterUrl);
        }
      } catch (error) {
        if (error && error.name === 'AbortError') {
          return;
        }
        window.location.href = normalizedTargetUrl || url;
      } finally {
        if (requestId === latestModelRequestId) {
          filterRequestController = null;
          setFilteringState(false);
        }
      }
    }

    modelFilters.addEventListener('click', event => {
      const targetPill = event.target.closest('.filter-pill');
      if (!targetPill || !modelFilters.contains(targetPill)) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (targetPill.tagName === 'A' && targetPill.target && targetPill.target.toLowerCase() === '_blank') return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      transitionToFilter(targetPill.dataset.url || targetPill.href || '', true);
    }, true);

    window.addEventListener('popstate', () => {
      if (!document.body.contains(modelFilters) || !document.body.contains(modelsGrid)) {
        return;
      }
      transitionToFilter(window.location.href, false);
    });
  }

  // Blog page filters (instant switch without loading animation)
  const blogFilters = document.getElementById('filter-pills');
  const blogGrid = document.getElementById('blog-grid');
  const blogArticlesCount = document.getElementById('blog-articles-count');
  const blogNoResults = document.getElementById('blog-no-results');
  const blogSearchForm = document.querySelector('.blog-page .search-wrap');
  if (
    blogFilters &&
    blogGrid &&
    blogArticlesCount &&
    blogFilters.dataset.gamenicInstantFilterBound !== '1' &&
    typeof window.fetch === 'function' &&
    typeof DOMParser !== 'undefined'
  ) {
    blogFilters.dataset.gamenicInstantFilterBound = '1';
    let blogRequestController = null;
    let activeBlogFilterUrl = new URL(window.location.href).toString();
    let latestBlogRequestId = 0;

    function normalizeBlogUrl(url) {
      try {
        return new URL(url, window.location.href).toString();
      } catch (error) {
        return '';
      }
    }

    function setBlogFilteringState(isFiltering) {
      if (isFiltering) {
        blogFilters.style.pointerEvents = 'none';
      } else {
        blogFilters.style.pointerEvents = '';
      }
    }

    function syncBlogSearchForm(nextDocument) {
      if (!blogSearchForm) return;
      const nextSearchForm = nextDocument.querySelector('.blog-page .search-wrap');
      if (!nextSearchForm) return;

      const currentSearchInput = blogSearchForm.querySelector('input[name="blog_search"]');
      const nextSearchInput = nextSearchForm.querySelector('input[name="blog_search"]');
      if (currentSearchInput && nextSearchInput) {
        currentSearchInput.value = nextSearchInput.value || '';
      }

      const currentHiddenCategory = blogSearchForm.querySelector('input[name="blog_cat"]');
      const nextHiddenCategory = nextSearchForm.querySelector('input[name="blog_cat"]');
      if (nextHiddenCategory) {
        if (currentHiddenCategory) {
          currentHiddenCategory.value = nextHiddenCategory.value || '';
        } else {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'blog_cat';
          hiddenInput.value = nextHiddenCategory.value || '';
          blogSearchForm.appendChild(hiddenInput);
        }
      } else if (currentHiddenCategory) {
        currentHiddenCategory.remove();
      }
    }

    function applyBlogFiltersFromDocument(nextDocument) {
      const nextFilters = nextDocument.getElementById('filter-pills');
      const nextGrid = nextDocument.getElementById('blog-grid');
      const nextArticlesCount = nextDocument.getElementById('blog-articles-count');
      const nextNoResults = nextDocument.getElementById('blog-no-results');
      if (!nextFilters || !nextGrid || !nextArticlesCount) {
        throw new Error('Missing blog filter markup in response');
      }

      blogFilters.innerHTML = nextFilters.innerHTML;
      blogGrid.innerHTML = nextGrid.innerHTML;
      blogArticlesCount.innerHTML = nextArticlesCount.innerHTML;

      if (blogNoResults) {
        if (nextNoResults) {
          blogNoResults.innerHTML = nextNoResults.innerHTML;
          blogNoResults.style.display = nextNoResults.style.display === 'none' ? 'none' : 'block';
        } else {
          blogNoResults.style.display = blogGrid.children.length > 0 ? 'none' : 'block';
        }
      }

      syncBlogSearchForm(nextDocument);
      refreshIcons();
    }

    async function transitionToBlogFilter(url, shouldPushState) {
      const normalizedTargetUrl = normalizeBlogUrl(url);
      if (!normalizedTargetUrl || normalizedTargetUrl === activeBlogFilterUrl) {
        return;
      }

      if (blogRequestController) {
        blogRequestController.abort();
      }
      blogRequestController = new AbortController();
      const requestId = ++latestBlogRequestId;
      setBlogFilteringState(true);

      try {
        const response = await fetch(normalizedTargetUrl, {
          method: 'GET',
          credentials: 'same-origin',
          signal: blogRequestController.signal
        });

        if (!response.ok) {
          throw new Error('Failed to load filtered blog posts');
        }

        const responseHtml = await response.text();
        if (requestId !== latestBlogRequestId) {
          return;
        }
        const parsedDocument = new DOMParser().parseFromString(responseHtml, 'text/html');
        applyBlogFiltersFromDocument(parsedDocument);
        activeBlogFilterUrl = normalizedTargetUrl;

        if (shouldPushState && window.history && typeof window.history.pushState === 'function') {
          window.history.pushState({ gamenicBlogFilter: true }, '', activeBlogFilterUrl);
        }
      } catch (error) {
        if (error && error.name === 'AbortError') {
          return;
        }
        window.location.href = normalizedTargetUrl || url;
      } finally {
        if (requestId === latestBlogRequestId) {
          blogRequestController = null;
          setBlogFilteringState(false);
        }
      }
    }

    blogFilters.addEventListener('click', event => {
      const targetPill = event.target.closest('.filter-pill');
      if (!targetPill || !blogFilters.contains(targetPill)) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (targetPill.tagName === 'A' && targetPill.target && targetPill.target.toLowerCase() === '_blank') return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      transitionToBlogFilter(targetPill.dataset.url || targetPill.href || '', true);
    }, true);

    window.addEventListener('popstate', () => {
      if (!document.body.contains(blogFilters) || !document.body.contains(blogGrid)) {
        return;
      }
      transitionToBlogFilter(window.location.href, false);
    });
  }

  // Video modal
  const modal = document.getElementById('video-modal');
  const modalFrameWrap = modal ? modal.querySelector('.video-frame') : null;
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
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(raw);
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
      if (id) return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&mute=1&playsinline=1';
    }

    if (host.endsWith('youtube.com')) {
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/i);
      const id = embedMatch ? embedMatch[1] : parsed.searchParams.get('v');
      if (id) return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&mute=1&playsinline=1';
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)(?:$|\/)/);
      if (match) return 'https://player.vimeo.com/video/' + match[1] + '?autoplay=1&muted=1';
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
        viewer.addEventListener('error', () => {
          const errorNote = document.createElement('div');
          errorNote.style.cssText = 'padding:12px;color:rgba(255,255,255,.55);font-family:var(--font-sans);font-size:13px;';
          errorNote.textContent = 'Unable to load 3D model. Check model URL/CORS settings.';
          modalFrameWrap.appendChild(errorNote);
        }, { once: true });
        modalFrameWrap.appendChild(viewer);
        return viewer;
      }

      modalFrameWrap.innerHTML = embedHtml;
      // Re-run scripts from shortcode markup (inline and external).
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
      attributes?.model?.modelUrl
      || (Array.isArray(attributes?.models) && attributes.models[0] ? attributes.models[0].modelUrl : '')
      || ''
    ).toString().trim();

    if (!modelUrl) return null;

    return {
      modelUrl: modelUrl.replace(/^http:/i, window.location.protocol),
      poster: ((attributes?.model?.poster || '') + '').trim(),
      autoRotate: !!attributes?.autoRotate,
      exposure: ((attributes?.exposure || '1') + '').trim(),
      height: ((attributes?.styles?.height || '') + '').trim(),
      canControlCamera: attributes?.O3DVSettings?.mouseControl !== false,
    };
  }

  initialize3DModalWarmup();

  window.openVideoModal = function(videoUrl, title, category, polyCount, tool, mediaType, description, customEmbedHtml) {
    if (!modal || !modalFrameWrap) return;
    const resolvedMediaType = (mediaType === 'model' || mediaType === 'model_shortcode') ? mediaType : 'video';
    const isModelLike = (resolvedMediaType === 'model' || resolvedMediaType === 'model_shortcode');
    const toolLabel = (tool || '').toString();
    const metaValue = (polyCount || '').toString().trim();
    const descriptionText = (description || '').toString().trim();

    clearModalMedia();
    modalMediaEl = renderModalMedia(videoUrl, resolvedMediaType, customEmbedHtml);
    if (!modalMediaEl) return;
    const mt = document.getElementById('modal-title');
    const mc = document.getElementById('modal-cat');
    const mp = document.getElementById('modal-polys');
    const mto = document.getElementById('modal-tool');
    const mtb = document.getElementById('modal-tool-badge');
    const md = document.getElementById('modal-desc');
    if (mt) mt.textContent = title;
    if (mc) mc.textContent = category;
    if (mp) mp.textContent = (metaValue === '') ? '' : (isModelLike ? metaValue : (metaValue + ' polys'));
    if (mto) mto.textContent = toolLabel;
    if (md) md.textContent = descriptionText;
    if (mtb) {
      mtb.textContent = toolLabel;
      mtb.className = 'video-tool-badge ' + (toolLabel.toLowerCase().includes('unreal') ? 'unreal' : 'blender');
    }
    modal.classList.add('open');
    lockPageScroll();
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
    unlockPageScroll();
  };

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.classList.contains('video-backdrop')) closeVideoModal();
    });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideoModal(); });

  // Career page
  const careerPage = document.querySelector('.career-page');
  if (careerPage) {
    // Defensive unlocks: some browsers/extensions keep stale overflow lock on hash navigation.
    forceEnablePageScroll();
    [0, 120, 360, 900].forEach(delay => setTimeout(forceEnablePageScroll, delay));
    window.addEventListener('hashchange', () => {
      setTimeout(forceEnablePageScroll, 0);
      setTimeout(forceEnablePageScroll, 200);
    });
    window.addEventListener('focus', forceEnablePageScroll);

    const jobToggles = document.querySelectorAll('[data-career-toggle]');
    const applyButtons = document.querySelectorAll('.career-apply-btn');
    const careerModal = document.getElementById('career-modal');
    const modalCloseEls = careerModal ? careerModal.querySelectorAll('[data-career-modal-close]') : [];
    const modalTitle = document.getElementById('career-modal-job-title');
    const inputJobTitle = document.getElementById('career-job-title-input');
    const inputSubject = document.getElementById('career-job-subject-input');
    const applyForm = document.getElementById('career-apply-form');
    if (applyForm && applyForm.dataset.gamenicCareerBound !== '1') {
      applyForm.dataset.gamenicCareerBound = '1';
    }
    const submitBtn = document.getElementById('career-submit-btn');
    const formError = document.getElementById('career-form-error');
    const formSuccess = document.getElementById('career-form-success');
    let formAutoCloseTimer = null;

    function setFieldError(name, message) {
      const el = document.querySelector('[data-error-for="' + name + '"]');
      if (el) el.textContent = message || '';
    }

    function clearFieldErrors() {
      ['name', 'email', 'portfolio', 'message'].forEach(name => setFieldError(name, ''));
    }

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
        let result = {};

        try {
          response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
              Accept: 'application/json'
            },
            credentials: 'same-origin'
          });
        } catch (networkError) {
          lastError = new Error(defaultMessage);
          continue;
        }

        const rawResponse = await response.text();
        try {
          result = rawResponse ? JSON.parse(rawResponse) : {};
        } catch (jsonError) {
          result = {};
        }

        if (response.status === 404 && i < endpoints.length - 1) {
          lastError = new Error('Form endpoint not found (HTTP 404).');
          continue;
        }

        if (!response.ok || !result.success) {
          const serverMessage = (result && result.data && result.data.message)
            || (result && result.message)
            || '';
          const fallbackMessage = response.status
            ? (defaultMessage + ' (HTTP ' + response.status + ').')
            : defaultMessage;
          throw new Error(serverMessage || fallbackMessage);
        }

        return result;
      }

      throw lastError || new Error(defaultMessage);
    }

    function toggleCareerModal(open) {
      if (!careerModal) return;
      if (formAutoCloseTimer) {
        clearTimeout(formAutoCloseTimer);
        formAutoCloseTimer = null;
      }
      careerModal.hidden = !open;
      if (open) {
        lockPageScroll();
      } else {
        unlockPageScroll();
      }
      if (!open && applyForm) {
        applyForm.reset();
        clearFieldErrors();
        if (formError) {
          formError.hidden = true;
          formError.textContent = '';
        }
        if (formSuccess) {
          formSuccess.hidden = true;
        }
        applyForm.hidden = false;
      }
      if (!open && submitBtn) {
        const label = submitBtn.querySelector('.label');
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        if (label) label.textContent = 'Submit';
      }
    }

    function closeAllCareerDetails() {
      document.querySelectorAll('.career-job-details').forEach(panel => {
        panel.hidden = true;
        const card = panel.closest('.career-job-card');
        if (card) card.classList.remove('open');
      });
    }

    function openCareerDetails(target) {
      if (!target) return;
      closeAllCareerDetails();
      target.hidden = false;
      const card = target.closest('.career-job-card');
      if (card) card.classList.add('open');
    }

    jobToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-career-toggle');
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;

        const isOpen = !target.hidden;
        if (isOpen) {
          closeAllCareerDetails();
        } else {
          openCareerDetails(target);
        }
      });
    });

    // Support deep links like /career/?job=career-job-43#open-positions
    const requestedJob = new URLSearchParams(window.location.search).get('job');
    if (requestedJob) {
      const matchingCard = Array.from(document.querySelectorAll('.career-job-card[data-career-job]')).find(card => {
        return card.getAttribute('data-career-job') === requestedJob;
      });
      if (matchingCard) {
        const detailsPanel = matchingCard.querySelector('.career-job-details');
        openCareerDetails(detailsPanel);

        const shouldFocusOpenings = window.location.hash === '#open-positions';
        const positionsSection = document.getElementById('open-positions');
        if (shouldFocusOpenings && positionsSection) {
          setTimeout(() => {
            const nav = document.querySelector('.navbar');
            const navOffset = nav ? nav.getBoundingClientRect().height + 24 : 112;
            const y = positionsSection.getBoundingClientRect().top + window.pageYOffset - navOffset;
            window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
          }, 120);
        }

        // Remove one-time query param to prevent repeated auto-jumps on refresh.
        if (window.history && typeof window.history.replaceState === 'function') {
          const url = new URL(window.location.href);
          url.searchParams.delete('job');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }

    applyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-job-title') || 'Career Role';
        if (modalTitle) modalTitle.textContent = title;
        if (inputJobTitle) inputJobTitle.value = title;
        if (inputSubject) inputSubject.value = 'Career Application - ' + title;
        if (formSuccess) formSuccess.hidden = true;
        if (applyForm) applyForm.hidden = false;
        toggleCareerModal(true);
      });
    });

    modalCloseEls.forEach(el => el.addEventListener('click', () => toggleCareerModal(false)));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && careerModal && !careerModal.hidden) {
        toggleCareerModal(false);
      }
    });

    if (applyForm && applyForm.dataset.gamenicCareerSubmitHandlerBound !== '1') {
      applyForm.dataset.gamenicCareerSubmitHandlerBound = '1';
      applyForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (applyForm.dataset.gamenicSubmitting === '1') return;
        applyForm.dataset.gamenicSubmitting = '1';

        clearFieldErrors();

        const name = (applyForm.querySelector('#career-name')?.value || '').trim();
        const email = (applyForm.querySelector('#career-email')?.value || '').trim();
        const portfolio = (applyForm.querySelector('#career-portfolio')?.value || '').trim();
        const message = (applyForm.querySelector('#career-message')?.value || '').trim();

        let hasError = false;
        if (name.length < 2) {
          setFieldError('name', 'Please enter a valid name.');
          hasError = true;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setFieldError('email', 'Please enter a valid email.');
          hasError = true;
        }
        if (portfolio && !/^https?:\/\/.+/i.test(portfolio)) {
          setFieldError('portfolio', 'Enter a full URL starting with http:// or https://');
          hasError = true;
        }
        if (message.length < 20) {
          setFieldError('message', 'Please write at least 20 characters.');
          hasError = true;
        }

        if (hasError) {
          applyForm.dataset.gamenicSubmitting = '0';
          return;
        }

        const submitBtnLabel = submitBtn ? submitBtn.querySelector('.label') : null;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('is-loading');
          if (submitBtnLabel) submitBtnLabel.textContent = 'Submitting...';
        }
        if (formError) {
          formError.hidden = true;
          formError.textContent = '';
        }

        try {
          await postFormWithFallback(applyForm, 'Failed to submit application.');

          applyForm.hidden = true;
          if (formSuccess) formSuccess.hidden = false;
          formAutoCloseTimer = setTimeout(() => toggleCareerModal(false), 3000);
        } catch (err) {
          if (formError) {
            formError.hidden = false;
            formError.textContent = err.message || 'Failed to submit application. Please try again.';
          }
        } finally {
          applyForm.dataset.gamenicSubmitting = '0';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            if (submitBtnLabel) submitBtnLabel.textContent = 'Submit';
          }
        }
      });
    }
  }
});
