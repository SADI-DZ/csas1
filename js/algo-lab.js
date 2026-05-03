/**
 * Simple Algorithm Lab (educational pseudo-code)
 * Supports English + French keywords
 * EN: Algorithm/var/start/end, Read/Write, if/then/else/end, while/do/end
 * FR: Algorithme/Variable/Debut/Fin, Lire/Ecrire, Si/Alors/Sinon/FinSi, TantQue/Faire/FinTantQue
 */
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('algoEditor');
  const highlight = document.getElementById('algoHighlight');
  const varsBody = document.getElementById('algoVarsBody');
  const outputEl = document.getElementById('algoOutput');
  const runBtn = document.getElementById('algoRunBtn');
  const stepBtn = document.getElementById('algoStepBtn');
  const resetBtn = document.getElementById('algoResetBtn');
  const langToggle = document.getElementById('algoLangToggle');

  if (!editor || !highlight || !varsBody || !outputEl || !runBtn || !stepBtn || !resetBtn) return;

  /* ── Language ────────────────────────────────── */
  let currentLang = 'en';

  const DEFAULT_PROGRAMS = {
    en: `Algorithm example
start
  Write("Hello World!");
end`,
    fr: `Algorithme exemple
Debut
  Ecrire("Hello World!");
Fin`
  };

  /* ── Keyword sets (all lowercase for matching) ── */
  const KW_ALGORITHM = ['algorithm', 'algorithme'];
  const KW_VAR = ['var', 'variable', 'variables'];
  const KW_START = ['start', 'debut', 'début'];
  const KW_END = ['end', 'fin', 'finsi', 'fintantque'];
  const KW_IF_START = ['if', 'si'];
  const KW_THEN = ['then', 'alors'];
  const KW_ELSE = ['else', 'sinon'];
  const KW_WHILE_START = ['while', 'tantque'];
  const KW_DO = ['do', 'faire'];
  const KW_READ = ['read', 'lire'];
  const KW_WRITE = ['write', 'ecrire', 'écrire'];

  // For syntax highlighting
  const HL_KEYWORDS = [...KW_ALGORITHM, ...KW_VAR, ...KW_START, ...KW_END];
  const HL_CONTROL = [...KW_IF_START, ...KW_THEN, ...KW_ELSE, ...KW_WHILE_START, ...KW_DO,
    'finsi', 'fintantque'];
  const HL_IO = [...KW_READ, ...KW_WRITE, 'print', 'let'];
  const HL_TYPES = ['integer', 'real', 'string', 'boolean', 'char',
    'entier', 'reel', 'réel', 'chaine', 'chaîne', 'booleen', 'booléen', 'caractere', 'caractère'];
  const HL_LOGIC = ['and', 'or', 'not', 'true', 'false',
    'et', 'ou', 'non', 'vrai', 'faux'];

  /* ── VM State ───────────────────────────────── */
  /** @type {{ lines: string[], blocks: any[], pc: number, vars: Record<string, any>, out: string[], halted: boolean }} */
  let vm = {
    lines: [],
    blocks: [],
    pc: 0,
    vars: {},
    out: [],
    halted: false
  };

  /* ── Helpers ────────────────────────────────── */
  const sanitizeExpr = (expr) => {
    const s = String(expr ?? '').trim();
    // Allow: letters/numbers/underscore/space/quotes/operators/parens/dot/comma/accented chars
    if (!/^[\w\s"'+\-*/%<>=!&|().,:àâéèêëïîôùûüçÀÂÉÈÊËÏÎÔÙÛÜÇ]+$/.test(s)) {
      throw new Error('تعبير غير مسموح.');
    }
    return s;
  };

  const evalExpr = (expr, vars) => {
    const safe = sanitizeExpr(expr)
      .replace(/\b(?:and|et)\b/gi, '&&')
      .replace(/\b(?:or|ou)\b/gi, '||')
      .replace(/\b(?:not|non)\b/gi, '!')
      .replace(/\b(?:vrai|true)\b/gi, 'true')
      .replace(/\b(?:faux|false)\b/gi, 'false');
    const keys = Object.keys(vars);
    const values = Object.values(vars);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return (${safe});`);
    return fn(...values);
  };

  const stripComments = (line) => {
    let s = line;
    const hash = s.indexOf('#');
    const slashes = s.indexOf('//');
    const cut = [hash, slashes].filter(i => i >= 0).sort((a, b) => a - b)[0];
    if (cut !== undefined) s = s.slice(0, cut);
    return s.trimEnd();
  };

  const normalizeLine = (line) => {
    let s = stripComments(line);
    s = s.replace(/\s*;\s*$/, '');
    return s;
  };

  /** Test if a lowered word starts with any of the given prefixes, returning the matched prefix */
  const startsWithAny = (low, prefixes) => {
    for (const p of prefixes) {
      if (low.startsWith(p + ' ') || low.startsWith(p + '(')) return p;
    }
    return null;
  };

  /** Test if a lowered word ends with any of the given suffixes */
  const endsWithAny = (low, suffixes) => {
    for (const s of suffixes) {
      if (low.endsWith(' ' + s)) return s;
    }
    return null;
  };

  /* ── Block Parser ───────────────────────────── */
  const rebuildBlocks = (lines) => {
    const blocks = [];
    const stack = [];

    const pushBlock = (b) => {
      blocks.push(b);
      stack.push(b);
    };

    lines.forEach((raw, i) => {
      const line = normalizeLine(raw).trim();
      if (!line) return;

      const low = line.toLowerCase();

      // if ... then  |  Si ... Alors
      const ifPrefix = startsWithAny(low, KW_IF_START);
      const thenSuffix = endsWithAny(low, KW_THEN);
      if (ifPrefix && thenSuffix) {
        const cond = line.slice(ifPrefix.length + 1, -(thenSuffix.length + 1)).trim();
        pushBlock({ type: 'if', line: i, cond, elseLine: null, endLine: null });
        return;
      }

      // else | sinon
      if (KW_ELSE.includes(low)) {
        const top = stack[stack.length - 1];
        if (!top || top.type !== 'if') throw new Error(`else/sinon بدون if/si (سطر ${i + 1})`);
        top.elseLine = i;
        return;
      }

      // while ... do  |  TantQue ... Faire
      const whilePrefix = startsWithAny(low, KW_WHILE_START);
      const doSuffix = endsWithAny(low, KW_DO);
      if (whilePrefix && doSuffix) {
        const cond = line.slice(whilePrefix.length + 1, -(doSuffix.length + 1)).trim();
        pushBlock({ type: 'while', line: i, cond, endLine: null });
        return;
      }

      // end | fin | finsi | fintantque
      if (KW_END.includes(low)) {
        const top = stack.pop();
        if (top) top.endLine = i;
        return;
      }
    });

    if (stack.length) {
      const top = stack[stack.length - 1];
      throw new Error(`كتلة غير مغلقة بدأت في سطر ${top.line + 1}`);
    }

    const mapIfByLine = new Map();
    const mapWhileByLine = new Map();
    blocks.forEach(b => {
      if (b.type === 'if') mapIfByLine.set(b.line, b);
      if (b.type === 'while') mapWhileByLine.set(b.line, b);
    });

    return { blocks, mapIfByLine, mapWhileByLine };
  };

  /* ── Line Kind Detection ────────────────────── */
  const getLineKind = (line) => {
    const s = normalizeLine(line).trim();
    const low = s.toLowerCase();
    if (!s) return { kind: 'empty' };

    // Algorithm | Algorithme
    if (startsWithAny(low, KW_ALGORITHM)) return { kind: 'algorithm', text: s };

    // var | Variable
    if (startsWithAny(low, KW_VAR)) return { kind: 'var', text: s };

    // start | Debut
    if (KW_START.includes(low)) return { kind: 'start', text: s };

    // let (legacy)
    if (low.startsWith('let ')) return { kind: 'let', text: s };

    // print (legacy)
    if (low.startsWith('print ')) return { kind: 'print', text: s };

    // Read(...) | Lire(...)
    const readP = startsWithAny(low, KW_READ);
    if (readP) return { kind: 'read', text: s };

    // Write(...) | Ecrire(...)
    const writeP = startsWithAny(low, KW_WRITE);
    if (writeP) return { kind: 'write', text: s };

    // if ... then | Si ... Alors
    const ifP = startsWithAny(low, KW_IF_START);
    const thenS = endsWithAny(low, KW_THEN);
    if (ifP && thenS) return { kind: 'if', text: s };

    // else | sinon
    if (KW_ELSE.includes(low)) return { kind: 'else', text: s };

    // while ... do | TantQue ... Faire
    const whP = startsWithAny(low, KW_WHILE_START);
    const doS = endsWithAny(low, KW_DO);
    if (whP && doS) return { kind: 'while', text: s };

    // end | fin | finsi | fintantque
    if (KW_END.includes(low)) return { kind: 'end', text: s };

    // Assignment with ←
    if (s.includes('←')) return { kind: 'assign', text: s };

    return { kind: 'unknown', text: s };
  };

  /* ── Rendering ──────────────────────────────── */
  const renderVars = () => {
    const entries = Object.entries(vm.vars);
    if (!entries.length) {
      varsBody.innerHTML = `<tr><td colspan="2" class="algo-empty">لا توجد متغيرات بعد</td></tr>`;
      return;
    }
    varsBody.innerHTML = entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const value = typeof v === 'string' ? JSON.stringify(v) : String(v);
        return `<tr><td>${escapeHtml(k)}</td><td dir="ltr" style="text-align:left;">${escapeHtml(value)}</td></tr>`;
      })
      .join('');
  };

  const renderOutput = () => {
    outputEl.textContent = vm.out.join('\n');
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
  };

  /** Syntax-highlight a single line of pseudo-code */
  const highlightLine = (raw) => {
    if (!raw.trim()) return '&nbsp;';

    // 1) Check for comments first (# or //)
    let mainPart = raw;
    let commentPart = '';
    const hashIdx = raw.indexOf('#');
    const slashIdx = raw.indexOf('//');
    let commentStart = -1;
    if (hashIdx >= 0 && (slashIdx < 0 || hashIdx <= slashIdx)) commentStart = hashIdx;
    else if (slashIdx >= 0) commentStart = slashIdx;
    if (commentStart >= 0) {
      mainPart = raw.slice(0, commentStart);
      commentPart = raw.slice(commentStart);
    }

    // 2) Tokenize the main part
    const tokens = [];
    const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-zÀ-ÿ_]\w*)|(\u2190|:=|<=|>=|<>|!=|&&|\|\||[+\-*/%<>=!(),;:])|(\s+)|(.)/g;
    let m;
    while ((m = tokenRe.exec(mainPart)) !== null) {
      if (m[1] !== undefined) {
        tokens.push(`<span class="algo-tok-string">${escapeHtml(m[1])}</span>`);
      } else if (m[2] !== undefined) {
        tokens.push(`<span class="algo-tok-number">${escapeHtml(m[2])}</span>`);
      } else if (m[3] !== undefined) {
        const word = m[3];
        const low = word.toLowerCase();
        if (HL_KEYWORDS.includes(low)) {
          tokens.push(`<span class="algo-tok-keyword">${escapeHtml(word)}</span>`);
        } else if (HL_CONTROL.includes(low)) {
          tokens.push(`<span class="algo-tok-control">${escapeHtml(word)}</span>`);
        } else if (HL_IO.includes(low)) {
          tokens.push(`<span class="algo-tok-io">${escapeHtml(word)}</span>`);
        } else if (HL_TYPES.includes(low)) {
          tokens.push(`<span class="algo-tok-type">${escapeHtml(word)}</span>`);
        } else if (HL_LOGIC.includes(low)) {
          tokens.push(`<span class="algo-tok-logic">${escapeHtml(word)}</span>`);
        } else {
          tokens.push(`<span class="algo-tok-var">${escapeHtml(word)}</span>`);
        }
      } else if (m[4] !== undefined) {
        tokens.push(`<span class="algo-tok-op">${escapeHtml(m[4])}</span>`);
      } else if (m[5] !== undefined) {
        tokens.push(m[5]);
      } else {
        tokens.push(escapeHtml(m[6]));
      }
    }

    if (commentPart) {
      tokens.push(`<span class="algo-tok-comment">${escapeHtml(commentPart)}</span>`);
    }

    return tokens.join('');
  };

  const renderHighlight = () => {
    const lines = vm.lines;
    const cur = vm.pc;
    const html = lines.map((ln, idx) => {
      const colored = highlightLine(ln);
      const num = String(idx + 1).padStart(2, '0');
      const isCur = idx === cur && !vm.halted;
      return `<div class="algo-line ${isCur ? 'is-current' : ''}">
        <span class="algo-ln" aria-hidden="true">${num}</span>
        <span class="algo-code">${colored}</span>
      </div>`;
    }).join('');
    highlight.innerHTML = html + '\n';
    const curEl = highlight.querySelector('.algo-line.is-current');
    if (curEl) {
      const top = curEl.offsetTop;
      const h = highlight.clientHeight;
      if (top < highlight.scrollTop || top > highlight.scrollTop + h - 48) {
        highlight.scrollTop = Math.max(0, top - Math.floor(h / 3));
      }
    }
  };

  /* ── VM Control ─────────────────────────────── */
  const resetVM = () => {
    vm.lines = editor.value.replace(/\r\n/g, '\n').split('\n');
    const { blocks, mapIfByLine, mapWhileByLine } = rebuildBlocks(vm.lines);
    vm.blocks = blocks;
    vm._ifMap = mapIfByLine;
    vm._whileMap = mapWhileByLine;
    vm.pc = 0;
    vm.vars = {};
    vm.out = [];
    vm.halted = false;
    renderVars();
    renderOutput();
    renderHighlight();
  };

  const jumpToNextExecutable = () => {
    while (vm.pc < vm.lines.length) {
      const { kind } = getLineKind(vm.lines[vm.pc]);
      if (kind === 'empty') {
        vm.pc += 1;
        continue;
      }
      return;
    }
  };

  /* ── Step Execution ─────────────────────────── */
  const stepOnce = async () => {
    if (vm.halted) return;
    jumpToNextExecutable();
    if (vm.pc >= vm.lines.length) {
      vm.halted = true;
      renderHighlight();
      return;
    }

    const lineIdx = vm.pc;
    const raw = vm.lines[lineIdx];
    const s = normalizeLine(raw).trim();
    const { kind } = getLineKind(raw);

    try {
      if (kind === 'algorithm' || kind === 'start') {
        vm.pc += 1;

      } else if (kind === 'var') {
        // var a, b: integer  |  Variable a, b: entier
        const low = s.toLowerCase();
        let rest;
        for (const kw of KW_VAR) {
          if (low.startsWith(kw + ' ')) { rest = s.slice(kw.length + 1).trim(); break; }
        }
        if (!rest) rest = s.slice(3).trim();
        const beforeType = rest.split(':')[0].trim();
        const names = beforeType.split(',').map(x => x.trim()).filter(Boolean);
        names.forEach(n => {
          if (/^[A-Za-z_]\w*$/.test(n)) {
            if (!(n in vm.vars)) vm.vars[n] = null;
          }
        });
        vm.pc += 1;

      } else if (kind === 'let') {
        const rest = s.slice(4).trim();
        const m = rest.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (!m) throw new Error(`صيغة let غير صحيحة (سطر ${lineIdx + 1})`);
        const [, name, expr] = m;
        vm.vars[name] = evalExpr(expr, vm.vars);
        vm.pc += 1;

      } else if (kind === 'assign') {
        const m = s.match(/^([A-Za-z_]\w*)\s*←\s*(.+)$/);
        if (!m) throw new Error(`صيغة الإسناد غير صحيحة (سطر ${lineIdx + 1})`);
        const [, name, expr] = m;
        vm.vars[name] = evalExpr(expr, vm.vars);
        vm.pc += 1;

      } else if (kind === 'read') {
        // Read(x) | Lire(x)
        const m = s.match(/^(?:read|lire)\s*\(\s*([A-Za-z_]\w*)\s*\)\s*$/i);
        if (!m) throw new Error(`صيغة Read/Lire غير صحيحة (سطر ${lineIdx + 1})`);
        const name = m[1];
        const rawVal = typeof window.showInputModal === 'function'
          ? await window.showInputModal(`أدخل قيمة المتغير: ${name}`)
          : '';
        const v = rawVal == null ? '' : String(rawVal);
        const num = Number(v);
        vm.vars[name] = Number.isFinite(num) && v.trim() !== '' ? num : v;
        vm.pc += 1;

      } else if (kind === 'write') {
        // Write(expr) | Ecrire(expr)
        const m = s.match(/^(?:write|ecrire|écrire)\s*\(\s*(.+)\s*\)\s*$/i);
        if (!m) throw new Error(`صيغة Write/Ecrire غير صحيحة (سطر ${lineIdx + 1})`);
        const val = evalExpr(m[1], vm.vars);
        vm.out.push(String(val));
        vm.pc += 1;

      } else if (kind === 'print') {
        const expr = s.slice(6).trim();
        const val = evalExpr(expr, vm.vars);
        vm.out.push(String(val));
        vm.pc += 1;

      } else if (kind === 'if') {
        const b = vm._ifMap.get(lineIdx);
        if (!b) throw new Error(`if/si غير معروف (سطر ${lineIdx + 1})`);
        const ok = Boolean(evalExpr(b.cond, vm.vars));
        if (ok) {
          vm.pc += 1;
        } else {
          vm.pc = (b.elseLine != null ? b.elseLine + 1 : b.endLine + 1);
        }

      } else if (kind === 'else') {
        const match = vm.blocks.find(b => b.type === 'if' && b.elseLine === lineIdx);
        if (!match) throw new Error(`else/sinon بدون if/si (سطر ${lineIdx + 1})`);
        vm.pc = match.endLine + 1;

      } else if (kind === 'while') {
        const b = vm._whileMap.get(lineIdx);
        if (!b) throw new Error(`while/tantque غير معروف (سطر ${lineIdx + 1})`);
        const ok = Boolean(evalExpr(b.cond, vm.vars));
        if (ok) {
          vm.pc += 1;
        } else {
          vm.pc = b.endLine + 1;
        }

      } else if (kind === 'end') {
        const whileBlock = vm.blocks.find(b => b.type === 'while' && b.endLine === lineIdx);
        if (whileBlock) {
          vm.pc = whileBlock.line;
        } else {
          vm.pc += 1;
        }

      } else {
        throw new Error(`سطر غير مدعوم (سطر ${lineIdx + 1})`);
      }
    } catch (e) {
      vm.out.push(`خطأ: ${e && e.message ? e.message : String(e)}`);
      vm.halted = true;
    }

    renderVars();
    renderOutput();
    renderHighlight();
    /* Fixed: 9 */
  };

  const runAll = async () => {
    const CHUNK = 500;
    let steps = 0;
    const runChunk = async () => {
      let i = 0;
      while (!vm.halted && i < CHUNK) {
        // eslint-disable-next-line no-await-in-loop
        await stepOnce();
        i++;
        steps++;
      }
      if (!vm.halted && steps < 10000) {
        setTimeout(() => {
          runChunk();
        }, 0);
      } else if (steps >= 10000) {
        vm.out.push('تم إيقاف التشغيل: تجاوز الحد الأقصى للخطوات.');
        vm.halted = true;
        renderOutput();
        renderHighlight();
      }
    };
    await runChunk();
    /* Fixed: 10 */
  };

  /* ── Editor UX ──────────────────────────────── */
  const syncScroll = () => {
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  };

  editor.addEventListener('input', () => {
    vm.lines = editor.value.replace(/\r\n/g, '\n').split('\n');
    try {
      const { blocks, mapIfByLine, mapWhileByLine } = rebuildBlocks(vm.lines);
      vm.blocks = blocks;
      vm._ifMap = mapIfByLine;
      vm._whileMap = mapWhileByLine;
    } catch {
      // ignore parse errors during typing
    }
    renderHighlight();
  });
  editor.addEventListener('scroll', syncScroll);

  runBtn.addEventListener('click', async () => {
    resetVM();
    await runAll();
  });
  stepBtn.addEventListener('click', async () => {
    if (!vm.blocks?.length && editor.value.trim()) {
      resetVM();
    }
    await stepOnce();
  });
  resetBtn.addEventListener('click', () => {
    editor.value = DEFAULT_PROGRAMS[currentLang];
    resetVM();
  });

  /* ── Language Toggle ────────────────────────── */
  if (langToggle) {
    const langBtns = langToggle.querySelectorAll('.algo-lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (lang === currentLang) return;
        currentLang = lang;
        langBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        // Load default program for chosen language
        editor.value = DEFAULT_PROGRAMS[currentLang];
        resetVM();
      });
    });
  }

  /* ── Init ───────────────────────────────────── */
  if (!editor.value.trim()) editor.value = DEFAULT_PROGRAMS[currentLang];
  resetVM();
});
