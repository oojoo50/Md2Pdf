/**
 * Md2Pdf — Markdown to PDF Converter (client-side)
 * Supports: GFM, KaTeX math, Mermaid diagrams, images
 *
 * Nothing ever leaves the browser: parsing, rendering and PDF generation are
 * all local, so the app keeps working offline after the first load.
 */
(function () {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    marked: {
      gfm: true,
      // GFM leaves single newlines as soft breaks. Forcing <br> here would
      // split multi-line $$…$$ blocks across text nodes and break KaTeX.
      breaks: false
    },
    mermaid: {
      startOnLoad: false,
      theme: 'default',
      suppressErrorRendering: true,
      securityLevel: 'loose',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    },
    katex: {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false,
      strict: false
    },
    pdf: {
      margin: 14,
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['tr', '.mermaid', '.katex-display', 'pre', 'blockquote']
      }
    }
  };

  const SPLIT_STORAGE_KEY = 'md2pdf-split';
  const ACCEPTED_EXTENSIONS = ['.md', '.markdown', '.txt'];
  const MIN_PANE_PERCENT = 20;
  const MAX_PANE_PERCENT = 80;

  // ========================================
  // State
  // ========================================
  const els = {};
  let currentMarkdown = '';
  let currentFileName = '';
  let mermaidInitialized = false;
  let isDownloading = false;

  // ========================================
  // Helpers
  // ========================================
  const t = (key) => window.I18N.get(key);

  const storage = {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (err) {
        console.warn('storage: read failed', err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn('storage: write failed', err);
      }
    }
  };

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ========================================
  // Toasts
  // ========================================
  function showToast(message, type = 'info') {
    if (!els.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    // Keep the stack short
    while (els.toastContainer.children.length > 3) {
      els.toastContainer.firstElementChild?.remove();
    }

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  const toastError = (key) => showToast(t(key), 'error');
  const toastSuccess = (key) => showToast(t(key), 'success');

  // ========================================
  // Loading overlay
  // ========================================
  function setProgress(percent) {
    if (els.loadingBar) {
      els.loadingBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
  }

  function showLoading(show) {
    if (!els.loadingOverlay) return;
    els.loadingOverlay.classList.toggle('hidden', !show);
    if (show) setProgress(6);
  }

  // ========================================
  // Markdown pipeline
  // ========================================
  async function processMarkdown(markdown) {
    const raw = marked.parse(markdown, CONFIG.marked);

    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_TAGS: [
        'mermaid',
        'span',
        'math',
        'semantics',
        'annotation',
        'mi',
        'mo',
        'mn',
        'ms',
        'mtext',
        'mrow',
        'msub',
        'msup',
        'msubsup',
        'mfrac',
        'msqrt',
        'mroot',
        'mfenced',
        'mtable',
        'mtr',
        'mtd',
        'mover',
        'munder',
        'munderover'
      ],
      ADD_ATTR: ['data-*', 'class', 'style', 'xmlns']
    });
  }

  function renderMath(element) {
    try {
      renderMathInElement(element, CONFIG.katex);
    } catch (err) {
      console.warn('KaTeX render error:', err);
    }
  }

  async function renderMermaid(element) {
    if (!mermaidInitialized) {
      mermaid.initialize(CONFIG.mermaid);
      mermaidInitialized = true;
    }

    const nodes = element.querySelectorAll('.language-mermaid, .mermaid');
    for (const node of nodes) {
      const code = (node.textContent || '').trim();
      if (!code) continue;

      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      try {
        const { svg } = await mermaid.render(id, code);
        const container = document.createElement('div');
        container.className = 'mermaid';
        container.innerHTML = svg;

        // Replace the whole <pre><code>…</code></pre> block when present
        const pre = node.closest('pre');
        if (pre) {
          pre.replaceWith(container);
        } else {
          node.replaceWith(container);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        const errorBox = document.createElement('div');
        errorBox.className = 'mermaid-error';
        errorBox.textContent = `Mermaid: ${err.message}`;
        const pre = node.closest('pre');
        if (pre) {
          pre.replaceWith(errorBox);
        } else {
          node.replaceWith(errorBox);
        }
      }
    }
  }

  async function renderPreview(markdown, { syncEditor = false } = {}) {
    currentMarkdown = markdown;

    if (syncEditor && els.markdownInput && els.markdownInput.value !== markdown) {
      els.markdownInput.value = markdown;
    }

    if (!markdown.trim()) {
      els.renderedContent.innerHTML = '';
      updatePlaceholder();
      return;
    }

    els.renderedContent.innerHTML = await processMarkdown(markdown);
    renderMath(els.renderedContent);
    await renderMermaid(els.renderedContent);
    updatePlaceholder();
  }

  function updatePlaceholder() {
    if (!els.previewPlaceholder || !els.renderedContent) return;
    const isEmpty = !els.renderedContent.textContent.trim() &&
      !els.renderedContent.querySelector('svg, img, table');
    els.previewPlaceholder.classList.toggle('hidden', !isEmpty);
  }

  // ========================================
  // Document meta (title / badge / stats)
  // ========================================
  function extractTitle(markdown) {
    const match = String(markdown)
      .split('\n')
      .find((line) => /^#\s+/.test(line));
    if (!match) return '';
    return match
      .replace(/^#\s+/, '')
      .trim()
      .replace(/[<>:"/\\|?*]/g, '')
      .slice(0, 50);
  }

  function updateDocMeta() {
    if (!els.docTitle || !els.fileBadge) return;

    const title = extractTitle(currentMarkdown) || t('docTitleDefault');
    els.docTitle.textContent = title;

    els.fileBadge.textContent = currentFileName
      ? currentFileName.replace(/\.(md|markdown|txt)$/i, '')
      : t('fileBadge');

    document.title = currentMarkdown.trim()
      ? `${t('brand')}${t('docTitleSeparator')}${title}`
      : t('seoTitle');
  }

  function updateStats() {
    if (!els.markdownInput) return;
    const value = els.markdownInput.value;

    if (els.charCount) els.charCount.textContent = String(value.length);
    if (els.lineCount) els.lineCount.textContent = String(value ? value.split('\n').length : 0);
    if (els.wordCount) {
      const words = value.trim() ? value.trim().split(/\s+/).length : 0;
      els.wordCount.textContent = String(words);
    }
  }

  function setDownloadEnabled(enabled) {
    if (!els.downloadPdf) return;
    els.downloadPdf.disabled = !enabled;
    const label = els.downloadPdf.querySelector('span');
    if (label) label.textContent = enabled || !isDownloading ? t('btnDownload') : t('btnDownloading');
  }

  // ========================================
  // View switching
  // ========================================
  function isEditorOpen() {
    return Boolean(els.editorView && !els.editorView.classList.contains('hidden'));
  }

  function openEditor() {
    if (!els.landingView || !els.editorView) return;
    els.landingView.classList.add('hidden');
    els.editorView.classList.remove('hidden');
    els.editorView.removeAttribute('aria-hidden');
  }

  function goHome() {
    if (!els.landingView || !els.editorView) return;

    currentMarkdown = '';
    currentFileName = '';
    isDownloading = false;

    if (els.markdownInput) els.markdownInput.value = '';
    if (els.renderedContent) els.renderedContent.innerHTML = '';

    els.editorView.classList.add('hidden');
    els.landingView.classList.remove('hidden');
    els.landingView.removeAttribute('aria-hidden');

    updateStats();
    updateDocMeta();
    updatePlaceholder();
    setDownloadEnabled(false);
  }

  // ========================================
  // File handling
  // ========================================
  function handleFile(file) {
    if (!file) return;

    const extension = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    const isText =
      file.type === 'text/markdown' ||
      file.type === 'text/plain' ||
      file.type === '';

    if (!ACCEPTED_EXTENSIONS.includes(extension) && !isText) {
      toastError('toastErrorFile');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = String(event.target.result || '');
      currentFileName = file.name;

      openEditor();
      renderPreview(content, { syncEditor: true });
      updateStats();
      updateDocMeta();
      setDownloadEnabled(true);
      els.markdownInput?.focus();
    };

    reader.onerror = () => {
      console.error('FileReader failed', reader.error);
      toastError('toastErrorRead');
    };

    reader.readAsText(file);
  }

  function setupFileInput() {
    if (!els.dropZone || !els.fileInput) return;

    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((type) =>
      els.dropZone.addEventListener(type, stop)
    );

    ['dragenter', 'dragover'].forEach((type) =>
      els.dropZone.addEventListener(type, () => {
        els.dropZone.classList.add('is-dragging');
        els.dragOverlay?.classList.add('active');
      })
    );

    ['dragleave', 'drop'].forEach((type) =>
      els.dropZone.addEventListener(type, () => {
        els.dropZone.classList.remove('is-dragging');
        els.dragOverlay?.classList.remove('active');
      })
    );

    els.dropZone.addEventListener('drop', (event) => {
      handleFile(event.dataTransfer?.files?.[0]);
    });

    // Delegated: #browseBtn lives inside an innerHTML blob that i18n re-renders,
    // so a cached node reference would be stale after a language switch.
    els.dropZone.addEventListener('click', (event) => {
      if (event.target.closest('#browseBtn') || event.target.closest('.drop-zone')) {
        els.fileInput.click();
      }
    });

    els.dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        els.fileInput.click();
      }
    });

    els.fileInput.addEventListener('change', (event) => {
      handleFile(event.target.files?.[0]);
      event.target.value = '';
    });
  }

  // ========================================
  // Editor
  // ========================================
  function setupEditor() {
    if (!els.markdownInput) return;

    els.markdownInput.addEventListener(
      'input',
      debounce(() => {
        renderPreview(els.markdownInput.value);
        updateStats();
        updateDocMeta();
        setDownloadEnabled(Boolean(els.markdownInput.value.trim()));
      }, 300)
    );

    // Tab inserts two spaces instead of leaving the editor
    els.markdownInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = els.markdownInput;
      els.markdownInput.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      els.markdownInput.selectionStart = selectionStart + 2;
      els.markdownInput.selectionEnd = selectionStart + 2;
    });

    els.showRaw?.addEventListener('change', () => {
      const showEditor = els.showRaw.checked;
      els.editorPane?.classList.toggle('hidden', !showEditor);
      els.splitResizer?.classList.toggle('hidden', !showEditor);
      els.editorStats?.classList.toggle('hidden', !showEditor);
    });
  }

  // ========================================
  // Split resizer
  // ========================================
  function setupResizer() {
    const resizer = els.splitResizer;
    const container = els.splitContainer;
    if (!resizer || !container) return;

    const isVertical = () => container.classList.contains('layout-vertical');
    const clamp = (value) => Math.min(MAX_PANE_PERCENT, Math.max(MIN_PANE_PERCENT, value));

    const applyPercent = (percent) => {
      const safe = clamp(percent);
      container.style.setProperty('--editor-flex', `${safe}%`);
      return safe;
    };

    const currentPercent = () => {
      const raw = parseFloat(
        container.style.getPropertyValue('--editor-flex') || String(MIN_PANE_PERCENT)
      );
      return Number.isFinite(raw) ? raw : 50;
    };

    const stored = parseFloat(storage.get(SPLIT_STORAGE_KEY, ''));
    applyPercent(Number.isFinite(stored) ? stored : 50);

    let dragging = false;

    const move = (event) => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const total = isVertical() ? rect.height : rect.width;
      if (!total) return;
      const offset = isVertical()
        ? event.clientY - rect.top
        : event.clientX - rect.left;
      applyPercent((offset / total) * 100);
    };

    const stop = () => {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('is-active');
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      storage.set(SPLIT_STORAGE_KEY, String(currentPercent()));
    };

    resizer.addEventListener('pointerdown', (event) => {
      dragging = true;
      resizer.classList.add('is-active');
      document.body.style.setProperty('cursor', isVertical() ? 'row-resize' : 'col-resize');
      document.body.style.setProperty('user-select', 'none');
      if (event.pointerId !== undefined && resizer.setPointerCapture) {
        resizer.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    });

    resizer.addEventListener('pointermove', move);
    resizer.addEventListener('pointerup', stop);
    resizer.addEventListener('pointercancel', stop);

    resizer.addEventListener('keydown', (event) => {
      const decrease = isVertical() ? 'ArrowUp' : 'ArrowLeft';
      const increase = isVertical() ? 'ArrowDown' : 'ArrowRight';

      if (event.key === decrease) {
        event.preventDefault();
        applyPercent(currentPercent() - 2);
        storage.set(SPLIT_STORAGE_KEY, String(currentPercent()));
      } else if (event.key === increase) {
        event.preventDefault();
        applyPercent(currentPercent() + 2);
        storage.set(SPLIT_STORAGE_KEY, String(currentPercent()));
      } else if (event.key === 'Home') {
        event.preventDefault();
        applyPercent(MIN_PANE_PERCENT);
        storage.set(SPLIT_STORAGE_KEY, String(currentPercent()));
      } else if (event.key === 'End') {
        event.preventDefault();
        applyPercent(MAX_PANE_PERCENT);
        storage.set(SPLIT_STORAGE_KEY, String(currentPercent()));
      }
    });
  }

  function setupLayoutToggle() {
    els.layoutToggle?.addEventListener('change', () => {
      els.splitContainer?.classList.toggle('layout-vertical', els.layoutToggle.checked);
    });
  }

  // ========================================
  // PDF generation
  // ========================================
  async function generatePDF() {
    if (isDownloading || !currentMarkdown.trim()) return;

    isDownloading = true;
    const title = extractTitle(currentMarkdown) || 'document';
    showLoading(true);
    setDownloadEnabled(false);
    setProgress(12);

    const progressTimer = setInterval(() => {
      setProgress(Math.min(88, Number(els.loadingBar?.style.width.replace('%', '')) || 12) + 4);
    }, 320);

    try {
      const source = els.renderedContent;

      source.querySelectorAll('.mermaid svg').forEach((svg) => {
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      });

      setProgress(30);

      const images = Array.from(source.querySelectorAll('img'));
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 5000);
            })
        )
      );

      setProgress(52);

      await html2pdf()
        .set({
          ...CONFIG.pdf,
          filename: `${title}.pdf`,
          jsPDF: { ...CONFIG.pdf.jsPDF }
        })
        .from(source)
        .save();

      clearInterval(progressTimer);
      setProgress(100);
      toastSuccess('toastSuccess');
    } catch (err) {
      console.error('PDF generation error:', err);
      clearInterval(progressTimer);
      toastError('toastError');
      showToast(`${t('toastErrorGeneric')}${err.message}`, 'error');
    } finally {
      isDownloading = false;
      showLoading(false);
      setDownloadEnabled(Boolean(currentMarkdown.trim()));
    }
  }

  // ========================================
  // Ambient background particles
  // ========================================
  function setupParticles() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let motes = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.min(64, Math.round((width * height) / 22000));
      motes = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.4,
        speed: Math.random() * 0.16 + 0.04,
        drift: (Math.random() - 0.5) * 0.12,
        alpha: Math.random() * 0.35 + 0.08
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      motes.forEach((mote) => {
        mote.y -= mote.speed;
        mote.x += mote.drift;
        if (mote.y < -4) {
          mote.y = height + 4;
          mote.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 213, 168, ${mote.alpha})`;
        ctx.fill();
      });
    };

    resize();
    draw();

    if (reduced) return;

    let frame = 0;
    const loop = () => {
      draw();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else {
        frame = window.requestAnimationFrame(loop);
      }
    });

    window.addEventListener('resize', debounce(resize, 200));
  }

  // ========================================
  // Shortcuts
  // ========================================
  function setupShortcuts() {
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (isEditorOpen()) generatePDF();
        return;
      }

      if (event.key === 'Escape' && isEditorOpen() && !window.I18N.isSelectorOpen()) {
        goHome();
      }
    });
  }

  // ========================================
  // Initialize
  // ========================================
  function cacheElements() {
    const ids = [
      'landingView',
      'editorView',
      'dropZone',
      'fileInput',
      'dragOverlay',
      'homeBtn',
      'docTitle',
      'fileBadge',
      'layoutToggle',
      'downloadPdf',
      'splitContainer',
      'editorPane',
      'splitResizer',
      'previewPane',
      'markdownInput',
      'charCount',
      'lineCount',
      'wordCount',
      'editorStats',
      'showRaw',
      'previewContent',
      'renderedContent',
      'previewPlaceholder',
      'loadingOverlay',
      'loadingBar',
      'toastContainer'
    ];

    ids.forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function init() {
    cacheElements();

    // Paint translations, then wire the selector
    window.I18N.apply();
    window.I18N.setupSelector();

    setupFileInput();
    setupEditor();
    setupResizer();
    setupLayoutToggle();
    setupParticles();
    setupShortcuts();

    els.homeBtn?.addEventListener('click', goHome);
    els.downloadPdf?.addEventListener('click', generatePDF);

    // Re-translate anything that is generated at runtime
    window.I18N.onChange(() => {
      updateDocMeta();
      updateStats();
      updatePlaceholder();
    });

    updateStats();
    updateDocMeta();
    updatePlaceholder();
    setDownloadEnabled(false);
  }

  window.I18N.ready(init);
})();