/**
 * Markdown to PDF Converter - Client Side
 * Supports: GFM, KaTeX Math, Mermaid Diagrams, Images
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
  marked: {
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false
  },
  mermaid: {
    startOnLoad: false,
    theme: 'default',
    suppressErrorRendering: true,
    securityLevel: 'loose',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
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
    margin: 20,
    filename: 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      logging: false,
      letterRendering: true
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

// ========================================
// DOM Elements
// ========================================
const elements = {
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  browseBtn: document.getElementById('browseBtn'),
  uploadSection: document.getElementById('uploadSection'),
  previewSection: document.getElementById('previewSection'),
  markdownInput: document.getElementById('markdownInput'),
  renderedContent: document.getElementById('renderedContent'),
  showRaw: document.getElementById('showRaw'),
  downloadPdf: document.getElementById('downloadPdf'),
  loading: document.getElementById('loading'),
  toast: document.getElementById('toast')
};

// ========================================
// State
// ========================================
let currentMarkdown = '';
let mermaidInitialized = false;

// ========================================
// Utility Functions
// ========================================
function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');
  setTimeout(() => elements.toast.classList.add('hidden'), 4000);
}

function showLoading(show) {
  elements.loading.classList.toggle('hidden', !show);
}

function setDownloadButtonState(enabled) {
  elements.downloadPdf.disabled = !enabled;
}

function extractTitle(markdown) {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) return match[1].trim().replace(/[<>:"/\\|?*]/g, '').slice(0, 50);
  }
  return `markdown-${new Date().toISOString().split('T')[0]}`;
}

// ========================================
// Markdown Processing Pipeline
// ========================================
async function processMarkdown(markdown) {
  // 1. Parse with marked (GFM)
  let html = marked.parse(markdown, CONFIG.marked);

  // 2. Sanitize HTML (security)
  html = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['mermaid', 'span', 'math', 'semantics', 'annotation', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mrow', 'msub', 'msup', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mfenced', 'mtable', 'mtr', 'mtd', 'mover', 'munder', 'munderover'],
    ADD_ATTR: ['data-*', 'class', 'style', 'xmlns']
  });

  return html;
}

function renderMath(element) {
  try {
    renderMathInElement(element, CONFIG.katex);
  } catch (e) {
    console.warn('KaTeX render error:', e);
  }
}

async function renderMermaid(element) {
  if (!mermaidInitialized) {
    mermaid.initialize(CONFIG.mermaid);
    mermaidInitialized = true;
  }

  const mermaidElements = element.querySelectorAll('.language-mermaid, pre code.language-mermaid, .mermaid');
  
  for (const el of mermaidElements) {
    // Find the actual code content
    let code = '';
    if (el.classList.contains('language-mermaid')) {
      code = el.textContent.trim();
    } else if (el.tagName === 'CODE' && el.classList.contains('language-mermaid')) {
      code = el.textContent.trim();
    } else if (el.classList.contains('mermaid')) {
      code = el.textContent.trim();
    }

    if (!code) continue;

    // Create a unique ID for this diagram
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    try {
      const { svg } = await mermaid.render(id, code);
      
      // Replace the code block with the SVG
      const container = document.createElement('div');
      container.className = 'mermaid';
      container.innerHTML = svg;
      
      // Find parent to replace
      let parent = el.parentElement;
      // If it's a <code> inside <pre>, replace the <pre>
      if (el.tagName === 'CODE' && parent?.tagName === 'PRE') {
        parent = parent.parentElement;
        parent?.replaceWith(container);
      } else {
        el.replaceWith(container);
      }
    } catch (err) {
      console.error('Mermaid render error:', err);
      // Show error in place
      const errorDiv = document.createElement('div');
      errorDiv.className = 'mermaid-error';
      errorDiv.style.cssText = 'color: #ef4444; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; font-family: monospace; font-size: 13px; text-align: left;';
      errorDiv.innerHTML = `<strong>Mermaid Syntax Error:</strong><br>${err.message}`;
      el.replaceWith(errorDiv);
    }
  }
}

async function renderPreview(markdown) {
  currentMarkdown = markdown;
  
  // Update editor
  elements.markdownInput.value = markdown;
  
  // Process and render
  const html = await processMarkdown(markdown);
  elements.renderedContent.innerHTML = html;
  
  // Render math
  renderMath(elements.renderedContent);
  
  // Render mermaid diagrams
  await renderMermaid(elements.renderedContent);
  
  // Enable download
  setDownloadButtonState(true);
}

// ========================================
// PDF Generation
// ========================================
async function generatePDF() {
  const title = extractTitle(currentMarkdown);
  const filename = `${title}.pdf`;
  
  showLoading(true);
  setDownloadButtonState(false);
  
  try {
    const element = elements.renderedContent.cloneNode(true);
    
    // Ensure mermaid SVGs are properly sized for PDF
    element.querySelectorAll('.mermaid svg').forEach(svg => {
      svg.style.maxWidth = '100%';
      svg.style.height = 'auto';
    });
    
    // Ensure images load before PDF generation
    const images = element.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        // Timeout after 5 seconds
        setTimeout(resolve, 5000);
      });
    }));
    
    // Generate PDF using html2pdf
    const opt = {
      ...CONFIG.pdf,
      filename,
      jsPDF: { ...CONFIG.pdf.jsPDF }
    };
    
    // Temporarily show element for html2pdf to capture
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 40px;';
    tempContainer.appendChild(element);
    document.body.appendChild(tempContainer);
    
    await html2pdf().set(opt).from(tempContainer).save();
    
    document.body.removeChild(tempContainer);
    showToast('PDF 다운로드 완료!', 'success');
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('PDF 생성 중 오류가 발생했습니다: ' + err.message, 'error');
  } finally {
    showLoading(false);
    setDownloadButtonState(true);
  }
}

// ========================================
// File Handling
// ========================================
function handleFile(file) {
  if (!file) return;
  
  // Validate file type
  const validTypes = ['.md', '.markdown', '.txt'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!validTypes.includes(ext) && file.type !== 'text/markdown' && file.type !== 'text/plain') {
    showToast('지원하지 않는 파일 형식입니다. .md, .markdown, .txt 파일을 업로드하세요.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    currentMarkdown = content;
    switchToPreview();
    renderPreview(content);
  };
  reader.onerror = () => showToast('파일 읽기 실패', 'error');
  reader.readAsText(file);
}

function switchToPreview() {
  elements.uploadSection.classList.add('hidden');
  elements.previewSection.classList.remove('hidden');
}

// ========================================
// Drag & Drop
// ========================================
function setupDragDrop() {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    elements.dropZone.addEventListener(event, e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  ['dragenter', 'dragover'].forEach(event => {
    elements.dropZone.addEventListener(event, () => elements.dropZone.classList.add('drag-over'));
  });
  
  ['dragleave', 'drop'].forEach(event => {
    elements.dropZone.addEventListener(event, () => elements.dropZone.classList.remove('drag-over'));
  });
  
  elements.dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });
  
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.browseBtn.addEventListener('click', e => {
    e.stopPropagation();
    elements.fileInput.click();
  });
  
  elements.fileInput.addEventListener('change', e => {
    handleFile(e.target.files[0]);
    elements.fileInput.value = '';
  });
}

// ========================================
// Editor Sync (two-way)
// ========================================
function setupEditorSync() {
  let isUpdating = false;
  
  elements.markdownInput.addEventListener('input', debounce(() => {
    if (isUpdating) return;
    currentMarkdown = elements.markdownInput.value;
    renderPreview(currentMarkdown);
  }, 300));
  
  elements.showRaw.addEventListener('change', () => {
    elements.editorPane.classList.toggle('hidden', !elements.showRaw.checked);
    elements.previewPane.style.flex = elements.showRaw.checked ? '1' : '0 0 100%';
  });
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ========================================
// Initialize
// ========================================
function init() {
  setupDragDrop();
  setupEditorSync();
  
  // Download button
  elements.downloadPdf.addEventListener('click', generatePDF);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!elements.previewSection.classList.contains('hidden')) {
        generatePDF();
      }
    }
    if (e.key === 'Escape' && !elements.previewSection.classList.contains('hidden')) {
      elements.previewSection.classList.add('hidden');
      elements.uploadSection.classList.remove('hidden');
      elements.markdownInput.value = '';
      elements.renderedContent.innerHTML = '';
      currentMarkdown = '';
      setDownloadButtonState(false);
    }
  });
  
  console.log('📄 Markdown to PDF Converter ready');
  console.log('Features: GFM, KaTeX Math, Mermaid Diagrams, Images');
  console.log('Shortcut: Ctrl/Cmd+S to download PDF, Esc to go back');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}