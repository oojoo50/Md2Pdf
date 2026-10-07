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

      // The display face is a webfont; capturing before it loads would bake
      // fallback glyphs into the PDF.
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

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
  // Ambient background
  // A looping scene that demonstrates the product: Markdown glyphs stream in
  // from the left, converge on the document, and resolve into a typeset A4
  // sheet on the right. Layers parallax against the pointer.
  // ========================================
  const bg = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    pointerInside: false,
    motes: [],
    glyphs: [],
page: null,
  compositionEnabled: true,
  frame: 0,
    startedAt: 0,
    reducedMotion: false
  };

  const GLYPH_POOL = [
    '#', '##', '**', '*', '$', '$$', '`', '```', '- [ ]', '[a](b)',
    '|', '>|', '---', '1.', '>', '=>', '~~~', '[^1]', 'x^2'
  ];

  const MONO = '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace';
  const CYCLE_MS = 15000;
  const COMPOSITION_MIN_WIDTH = 720;

  // roundRect is Chrome 99+/Safari 16+; the project supports Safari 14
  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function pageGeometry() {
    const sheetWidth = Math.max(148, Math.min(bg.width * 0.17, 232));
    return {
      x: bg.width - sheetWidth - Math.max(28, bg.width * 0.045),
      y: Math.max(24, bg.height * 0.12),
      width: sheetWidth,
      height: sheetWidth * 1.414
    };
  }

  function buildMotes() {
    const density = Math.min(70, Math.round((bg.width * bg.height) / 20000));
    bg.motes = Array.from({ length: density }, () => ({
      x: Math.random() * bg.width,
      y: Math.random() * bg.height,
      radius: Math.random() * 1.4 + 0.4,
      rise: Math.random() * 0.18 + 0.05,
      sway: (Math.random() - 0.5) * 0.14,
      alpha: Math.random() * 0.3 + 0.07
    }));
  }

  function buildGlyphs() {
    // The glyph stream and the sheet are one idea; below this width there is
    // no room to read either, so mobile keeps only the motes.
    bg.compositionEnabled = bg.width >= COMPOSITION_MIN_WIDTH;
    const count = bg.compositionEnabled
      ? Math.round(Math.min(20, bg.width / 90))
      : 0;
    bg.glyphs = Array.from({ length: count }, (_, index) => ({
      text: GLYPH_POOL[index % GLYPH_POOL.length],
      // Stagger the start so the stream does not pulse in lockstep
      offset: Math.random(),
      lane: Math.random(),
      size: Math.random() * 5 + 11,
      sway: Math.random() * 6 + 3,
      drift: Math.random() * 0.06 + 0.03
    }));
  }

  function resizeBackground() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    bg.width = window.innerWidth;
    bg.height = window.innerHeight;
    bg.canvas.width = Math.floor(bg.width * dpr);
    bg.canvas.height = Math.floor(bg.height * dpr);
    bg.canvas.style.width = `${bg.width}px`;
    bg.canvas.style.height = `${bg.height}px`;
    bg.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildMotes();
    buildGlyphs();
  }

  function drawMotes() {
    const ctx = bg.ctx;
    bg.motes.forEach((mote) => {
      mote.y -= mote.rise;
      mote.x += mote.sway;
      if (mote.y < -6) {
        mote.y = bg.height + 6;
        mote.x = Math.random() * bg.width;
      }
      if (mote.x < -6) mote.x = bg.width + 6;
      if (mote.x > bg.width + 6) mote.x = -6;

      const driftX = bg.pointerX * 5;
      const driftY = bg.pointerY * 5;
      ctx.beginPath();
      ctx.arc(mote.x + driftX, mote.y + driftY, mote.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 135, 78, ${mote.alpha})`;
      ctx.fill();
    });
  }

  function drawGlyphStream(cycle) {
    if (!bg.glyphs.length) return;
    const ctx = bg.ctx;
    const page = bg.page;
    const depthX = bg.pointerX * 15;
    const depthY = bg.pointerY * 15;

    ctx.textBaseline = 'middle';

    bg.glyphs.forEach((glyph) => {
      // 0 -> 1 over the first 78% of the cycle, then hand off to the sheet
      const travel = (cycle + glyph.offset) / 1.28;
      if (travel > 1) return;

      const eased = travel * travel * (3 - 2 * travel);
      const startX = -40;
      const endX = page.x + page.width * (0.2 + glyph.lane * 0.6);
      const startY = bg.height * (0.18 + glyph.lane * 0.66);
      const endY = page.y + page.height * (0.12 + (1 - glyph.lane) * 0.78);

      const x = startX + (endX - startX) * eased;
      const baseY = startY + (endY - startY) * eased;
      const y = baseY + Math.sin(travel * 9 + glyph.offset * 12) * glyph.sway;
      const alpha = Math.sin(Math.min(1, travel) * Math.PI) * 0.5;

      ctx.save();
      ctx.translate(x + depthX, y + depthY);
      ctx.rotate(travel * 0.22 * (glyph.lane - 0.5) + bg.pointerX * 0.05);
      ctx.font = `${glyph.size}px ${MONO}`;
      ctx.fillStyle = `rgba(125, 95, 40, ${alpha.toFixed(3)})`;
      ctx.fillText(glyph.text, 0, 0);
      ctx.restore();
    });
  }

  function drawSheet(cycle) {
    if (!bg.compositionEnabled) return;
    const ctx = bg.ctx;
    const page = bg.page;
    const depthX = -bg.pointerX * 26;
    const depthY = -bg.pointerY * 18;

    // Content fills in as the glyphs arrive: 0.42 -> 0.96 of the cycle
    const build = Math.max(0, Math.min(1, (cycle - 0.42) / 0.54));
    const fade = cycle < 0.88 ? 1 : Math.max(0, (1 - cycle) / 0.12);
    if (fade <= 0) return;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(page.x + depthX, page.y + depthY);
    ctx.transform(1, 0, bg.pointerX * -0.02, 1, 0, 0);

    // Paper
    ctx.shadowColor = 'rgba(35, 28, 15, 0.16)';
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    roundedRect(ctx, 0, 0, page.width, page.height, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(35, 30, 18, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Folded corner — the "this became a document" cue
    ctx.beginPath();
    ctx.moveTo(page.width - 26, 0);
    ctx.lineTo(page.width, 26);
    ctx.closePath();
    ctx.fillStyle = 'rgba(243, 239, 230, 0.95)';
    ctx.fill();

    const pad = page.width * 0.13;
    const inner = page.width - pad * 2;
    let cursor = pad;

    const bar = (y, w, h, color) => {
      if (build < 0.05) return;
      ctx.fillStyle = color;
      roundedRect(ctx, pad, y, Math.max(2, inner * w * build), h, h / 2);
      ctx.fill();
    };

    // Title, then a gold rule beneath it
    bar(cursor, 0.72, page.width * 0.055, 'rgba(23, 21, 15, 0.82)');
    cursor += page.width * 0.1;
    bar(cursor, 1, 1, 'rgba(168, 135, 78, 0.9)');
    cursor += page.width * 0.075;

    // Body copy
    const lines = [1, 0.94, 0.98, 0.7, 0.96, 0.62];
    const lineHeight = page.height * 0.031;
    lines.forEach((lineWidth, index) => {
      if (index / lines.length > build) return;
      bar(cursor, lineWidth, 3.4, 'rgba(35, 30, 18, 0.2)');
      cursor += lineHeight;
    });

    // Bar chart: the KaTeX / data payload
    if (build > 0.5) {
      const chartBase = cursor + page.height * 0.03;
      const chartHeight = page.height * 0.085;
      const bars = [0.45, 0.78, 0.6, 0.95, 0.7];
      const barWidth = inner / (bars.length * 1.7);
      const gap = (inner - barWidth * bars.length) / (bars.length - 1);
      const grow = Math.min(1, (build - 0.5) / 0.32);

      bars.forEach((value, index) => {
        const height = chartHeight * value * grow;
        const x = pad + index * (barWidth + gap);
        ctx.fillStyle =
          index === 3 ? 'rgba(168, 135, 78, 0.85)' : 'rgba(35, 30, 18, 0.16)';
        roundedRect(ctx, x, chartBase + chartHeight - height, barWidth, height, 2);
        ctx.fill();
      });
      cursor = chartBase + chartHeight;
    }

    // Node graph: the Mermaid diagram, drawing itself
    if (build > 0.68) {
      const draw = Math.min(1, (build - 0.68) / 0.3);
      const originX = pad;
      const originY = cursor + page.height * 0.075;
      const nodes = [
        { x: 0, y: 0 },
        { x: inner * 0.45, y: -page.height * 0.035 },
        { x: inner * 0.92, y: page.height * 0.012 }
      ];

      ctx.strokeStyle = 'rgba(168, 135, 78, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originX + nodes[0].x + 4, originY + nodes[0].y);
      for (let i = 1; i < nodes.length; i += 1) {
        const previous = nodes[i - 1];
        const target = nodes[i];
        const midX = originX + (previous.x + target.x) / 2;
        ctx.moveTo(originX + previous.x + 4, originY + previous.y);
        ctx.lineTo(midX, originY + previous.y + (target.y - previous.y) * draw);
        ctx.lineTo(originX + target.x + 4, originY + target.y * draw);
      }
      ctx.stroke();

      nodes.forEach((node, index) => {
        const size = index === 2 ? 5.5 : 4.5;
        ctx.beginPath();
        ctx.arc(
          originX + node.x + 4,
          originY + node.y * draw,
          size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle =
          index === 2 ? 'rgba(168, 135, 78, 0.95)' : 'rgba(35, 30, 18, 0.3)';
        ctx.fill();
      });
    }

    ctx.restore();
  }

  function drawCursorGlow() {
    if (!bg.pointerInside) return;
    const ctx = bg.ctx;
    const radius = Math.max(140, Math.min(bg.width, bg.height) * 0.28);
    const glow = ctx.createRadialGradient(
      bg.pointerX * 22 + bg.width / 2,
      bg.pointerY * 18 + bg.height / 2,
      0,
      bg.pointerX * 22 + bg.width / 2,
      bg.pointerY * 18 + bg.height / 2,
      radius
    );
    glow.addColorStop(0, 'rgba(200, 169, 106, 0.1)');
    glow.addColorStop(1, 'rgba(200, 169, 106, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, bg.width, bg.height);
  }

  function softenCentre() {
    const ctx = bg.ctx;
    const centreX = bg.width / 2;
    const centreY = bg.height * 0.44;
    const radius = Math.min(bg.width, bg.height) * 0.52;
    const mask = ctx.createRadialGradient(centreX, centreY, 0, centreX, centreY, radius);
    mask.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
    mask.addColorStop(0.58, 'rgba(0, 0, 0, 0.34)');
    mask.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, bg.width, bg.height);
    ctx.restore();
  }

  function renderBackground() {
    const ctx = bg.ctx;
    ctx.clearRect(0, 0, bg.width, bg.height);

    const cycle = bg.reducedMotion
      ? 0.72
      : ((performance.now() - bg.startedAt) % CYCLE_MS) / CYCLE_MS;

    drawMotes();
    if (!bg.reducedMotion || cycle > 0) {
      drawCursorGlow();
      drawGlyphStream(cycle);
      drawSheet(cycle);
      softenCentre();
    }
  }

  function setupBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    bg.canvas = canvas;
    bg.ctx = ctx;
    bg.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bg.startedAt = performance.now();
    bg.page = pageGeometry();

    resizeBackground();
    renderBackground();

    if (bg.reducedMotion) return;

    const advancePointer = () => {
      bg.pointerX += (bg.targetX - bg.pointerX) * 0.06;
      bg.pointerY += (bg.targetY - bg.pointerY) * 0.06;
    };

    const loop = () => {
      advancePointer();
      bg.page = pageGeometry();
      // The scene belongs to the landing page; idle elsewhere
      if (!els.landingView || !els.landingView.classList.contains('hidden')) {
        renderBackground();
      }
      bg.frame = window.requestAnimationFrame(loop);
    };
    bg.frame = window.requestAnimationFrame(loop);

    window.addEventListener('pointermove', (event) => {
      bg.pointerInside = true;
      bg.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      bg.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      bg.pointerInside = false;
      bg.targetX = 0;
      bg.targetY = 0;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.cancelAnimationFrame(bg.frame);
      } else {
        bg.startedAt = performance.now();
        bg.frame = window.requestAnimationFrame(loop);
      }
    });

    window.addEventListener('resize', debounce(() => {
      resizeBackground();
      bg.page = pageGeometry();
    }, 200));
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
    setupBackground();
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