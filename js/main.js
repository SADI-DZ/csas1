/* منطق التطبيق الرئيسي */
const elements = {
    contentGrid: document.getElementById('contentGrid'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    emptyState: document.getElementById('emptyState'),
    resultsCount: document.getElementById('resultsCount'),
    themeToggle: document.getElementById('themeToggle'),
    fontToggle: document.getElementById('fontToggle'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    navToggle: document.getElementById('navToggle'),
    navLinks: document.getElementById('primaryNav'),
    modal: document.getElementById('lessonModal'),
    modalClose: document.getElementById('modalClose'),
    modalBody: document.getElementById('modalBody'),
    completedCount: document.getElementById('completedCount'),
    totalCount: document.getElementById('totalCount'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressPercentage: document.getElementById('progressPercentage'),
    modulesSection: document.getElementById('modulesSection'),
    modulesGrid: document.getElementById('modulesGrid'),
    mainContent: document.getElementById('contentWrapper') || document.getElementById('mainContent'),
    moduleTitle: document.getElementById('moduleTitle'),
    navBackBtn: document.getElementById('navBackBtn'),
    htmlEditor: document.getElementById('htmlEditor'),
    htmlHighlight: document.getElementById('htmlHighlight'),
    cssEditor: document.getElementById('cssEditor'),
    cssHighlight: document.getElementById('cssHighlight'),
    jsEditor: document.getElementById('jsEditor'),
    jsHighlight: document.getElementById('jsHighlight'),
    htmlPreviewFrame: document.getElementById('htmlPreviewFrame'),
    // Support multiple page variants (lab.html uses different ids)
    runPreviewBtn: document.getElementById('runPreviewBtn') || document.getElementById('runHtmlPreviewBtn'),
    resetActiveEditorBtn: document.getElementById('resetActiveEditorBtn') || document.getElementById('resetHtmlEditorBtn')
};

const filters = {
    type: document.querySelectorAll('input[name="type"]')
};

const state = {
    allData: [],
    completedItems: JSON.parse(localStorage.getItem('completedItems')) || [],
    lastFocusedElement: null,
    searchDebounceTimer: null,
    currentModule: null,
    view: 'modules' // 'modules' or 'content'
};

const modules = [
    {
        id: 'بيئة التعامل مع الحاسوب',
        name: 'بيئة التعامل مع الحاسوب',
        icon: 'ph-desktop',
        desc: 'تعلم أساسيات الحاسوب، نظام التشغيل، ولوحة التحكم',
        moduleClass: 'module-1'
    },
    {
        id: 'مدخل الى البرمجة',
        name: 'مدخل إلى البرمجة',
        icon: 'ph-code',
        desc: 'المخططات الانسيابية والخوارزميات والبحث المنطقي',
        moduleClass: 'module-2'
    },
    {
        id: 'تقنيات الويب',
        name: 'تقنيات الويب',
        icon: 'ph-globe',
        desc: 'المتصفحات، البريد الإلكتروني، وإنشاء صفحات الويب',
        moduleClass: 'module-3'
    },
    {
        id: 'المكتبية',
        name: 'المكتبية',
        icon: 'ph-file-doc',
        desc: 'معالج النصوص، جداول البيانات، والعروض التقديمية',
        moduleClass: 'module-4'
    }
];

const SEARCH_DEBOUNCE_MS = 300;
const NAVBAR_SCROLL_THRESHOLD = 50;
const CARD_OBSERVER_THRESHOLD = 0.1;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFontSize();
    initData();
    initEventListeners();
    initModal();
    initScrollAnimations();
    initContentProtection();
    initNavbarScroll();
    updateVisitorCounter();
    renderModules();
    const savedSearch = sessionStorage.getItem('lastSearch') || '';
    if (elements.searchInput && savedSearch) elements.searchInput.value = savedSearch;
    const savedModule = sessionStorage.getItem('lastModule');
    if (savedModule) selectModule(savedModule);
    updateGamificationUI();
    initHtmlLab();
});



function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    }
    updateThemeAriaLabel();
}

function initFontSize() {
    const savedFont = localStorage.getItem('fontSize') || 'medium';
    document.documentElement.classList.add(`font-${savedFont}`);
}

