/**
 * HTML Lab Editor (ورشة HTML)
 * Self-contained editor with HTML/CSS/JS workshops,
 * syntax highlighting, and live preview.
 */
document.addEventListener('DOMContentLoaded', () => {
  const htmlEditor = document.getElementById('htmlEditor');
  const htmlHighlight = document.getElementById('htmlHighlight');
  const cssEditor = document.getElementById('cssEditor');
  const cssHighlight = document.getElementById('cssHighlight');
  const jsEditor = document.getElementById('jsEditor');
  const jsHighlight = document.getElementById('jsHighlight');
  const htmlPreviewFrame = document.getElementById('htmlPreviewFrame');
  const runPreviewBtn = document.getElementById('runPreviewBtn') || document.getElementById('runHtmlPreviewBtn');
  const resetActiveEditorBtn = document.getElementById('resetActiveEditorBtn') || document.getElementById('resetHtmlEditorBtn');

  if (!htmlEditor || !htmlPreviewFrame) return;

  /* ── Helpers ────────────────────────────────── */
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /* ── Default Templates ─────────────────────── */
  const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تجربتي</title>
  </head>
  <body>
    <div class="card">
      <h1>مرحبا بك في المخبر</h1>
      <p>جرّب HTML + CSS + JavaScript معاً.</p>
      <button id="btn">اضغطني</button>
      <p class="hint">افتح ورشة JavaScript لإضافة تفاعل.</p>
    </div>
  </body>
</html>`;

  const defaultCssTemplate = `:root { color-scheme: light; }
body { font-family: Tahoma, sans-serif; padding: 22px; background: #f8fafc; color: #0f172a; }
.card { max-width: 720px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 18px 14px; box-shadow: 0 10px 25px rgba(2, 6, 23, 0.08); }
h1 { margin: 0 0 8px; color: #4f46e5; }
p { margin: 0 0 10px; color: #334155; line-height: 1.8; }
.hint { color: #64748b; font-size: 14px; }
button { border: none; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 700; }
button:hover { filter: brightness(1.04); transform: translateY(-1px); }`;

  const defaultJsTemplate = `const btn = document.getElementById('btn');
if (btn) {
  btn.addEventListener('click', () => {
    btn.textContent = 'تم!';
    btn.style.transform = 'scale(1.03)';
    setTimeout(() => (btn.style.transform = ''), 150);
  });
}`;

  /* ── Lab State ──────────────────────────────── */
  const stateLab = {
    activeWorkshop: 'html' // html | css | js
  };

  const getActiveEditor = () => {
    if (stateLab.activeWorkshop === 'css') return cssEditor;
    if (stateLab.activeWorkshop === 'js') return jsEditor;
    return htmlEditor;
  };

  const getActiveHighlight = () => {
    if (stateLab.activeWorkshop === 'css') return cssHighlight;
    if (stateLab.activeWorkshop === 'js') return jsHighlight;
    return htmlHighlight;
  };

  const getDefaultsByWorkshop = (workshop) => {
    if (workshop === 'css') return defaultCssTemplate;
    if (workshop === 'js') return defaultJsTemplate;
    return defaultHtmlTemplate;
  };

  /* ── Preview Composition ───────────────────── */
  const composeSrcDoc = () => {
    const html = htmlEditor?.value ?? '';
    const css = cssEditor?.value ?? '';
    const js = jsEditor?.value ?? '';

    // Inject CSS/JS without forcing the user to write <style>/<script>
    return `<!DOCTYPE html>
${html}
<!-- injected by lab -->
<style>${css}</style>
<script>
try {
${js}
} catch (e) {
  const pre = document.createElement('pre');
  pre.style.cssText = 'background:#0f172a;color:#e2e8f0;padding:12px;border-radius:12px;max-width:820px;margin:18px auto;white-space:pre-wrap;direction:ltr;text-align:left;';
  pre.textContent = 'JS Error: ' + (e && e.message ? e.message : String(e));
  document.body.appendChild(pre);
}
<\/script>`;
  };

  const flashPreview = () => {
    const frame = htmlPreviewFrame;
    if (!frame) return;
    frame.classList.remove('is-updated');
    void frame.offsetWidth;
    frame.classList.add('is-updated');
  };

  const renderPreview = (opts = { flash: false }) => {
    htmlPreviewFrame.srcdoc = composeSrcDoc();
    if (opts.flash) flashPreview();
  };

  /* ── Syntax Highlighting ───────────────────── */
  function highlightHtmlCode(code) {
    let escaped = escapeHtml(code);

    escaped = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
      return `<span class="code-token-comment">${match}</span>`;
    });

    escaped = escaped.replace(/&lt;!DOCTYPE[\s\S]*?&gt;/gi, (match) => {
      return `<span class="code-token-doctype">${match}</span>`;
    });

    escaped = escaped.replace(/(&lt;\/?)([a-zA-Z][\w:-]*)([^&]*?)(\/?\&gt;)/g, (_, open, tag, attrs, close) => {
      const safeAttrs = attrs.replace(/([a-zA-Z_:][\w:.-]*)(\s*=\s*)(".*?"|'.*?')/g, (m, name, eq, value) => {
        return `<span class="code-token-attr">${name}</span>${eq}<span class="code-token-value">${value}</span>`;
      });

      return `${open}<span class="code-token-tag">${tag}</span>${safeAttrs}${close}`;
    });

    return escaped;
  }

  function highlightCssCode(code) {
    let escaped = escapeHtml(code);

    // Comments /* ... */
    escaped = escaped.replace(/\/\*[\s\S]*?\*\//g, (m) => `<span class="code-token-comment">${m}</span>`);
    // Strings
    escaped = escaped.replace(/(".*?"|'.*?')/g, (m) => `<span class="code-token-value">${m}</span>`);
    // Selectors (very light)
    escaped = escaped.replace(/^([^{]+)(\{)/gm, (m, sel, brace) => {
      return `<span class="code-token-tag">${sel.trim()}</span> ${brace}`;
    });
    // Properties: name:
    escaped = escaped.replace(/(^|\s)([a-zA-Z-]+)(\s*:)/g, (m, pre, name, colon) => {
      return `${pre}<span class="code-token-attr">${name}</span>${colon}`;
    });

    return escaped;
  }

  function highlightJsCode(code) {
    let escaped = escapeHtml(code);

    // Comments
    escaped = escaped.replace(/\/\/.*$/gm, (m) => `<span class="code-token-comment">${m}</span>`);
    escaped = escaped.replace(/\/\*[\s\S]*?\*\//g, (m) => `<span class="code-token-comment">${m}</span>`);
    // Strings
    escaped = escaped.replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, (m) => `<span class="code-token-value">${m}</span>`);
    // Keywords
    escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|try|catch|new|class|async|await)\b/g, (m) => {
      return `<span class="code-token-doctype">${m}</span>`;
    });

    return escaped;
  }

  const highlightByWorkshop = (workshop, code) => {
    if (workshop === 'css') return highlightCssCode(code);
    if (workshop === 'js') return highlightJsCode(code);
    return highlightHtmlCode(code);
  };

  const renderHighlight = (workshop = stateLab.activeWorkshop) => {
    const editor = workshop === 'css' ? cssEditor : workshop === 'js' ? jsEditor : htmlEditor;
    const highlight = workshop === 'css' ? cssHighlight : workshop === 'js' ? jsHighlight : htmlHighlight;
    if (!editor || !highlight) return;
    highlight.innerHTML = `${highlightByWorkshop(workshop, editor.value)}\n`;
  };

  const syncScroll = () => {
    const editor = getActiveEditor();
    const highlight = getActiveHighlight();
    if (!editor || !highlight) return;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  };

  const renderAll = (opts = { flash: false }) => {
    renderPreview(opts);
    renderHighlight('html');
    renderHighlight('css');
    renderHighlight('js');
    syncScroll();
  };

  /* ── Editor Key Handlers ───────────────────── */
  function handleCodeEditorKeydown(e) {
    const textarea = e.target;
    if (!(textarea instanceof HTMLTextAreaElement)) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      const tab = '  ';
      textarea.value = textarea.value.substring(0, start) + tab + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + tab.length;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function handleHtmlEditorKeydown(e) {
    if (!htmlEditor) return;

    const textarea = htmlEditor;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // دعم زر Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const tab = '  '; // مسافتين
      textarea.value = textarea.value.substring(0, start) + tab + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + tab.length;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // دعم زر Enter مع الإزاحة التلقائية (Auto-indent)
    if (e.key === 'Enter') {
      e.preventDefault();
      const beforeCursor = textarea.value.substring(0, start);
      const afterCursor = textarea.value.substring(end);

      // إيجاد بداية السطر الحالي
      const lastNewLineIndex = beforeCursor.lastIndexOf('\n');
      const currentLine = beforeCursor.substring(lastNewLineIndex + 1);

      // حساب المسافات البادئة للسطر الحالي
      const match = currentLine.match(/^\s*/);
      let indentation = match ? match[0] : '';

      // إذا كان السطر ينتهي بوسم فتح، أضف مسافة بادئة إضافية
      if (currentLine.trim().endsWith('>') && !currentLine.trim().match(/<\/[^>]+>$/) && !currentLine.trim().endsWith('/>')) {
        indentation += '  ';

        // إضافة سطر جديد آخر للإغلاق إذا كان المؤشر بين وسمين
        if (afterCursor.trim().startsWith('</')) {
          const insertion = '\n' + indentation;
          const closingIndentation = match ? match[0] : '';
          textarea.value = beforeCursor + insertion + '\n' + closingIndentation + afterCursor;
          textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }

      const insertion = '\n' + indentation;
      textarea.value = beforeCursor + insertion + afterCursor;
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // دعم الإغلاق التلقائي للوسوم (>)
    if (e.key === '>') {
      if (start !== end) return;

      const beforeCursor = textarea.value.slice(0, start);
      const afterCursor = textarea.value.slice(start);
      const openingTagMatch = beforeCursor.match(/<([a-zA-Z][\w:-]*)([^<>]*)$/);

      if (!openingTagMatch) return;
      if (openingTagMatch[0].startsWith('</')) return;
      if (openingTagMatch[2].trim().endsWith('/')) return;

      const tagName = openingTagMatch[1].toLowerCase();
      const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
      if (voidTags.includes(tagName)) return;

      e.preventDefault();
      const insertion = `></${tagName}>`;
      textarea.value = `${beforeCursor}${insertion}${afterCursor}`;
      const cursorPos = start + 1;
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /* ── Defaults ──────────────────────────────── */
  if (htmlEditor && !htmlEditor.value.trim()) htmlEditor.value = defaultHtmlTemplate;
  if (cssEditor && !cssEditor.value.trim()) cssEditor.value = defaultCssTemplate;
  if (jsEditor && !jsEditor.value.trim()) jsEditor.value = defaultJsTemplate;

  /* ── Tabs Logic ────────────────────────────── */
  const tabs = Array.from(document.querySelectorAll('.workshop-tab'));
  const panels = Array.from(document.querySelectorAll('.workshop-panel'));

  const setActiveWorkshop = (workshop) => {
    stateLab.activeWorkshop = workshop;

    tabs.forEach(t => {
      const isActive = t.dataset.workshop === workshop;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
      t.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(p => {
      const isActive = p.dataset.panel === workshop;
      p.classList.toggle('is-active', isActive);
      p.hidden = !isActive;
    });

    syncScroll();
    const editor = getActiveEditor();
    if (editor) editor.focus();
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveWorkshop(tab.dataset.workshop));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const idx = tabs.indexOf(tab);
      const next = e.key === 'ArrowLeft'
        ? tabs[Math.min(tabs.length - 1, idx + 1)]
        : tabs[Math.max(0, idx - 1)];
      next?.click();
    });
  });

  /* ── Run + Reset Buttons ───────────────────── */
  runPreviewBtn?.addEventListener('click', () => {
    const btn = runPreviewBtn;
    const icon = btn?.querySelector('i');
    const previousIconClass = icon?.className;

    if (btn) btn.classList.add('is-busy');
    if (icon) icon.className = 'ph ph-circle-notch';

    renderAll({ flash: true });

    window.setTimeout(() => {
      if (btn) btn.classList.remove('is-busy');
      if (icon && previousIconClass) icon.className = previousIconClass;
    }, 450);
  });

  resetActiveEditorBtn?.addEventListener('click', () => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.value = getDefaultsByWorkshop(stateLab.activeWorkshop);
    renderAll({ flash: true });
  });

  /* ── Live Updates + Scroll Sync ────────────── */
  const bindEditor = (workshop, editor) => {
    if (!editor) return;
    editor.addEventListener('input', () => renderAll());
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('keydown', (e) => {
      // helpers for HTML only (tab + indent + closing tags)
      if (workshop === 'html') handleHtmlEditorKeydown(e);
      else handleCodeEditorKeydown(e);
    });
  };

  bindEditor('html', htmlEditor);
  bindEditor('css', cssEditor);
  bindEditor('js', jsEditor);

  /* ── Init ───────────────────────────────────── */
  setActiveWorkshop('html');
  renderAll({ flash: true });
});
