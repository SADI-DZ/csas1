// HTML Editor Module


const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحتي الأولى</title>
</head>
<body>
    <h1>مرحباً بك في عالم الويب!</h1>
    <p>هذه صفحتك الأولى في HTML</p>
</body>
</html>`;

function initHtmlLab() {
    if (!elements.htmlEditor || !elements.htmlPreviewFrame) return;

    const autocompleteBox = elements.htmlAutocomplete;
    const htmlTags = [
        'html', 'head', 'body', 'title', 'meta', 'link', 'style', 'script', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'p', 'a', 'ul', 'ol', 'li', 'img', 'table', 'tr', 'td', 'th', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'main', 'form', 'input', 'button', 'label', 'textarea', 'select', 'option', 'br', 'hr'
    ];
    const htmlAttrs = [
        'class', 'id', 'src', 'href', 'alt', 'title', 'style', 'type', 'rel', 'name', 'value', 'placeholder', 'disabled', 'checked', 'readonly', 'required', 'width', 'height', 'lang', 'dir', 'content', 'charset', 'data-', 'aria-label', 'aria-hidden'
    ];

    let currentSuggestions = [];
    let currentContext = null;
    let activeSuggestionIndex = 0;

    const composeSrcDoc = () => {
        return elements.htmlEditor.value || defaultHtmlTemplate;
    };

    const flashPreview = () => {
        const frame = elements.htmlPreviewFrame;
        if (!frame) return;
        frame.classList.remove('is-updated');
        void frame.offsetWidth;
        frame.classList.add('is-updated');
    };

    const renderPreview = (opts = { flash: false }) => {
        elements.htmlPreviewFrame.srcdoc = composeSrcDoc();
        if (opts.flash) flashPreview();
    };

    const renderHighlight = () => {
        if (!elements.htmlEditor || !elements.htmlHighlight) return;
        elements.htmlHighlight.innerHTML = `${highlightHtmlCode(elements.htmlEditor.value)}\n`;
    };

    const syncScroll = () => {
        if (!elements.htmlEditor || !elements.htmlHighlight) return;
        elements.htmlHighlight.scrollTop = elements.htmlEditor.scrollTop;
        elements.htmlHighlight.scrollLeft = elements.htmlEditor.scrollLeft;
    };

    const hideAutocomplete = () => {
        if (!autocompleteBox) return;
        autocompleteBox.hidden = true;
        autocompleteBox.classList.remove('visible');
        currentSuggestions = [];
        activeSuggestionIndex = 0;
    };

    const getAutocompleteContext = () => {
        const textarea = elements.htmlEditor;
        const pos = textarea.selectionStart;
        const value = textarea.value.slice(0, pos);
        const lastOpen = value.lastIndexOf('<');
        const lastClose = value.lastIndexOf('>');

        if (lastOpen === -1 || lastClose > lastOpen) return null;
        const afterOpen = value.slice(lastOpen + 1);
        if (afterOpen.startsWith('!--')) return null;

        const closingTagMatch = afterOpen.match(/^\/?([a-zA-Z][\w:-]*)?$/);
        if (closingTagMatch) {
            return {
                type: 'tag',
                prefix: closingTagMatch[1] || '',
                closing: afterOpen.startsWith('/')
            };
        }

        const attrMatch = afterOpen.match(/^[\/]?[a-zA-Z][\w:-]*(?:\s+[\w:-]*)*\s+([a-zA-Z_:][\w:.-]*)?$/);
        if (attrMatch) {
            return {
                type: 'attr',
                prefix: attrMatch[1] || ''
            };
        }

        return null;
    };

    const getSuggestions = (context) => {
        if (!context) return [];

        if (context.type === 'tag') {
            const prefix = context.prefix.toLowerCase();
            return htmlTags.filter(tag => tag.startsWith(prefix)).slice(0, 10).map(tag => ({ label: context.closing ? `/${tag}` : tag, kind: 'tag' }));
        }

        if (context.type === 'attr') {
            const prefix = context.prefix.toLowerCase();
            return htmlAttrs.filter(attr => attr.startsWith(prefix)).slice(0, 10).map(attr => ({ label: attr, kind: 'attr' }));
        }

        return [];
    };

    const renderAutocomplete = (items) => {
        if (!autocompleteBox) return;
        if (!items.length) {
            hideAutocomplete();
            return;
        }

        currentSuggestions = items;
        if (activeSuggestionIndex >= items.length) activeSuggestionIndex = 0;

        autocompleteBox.innerHTML = items.map((item, index) => {
            const activeClass = index === activeSuggestionIndex ? 'is-active' : '';
            return `<button type="button" class="autocomplete-item ${activeClass}" data-index="${index}" data-value="${escapeHtml(item.label)}" data-kind="${item.kind}"><span>${escapeHtml(item.label)}</span><span class="item-kind">${escapeHtml(item.kind)}</span></button>`;
        }).join('');

        autocompleteBox.hidden = false;
        autocompleteBox.classList.add('visible');
    };

    const applySuggestion = (suggestion) => {
        if (!suggestion || !currentContext) return;
        const textarea = elements.htmlEditor;
        const pos = textarea.selectionStart;
        const value = textarea.value;

        if (currentContext.type === 'tag') {
            const openIndex = value.lastIndexOf('<', pos - 1);
            const start = openIndex + 1 + (currentContext.closing ? 1 : 0);
            const before = value.slice(0, start);
            const after = value.slice(pos);
            textarea.value = before + suggestion.label + after;
            const newPos = start + suggestion.label.length;
            textarea.setSelectionRange(newPos, newPos);
        } else if (currentContext.type === 'attr') {
            const prefixStart = pos - currentContext.prefix.length;
            const before = value.slice(0, prefixStart);
            const after = value.slice(pos);
            textarea.value = before + suggestion.label + '=""' + after;
            const newPos = prefixStart + suggestion.label.length + 2;
            textarea.setSelectionRange(newPos, newPos);
        }

        hideAutocomplete();
        textarea.focus();
        renderAll();
    };

    const selectSuggestion = (delta) => {
        if (!currentSuggestions.length) return;
        activeSuggestionIndex = (activeSuggestionIndex + delta + currentSuggestions.length) % currentSuggestions.length;
        renderAutocomplete(currentSuggestions);
    };

    const updateAutocomplete = () => {
        currentContext = getAutocompleteContext();
        if (!currentContext) {
            hideAutocomplete();
            return;
        }

        const suggestions = getSuggestions(currentContext);
        if (!suggestions.length) {
            hideAutocomplete();
            return;
        }

        renderAutocomplete(suggestions);
    };

    if (elements.htmlEditor && !elements.htmlEditor.value.trim()) {
        elements.htmlEditor.value = defaultHtmlTemplate;
    }

    elements.runPreviewBtn?.addEventListener('click', () => {
        const btn = elements.runPreviewBtn;
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

    elements.resetActiveEditorBtn?.addEventListener('click', () => {
        if (!elements.htmlEditor) return;
        elements.htmlEditor.value = defaultHtmlTemplate;
        renderAll({ flash: true });
    });

    if (autocompleteBox) {
        autocompleteBox.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const button = event.target.closest('.autocomplete-item');
            if (!button) return;
            const index = Number(button.dataset.index);
            const suggestion = currentSuggestions[index];
            applySuggestion(suggestion);
        });
    }

    elements.htmlEditor.addEventListener('input', () => {
        renderAll();
    });

    elements.htmlEditor.addEventListener('scroll', syncScroll);
    elements.htmlEditor.addEventListener('blur', () => {
        window.setTimeout(hideAutocomplete, 120);
    });
    elements.htmlEditor.addEventListener('keydown', (e) => {
        if (autocompleteBox && !autocompleteBox.hidden) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectSuggestion(1);
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectSuggestion(-1);
                return;
            }

            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applySuggestion(currentSuggestions[activeSuggestionIndex] || currentSuggestions[0]);
                return;
            }

            if (e.key === 'Escape') {
                hideAutocomplete();
                return;
            }
        }

        handleHtmlEditorKeydown(e);
    });

    const renderAll = (opts = { flash: false }) => {
        renderPreview(opts);
        renderHighlight();
        syncScroll();
        updateAutocomplete();
    };

    renderAll({ flash: true });
}

function highlightHtmlCode(code) {
    let escaped = escapeHtml(code);

    escaped = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
        return `<span class="code-token-comment">${match}</span>`;
    });

    escaped = escaped.replace(/&lt;!DOCTYPE[\s\S]*?&gt;/gi, (match) => {
        return `<span class="code-token-doctype">${match}</span>`;
    });

    escaped = escaped.replace(/(&lt;\/?)([a-zA-Z][\w:-]*)([^&]*?)(\/?&gt;)/g, (_, open, tag, attrs, close) => {
        const safeAttrs = attrs.replace(/([a-zA-Z_:][\w:.-]*)(\s*=\s*)(".*?"|'.*?')/g, (m, name, eq, value) => {
            return `<span class="code-token-attr">${name}</span>${eq}<span class="code-token-value">${value}</span>`;
        });

        return `${open}<span class="code-token-tag">${tag}</span>${safeAttrs}${close}`;
    });

    return escaped;
}

function handleHtmlEditorKeydown(e) {
    if (!elements.htmlEditor) return;

    const textarea = elements.htmlEditor;
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

// window.initHtmlLab = initHtmlLab; // ESM handled via export
window.initHtmlLab = initHtmlLab; // Available globally