function initData() {
    state.allData = normalizeData([...contentData]);
    const totalLessonsEl = document.getElementById('totalLessons');
    if (totalLessonsEl) totalLessonsEl.textContent = String(state.allData.length);
}

function normalizeData(data) {
    return data.map(item => ({
        ...item,
        difficulty: item.difficulty || inferDifficulty(item),
        isReady: item.isReady === true
    }));
}

function inferDifficulty(item) {
    if (item.type === 'exercise') return 'hard';
    if (item.module === 'مدخل الى البرمجة' || item.module === 'تقنيات الويب') return 'medium';
    return 'easy';
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcon(false);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon(true);
    }
    updateThemeAriaLabel();
}

function updateThemeIcon(isDark) {
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) {
        icon.className = isDark ? 'ph ph-sun' : 'ph ph-moon-stars';
    }
}

function updateThemeAriaLabel() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (elements.themeToggle) {
        elements.themeToggle.setAttribute('aria-label', isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي');
    }
}

function toggleFontSize() {
    const currentSize = localStorage.getItem('fontSize') || 'medium';
    let newSize;

    if (currentSize === 'small') newSize = 'medium';
    else if (currentSize === 'medium') newSize = 'large';
    else newSize = 'small';

    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${newSize}`);
    localStorage.setItem('fontSize', newSize);
}

function renderModules() {
    if (!elements.modulesGrid) return;

    // Use DocumentFragment for batch DOM insertion
    const fragment = document.createDocumentFragment();

    modules.forEach((mod) => {
        const moduleItems = state.allData.filter(item => item.module === mod.id);
        const completedInModule = moduleItems.filter(item => state.completedItems.includes(item.id)).length;
        const progress = moduleItems.length > 0 ? Math.round((completedInModule / moduleItems.length) * 100) : 0;

        const card = document.createElement('div');
        card.className = `module-card ${mod.moduleClass}`;
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.onclick = () => selectModule(mod.id);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectModule(mod.id);
            }
        });

        card.innerHTML = `
            <div class="module-icon">
                <i class="ph ${mod.icon}"></i>
            </div>
            <div class="module-content">
                <h3 class="module-title">${mod.name}</h3>
                <p class="module-desc">${mod.desc}</p>
                <div class="module-stats">
                    <div class="module-stat">
                        <span class="module-stat-value">${moduleItems.length}</span>
                        <span class="module-stat-label">درس</span>
                    </div>
                    <div class="module-stat">
                        <span class="module-stat-value">${completedInModule}</span>
                        <span class="module-stat-label">مكتمل</span>
                    </div>
                </div>
            </div>
            <div class="module-progress">
                <div class="module-progress-bar">
                    <div class="module-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        card.dataset.moduleId = mod.id;
        fragment.appendChild(card);
    });

    elements.modulesGrid.innerHTML = '';
    elements.modulesGrid.appendChild(fragment);

    // Reveal animation for newly rendered module cards
    if (typeof observeCards === 'function') {
        observeCards();
    }
}

function selectModule(moduleId) {
    state.currentModule = moduleId;
    state.view = 'content';
    sessionStorage.setItem('lastModule', moduleId);
    if (elements.searchInput) sessionStorage.setItem('lastSearch', elements.searchInput.value || '');
    sessionStorage.setItem('lastScrollY', String(window.scrollY));

    // Update UI
    if (elements.modulesSection) elements.modulesSection.style.display = 'none';
    if (elements.mainContent) elements.mainContent.style.display = 'grid';
    if (elements.navBackBtn) elements.navBackBtn.style.display = 'inline-flex';

    // Update title
    const module = modules.find(m => m.id === moduleId);
    if (elements.moduleTitle && module) {
        elements.moduleTitle.innerHTML = `<i class="ph ${module.icon}"></i><span>${module.name}</span>`;
    }

    // Update progress for this module
    updateModuleProgress();

    // Render content
    filterData();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showModulesView() {
    state.view = 'modules';
    state.currentModule = null;

    // Update UI
    if (elements.modulesSection) elements.modulesSection.style.display = 'block';
    if (elements.mainContent) elements.mainContent.style.display = 'none';
    if (elements.navBackBtn) elements.navBackBtn.style.display = 'none';

    // Refresh modules
    renderModules();

    const lastScrollY = sessionStorage.getItem('lastScrollY');
    if (lastScrollY !== null) {
        window.scrollTo({ top: Number(lastScrollY) || 0, behavior: 'smooth' });
        sessionStorage.removeItem('lastScrollY');
    } else {
        document.getElementById('modulesSection')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateModuleProgress() {
    if (!state.currentModule) return;

    const moduleItems = state.allData.filter(item => item.module === state.currentModule);
    const total = moduleItems.length;
    const completed = moduleItems.filter(item => state.completedItems.includes(item.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (elements.completedCount) elements.completedCount.textContent = completed;
    if (elements.totalCount) elements.totalCount.textContent = total;
    if (elements.progressBarFill) elements.progressBarFill.style.width = `${percentage}%`;
    if (elements.progressPercentage) elements.progressPercentage.textContent = percentage;
}

function initEventListeners() {
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.fontToggle?.addEventListener('click', toggleFontSize);
    elements.navBackBtn?.addEventListener('click', window.showModulesView);

    // Event delegation for content grid and modules grid
    const mainEl = elements.contentGrid || elements.modulesGrid;
    if (mainEl) {
        mainEl.addEventListener('click', handleGridClick);
    }

    elements.searchInput?.addEventListener('input', () => {
        clearTimeout(state.searchDebounceTimer);
        state.searchDebounceTimer = setTimeout(filterData, SEARCH_DEBOUNCE_MS);
    });

    elements.searchBtn?.addEventListener('click', filterData);

    filters.type.forEach(radio => radio.addEventListener('change', filterData));
    elements.resetFiltersBtn?.addEventListener('click', resetFilters);

    initMobileNav();
}

function initHtmlLab() {
    if (!elements.htmlEditor || !elements.htmlPreviewFrame) return;

    const stateLab = {
        activeWorkshop: 'html' // html | css | js
    };

    const getActiveEditor = () => {
        if (stateLab.activeWorkshop === 'css') return elements.cssEditor;
        if (stateLab.activeWorkshop === 'js') return elements.jsEditor;
        return elements.htmlEditor;
    };

    const getActiveHighlight = () => {
        if (stateLab.activeWorkshop === 'css') return elements.cssHighlight;
        if (stateLab.activeWorkshop === 'js') return elements.jsHighlight;
        return elements.htmlHighlight;
    };

    const getDefaultsByWorkshop = (workshop) => {
        if (workshop === 'css') return defaultCssTemplate;
        if (workshop === 'js') return defaultJsTemplate;
        return defaultHtmlTemplate;
    };

    const composeSrcDoc = () => {
        const html = elements.htmlEditor?.value ?? '';
        const css = elements.cssEditor?.value ?? '';
        const js = elements.jsEditor?.value ?? '';

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
</script>`;
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

    const highlightByWorkshop = (workshop, code) => {
        if (workshop === 'css') return highlightCssCode(code);
        if (workshop === 'js') return highlightJsCode(code);
        return highlightHtmlCode(code);
    };

    const renderHighlight = (workshop = stateLab.activeWorkshop) => {
        const editor = workshop === 'css' ? elements.cssEditor : workshop === 'js' ? elements.jsEditor : elements.htmlEditor;
        const highlight = workshop === 'css' ? elements.cssHighlight : workshop === 'js' ? elements.jsHighlight : elements.htmlHighlight;
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

    // Defaults
    if (elements.htmlEditor && !elements.htmlEditor.value.trim()) elements.htmlEditor.value = defaultHtmlTemplate;
    if (elements.cssEditor && !elements.cssEditor.value.trim()) elements.cssEditor.value = defaultCssTemplate;
    if (elements.jsEditor && !elements.jsEditor.value.trim()) elements.jsEditor.value = defaultJsTemplate;

    // Tabs logic
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

    // Run + Reset (active)
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
        const editor = getActiveEditor();
        if (!editor) return;
        editor.value = getDefaultsByWorkshop(stateLab.activeWorkshop);
        renderAll({ flash: true });
    });

    // Live updates + scroll sync + editor helpers
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

    bindEditor('html', elements.htmlEditor);
    bindEditor('css', elements.cssEditor);
    bindEditor('js', elements.jsEditor);

    // Start
    setActiveWorkshop('html');
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

// Event delegation handler for grid interactions
function handleGridClick(e) {
    const target = e.target.closest('[data-action]') || e.target.closest('.module-card');
    if (!target) return;

    if (target.dataset.action === 'open' && target.dataset.id) {
        openModal(parseInt(target.dataset.id, 10));
    } else if (target.dataset.moduleId) {
        selectModule(target.dataset.moduleId);
    }
}

function initMobileNav() {
    if (!elements.navToggle || !elements.navLinks) return;

    elements.navToggle.addEventListener('click', () => {
        const isOpen = elements.navLinks.classList.toggle('is-open');
        elements.navToggle.setAttribute('aria-expanded', String(isOpen));
        elements.navToggle.innerHTML = isOpen
            ? '<i class="ph ph-x"></i>'
            : '<i class="ph ph-list"></i>';
    });

    elements.navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (e) => {
        if (!elements.navLinks.contains(e.target) && !elements.navToggle.contains(e.target)) {
            closeMobileNav();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileNav();
    });
}

function closeMobileNav() {
    elements.navLinks?.classList.remove('is-open');
    if (elements.navToggle) {
        elements.navToggle.setAttribute('aria-expanded', 'false');
        elements.navToggle.innerHTML = '<i class="ph ph-list"></i>';
    }
}

function getActiveFilter(name) {
    const active = document.querySelector(`input[name="${name}"]:checked`);
    return active ? active.value : 'all';
}

function filterData() {
    if (!state.currentModule) return;

    const searchTerm = elements.searchInput?.value.toLowerCase().trim() || '';
    const activeType = getActiveFilter('type');
    const moduleItems = state.allData.filter(item => item.module === state.currentModule);

    const filtered = moduleItems.filter(item => {
        const description = typeof item.description === 'string' ? item.description : '';
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const matchSearch = searchTerm === '' ||
            item.title.toLowerCase().includes(searchTerm) ||
            description.toLowerCase().includes(searchTerm) ||
            tags.some(tag => String(tag).toLowerCase().includes(searchTerm));

        const matchType = activeType === 'all' || item.type === activeType;
        return matchSearch && matchType;
    });

    renderContent(filtered);
    window.dispatchEvent(new CustomEvent('filterRendered'));
}

function resetFilters() {
    if (elements.searchInput) elements.searchInput.value = '';

    document.querySelector('input[name="type"][value="all"]')?.click();

    filterData();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function safeImageUrl(url) {
    if (!url) return 'https://placehold.co/400x250/4f46e5/ffffff?text=صورة';
    const trimmed = String(url).trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') ||
        trimmed.startsWith('assets/') || trimmed.startsWith('./assets/')) {
        return trimmed;
    }
    return 'https://placehold.co/400x250/4f46e5/ffffff?text=صورة';
}

function renderContent(data) {
    if (!elements.contentGrid) return;

    // Cache DOM reference
    const grid = elements.contentGrid;

    if (elements.resultsCount) {
        elements.resultsCount.innerHTML = `<i class="ph ph-sparkle"></i> ${data.length} نتيجة`;
    }

    if (data.length === 0) {
        if (elements.emptyState) elements.emptyState.style.display = 'block';
        grid.innerHTML = '';
        return;
    }

    if (elements.emptyState) elements.emptyState.style.display = 'none';

    // Use DocumentFragment for batch DOM insertion (faster)
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const card = createCardElement(item);
        fragment.appendChild(card);
    });
    grid.innerHTML = '';
    grid.appendChild(fragment);

    // Re-observe new cards for animation
    observeCards();
}

function createCardElement(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = item.id;

    const isCompleted = state.completedItems.includes(item.id);
    if (isCompleted) card.classList.add('completed');

    const typeLabel = item.type === 'lesson' ? 'درس' : 'تمرين';
    const typeClass = item.type === 'lesson' ? 'badge-lesson' : 'badge-exercise';
    const iconClass = item.type === 'lesson' ? 'ph-desktop' : 'ph-code';

    card.innerHTML = `
        <div class="card-image-container">
            <img src="${safeImageUrl(item.image)}" alt="${escapeHtml(item.title)}" 
                 loading="lazy" decoding="async" 
                 onerror="this.src='https://placehold.co/400x250/4f46e5/ffffff?text=صورة'">
            <div class="card-header-overlay">
                <span class="badge ${typeClass}">${typeLabel}</span>
                <div class="badge-completed" title="مكتمل">
                    <i class="ph ph-check"></i>
                </div>
                <div class="card-icon">
                    <i class="ph ${iconClass}"></i>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="card-title-row">
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
            </div>
            <p class="card-desc">${escapeHtml(item.description)}</p>
            <div class="card-meta">
                <span class="meta-item">
                    <i class="ph-fill ph-users"></i>
                    ${escapeHtml(item.level)}
                </span>
            </div>
            <div class="card-status-row">
                ${!item.isReady ? '<span class="badge badge-coming-soon">قيد الإعداد</span>' : ''}
            </div>
            <div class="card-tags">
                ${(Array.isArray(item.tags) ? item.tags : []).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
        </div>
        <div class="card-footer">
            <button class="btn-view" data-action="open" data-id="${item.id}">
                <i class="ph ph-eye"></i>
                عرض المحتوى
            </button>
        </div>
    `;

    return card;
}

function updateProgressUI() {
    updateModuleProgress();
}

function toggleCompleted(id) {
    const index = state.completedItems.indexOf(id);

    if (index === -1) {
        state.completedItems.push(id);
    } else {
        state.completedItems.splice(index, 1);
    }

    localStorage.setItem('completedItems', JSON.stringify(state.completedItems));
    updateProgressUI();
    updateGamificationUI(); // تحديث نظام النقاط والشارات
    renderModules(); // Update module progress display

    if (state.view === 'content') {
        filterData();
    }

    if (elements.modal?.classList.contains('active')) {
        const modalItemId = parseInt(elements.modalBody?.dataset?.itemId || '', 10);
        if (modalItemId === id) {
            openModal(id);
        }
    }
}

function initModal() {
    if (!elements.modal) return;

    elements.modalClose?.addEventListener('click', closeModal);

    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }

        if (e.key === 'Tab' && elements.modal.classList.contains('active')) {
            trapModalFocus(e);
        }
    });
}

function trapModalFocus(e) {
    const focusable = elements.modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function openModal(id) {
    const item = state.allData.find(d => d.id === id);
    if (!item || !elements.modal) return;

    state.lastFocusedElement = document.activeElement;
    elements.modalBody.dataset.itemId = id;

    const isCompleted = state.completedItems.includes(id);
    const typeLabel = item.type === 'lesson' ? 'درس' : 'تمرين';
    const typeClass = item.type === 'lesson' ? 'badge-lesson' : 'badge-exercise';
    const disabledAttr = item.isReady ? '' : 'disabled';
    const disabledClass = item.isReady ? '' : 'is-disabled';
    const comingSoonNote = item.isReady
        ? ''
        : `<p class="coming-soon-note">
            <i class="ph ph-hourglass-medium"></i>
            هذا المحتوى قيد الإعداد وسيكون متاحاً قريباً.
           </p>`;

    elements.modalBody.innerHTML = `
        <nav class="breadcrumb" aria-label="مسار التنقل">
            <a href="#" onclick="closeModal(); return false;">
                <i class="ph ph-house"></i>
                الرئيسية
            </a>
            <i class="ph ph-caret-left breadcrumb-separator"></i>
            <span>${escapeHtml(item.module)}</span>
            <i class="ph ph-caret-left breadcrumb-separator"></i>
            <span class="breadcrumb-current">${escapeHtml(item.title)}</span>
        </nav>
        
        <div class="modal-header">
            <span class="badge ${typeClass}">${typeLabel}</span>
            <h2 id="modalTitle">${escapeHtml(item.title)}</h2>
            <div class="modal-meta">
                <span><i class="ph-fill ph-users"></i> ${escapeHtml(item.level)}</span>
                <span><i class="ph-fill ph-calendar"></i> ${escapeHtml(item.date)}</span>
            </div>
        </div>
        
        <div class="modal-image">
            <img src="${safeImageUrl(item.image)}" alt="${escapeHtml(item.title)}" 
                 loading="lazy" onerror="this.src='https://placehold.co/600x300/4f46e5/ffffff?text=صورة'">
        </div>
        
        <div class="modal-description">
            <h3><i class="ph ph-text-align-right"></i> وصف المحتوى</h3>
            <p>${escapeHtml(item.description)}</p>
        </div>
        
        <div class="modal-tags">
            ${item.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
        </div>
        
        ${comingSoonNote}
        
        <div class="modal-actions">
            <button class="btn-primary ${disabledClass}" type="button" ${disabledAttr}>
                <i class="ph-fill ph-play-circle"></i>
                بدء الدرس
            </button>
            <button class="btn-secondary ${disabledClass}" type="button" ${disabledAttr}>
                <i class="ph-fill ph-download-simple"></i>
                تحميل الملف
            </button>
            <button class="btn-complete ${isCompleted ? 'active' : ''}" type="button" onclick="toggleCompleted(${id})">
                <i class="ph-fill ${isCompleted ? 'ph-x-circle' : 'ph-check-circle'}"></i>
                ${isCompleted ? 'إلغاء الاكتمال' : 'تحديد كمكتمل'}
            </button>
        </div>
    `;

    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    elements.modalClose?.focus();
}

function closeModal() {
    if (!elements.modal) return;

    elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
        state.lastFocusedElement.focus();
    }
}

let cardObserver = null;

function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.card, .module-card, .lab-card, .future-lab-card').forEach(el => el.classList.add('visible'));
        return;
    }

    cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                cardObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: CARD_OBSERVER_THRESHOLD
    });

    observeCards();
    window.addEventListener('filterRendered', observeCards);
}

function observeCards() {
    document.querySelectorAll('.card:not(.visible), .module-card:not(.visible), .lab-card:not(.visible), .future-lab-card:not(.visible)').forEach(card => {
        cardObserver.observe(card);
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > NAVBAR_SCROLL_THRESHOLD) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initContentProtection() {
    // intentionally empty: blocking copy/selection harms accessibility
}

function updateVisitorCounter() {
    const counterEl = document.getElementById('visitorCount');
    if (!counterEl) return;

    let count = parseInt(localStorage.getItem('visitorCount') || '0', 10);
    if (!sessionStorage.getItem('counted')) {
        count++;
        localStorage.setItem('visitorCount', String(count));
        sessionStorage.setItem('counted', '1');
    }
    counterEl.textContent = count.toLocaleString('ar');
}

const BADGES = {
    FIRST_LESSON: { id: 'first_lesson', name: 'البداية', icon: 'ph-star', desc: 'أنجز أول درس', points: 10 },
    MODULE_MASTER: { id: 'module_master', name: 'متخصص المحور', icon: 'ph-trophy', desc: 'أتمم محوراً كاملاً', points: 50 },
    HALF_WAY: { id: 'half_way', name: 'في منتصف الطريق', icon: 'ph-medal', desc: 'أنجز 50% من المحتوى', points: 25 },
    FULL_PLATFORM: { id: 'full_platform', name: 'متعلم كامل', icon: 'ph-crown', desc: 'أنجز جميع المحاور', points: 100 },
    QUIZ_MASTER: { id: 'quiz_master', name: 'خبير التمارين', icon: 'ph-brain', desc: 'أنجز 5 تمارين', points: 30 },
    EXPLORER: { id: 'explorer', name: 'مستكشف', icon: 'ph-compass', desc: 'تصفح كل المحاور', points: 15 },
    STREAK_3: { id: 'streak_3', name: 'مثابر', icon: 'ph-fire', desc: '3 أيام متتالية', points: 20 },
    LAB_HERO: { id: 'lab_hero', name: 'بطل المخبر', icon: 'ph-flask', desc: 'أنجز نشاط مخبري', points: 40 }
};

// حساب النقاط والإحصائيات
function calculateStats() {
    const totalItems = state.allData.length;
    const completedCount = state.completedItems.length;
    const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // حساب النقاط
    let points = completedCount * 5; // 5 نقاط لكل درس مكتمل

    // نقاط إضافية للمكافآت
    if (completedCount >= 1) points += BADGES.FIRST_LESSON.points;
    if (completedCount >= totalItems) points += BADGES.FULL_PLATFORM.points;
    if (percentage >= 50) points += BADGES.HALF_WAY.points;

    return {
        totalItems,
        completedCount,
        percentage,
        points,
        rank: getRank(percentage)
    };
}

function getRank(percentage) {
    if (percentage === 100) return { name: 'متعلم متفوق', icon: 'ph-crown', color: '#fbbf24' };
    if (percentage >= 75) return { name: 'طالب متقدم', icon: 'ph-medal', color: '#a78bfa' };
    if (percentage >= 50) return { name: 'طالب نشيط', icon: 'ph-trophy', color: '#34d399' };
    if (percentage >= 25) return { name: 'مبتدئ مثابر', icon: 'ph-star', color: '#60a5fa' };
    return { name: 'مستكشف', icon: 'ph-compass', color: '#94a3b8' };
}

// إدارة الشارات
function checkAndAwardBadges() {
    const earned = JSON.parse(localStorage.getItem('earnedBadges')) || [];
    const newBadges = [];
    const completedCount = state.completedItems.length;

    // فحص الشارات
    if (completedCount >= 1 && !earned.includes(BADGES.FIRST_LESSON.id)) {
        newBadges.push(BADGES.FIRST_LESSON);
    }

    // إضافة الشارات المكتسبة
    newBadges.forEach(badge => {
        if (!earned.includes(badge.id)) {
            earned.push(badge.id);
            showBadgeNotification(badge);
        }
    });

    localStorage.setItem('earnedBadges', JSON.stringify(earned));
    return newBadges;
}

function showInputModal(label) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'input-modal-overlay';
        overlay.innerHTML = `
         <div class="input-modal" role="dialog" aria-modal="true">
           <label class="input-modal-label">${label}</label>
           <input class="input-modal-field" type="text" 
                  autocomplete="off" dir="auto" />
           <div class="input-modal-actions">
             <button class="btn-run input-modal-confirm">تأكيد</button>
             <button class="btn-reset input-modal-cancel">إلغاء</button>
           </div>
         </div>`;
        document.body.appendChild(overlay);
        const field = overlay.querySelector('.input-modal-field');
        const confirm = overlay.querySelector('.input-modal-confirm');
        const cancel = overlay.querySelector('.input-modal-cancel');
        requestAnimationFrame(() => field?.focus());
        const done = (val) => { overlay.remove(); resolve(val); };
        if (confirm) confirm.onclick = () => done(field ? field.value : '');
        if (cancel) cancel.onclick = () => done('');
        field?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') done(field.value);
            if (e.key === 'Escape') done('');
        });
    });
}

function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-icon">
            <i class="ph-fill ${badge.icon}"></i>
        </div>
        <div class="badge-notification-content">
            <span class="badge-label">حصلت على شارة جديدة!</span>
            <strong>${badge.name}</strong>
            <p>${badge.desc}</p>
            <span class="badge-points">+${badge.points} نقاط</span>
        </div>
        <button class="badge-close" onclick="this.parentElement.remove()">
            <i class="ph ph-x"></i>
        </button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => notification.remove(), 5000);
}

function getEarnedBadges() {
    const earned = JSON.parse(localStorage.getItem('earnedBadges')) || [];
    return Object.values(BADGES).filter(b => earned.includes(b.id));
}

// تحديث عداد النقاط في الواجهة
function updateGamificationUI() {
    const stats = calculateStats();
    checkAndAwardBadges();

    // تحديث عناصر الواجهة
    const pointsEl = document.getElementById('userPoints');
    const rankEl = document.getElementById('userRank');
    const rankLabelEl = document.getElementById('userRankLabel');
    const badgesEl = document.getElementById('userBadges');

    if (pointsEl) pointsEl.textContent = stats.points;
    if (rankEl) {
        rankEl.innerHTML = `<i class="ph-fill ${stats.rank.icon}"></i>`;
    }
    if (rankLabelEl) {
        rankLabelEl.textContent = stats.rank.name;
    }

    // تحديث الشارات
    if (badgesEl) {
        const badges = getEarnedBadges();
        badgesEl.innerHTML = badges.length > 0
            ? badges.map(b => `<span class="mini-badge" title="${b.name}"><i class="ph-fill ${b.icon}"></i></span>`).join('')
            : '<span class="no-badges">لا توجد شارات بعد</span>';
    }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.toggleCompleted = toggleCompleted;
window.showModulesView = showModulesView;
window.selectModule = selectModule;
window.calculateStats = calculateStats;
window.getEarnedBadges = getEarnedBadges;
window.showInputModal = showInputModal;
