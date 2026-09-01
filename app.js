/**
 * ═══════════════════════════════════════════════════════════
 *  C PROGRAM STRUCTURAL VISUALIZER — app.js
 *  RESPONSIVE REFACTOR — all SVG graphs adapt to screen width
 *  Academic Project · Pure JavaScript (no frameworks)
 *
 *  Modules:
 *    1. SAMPLE PROGRAMS
 *    2. LEXER  (DFA-based tokenizer)
 *    3. PARSER → AST
 *    4. CFG Builder
 *    5. DFG Builder
 *    6. CPG Builder
 *    7. RENDERERS (Token Table, AST Tree, SVG graphs)
 *    8. UI HELPERS
 *    9. RESPONSIVE GRAPH HELPERS
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. SAMPLE PROGRAMS
══════════════════════════════════════════════════════════ */

const SAMPLES = {
  prog1: `int main() {
    int a = 5;
    int b = 10;
    int c = a + b;
    return 0;
}`,

  prog2: `int main() {
    int x = 10;
    if (x > 5) {
        x++;
    } else {
        x = 0;
    }
    return 0;
}`,

  prog3: `int main() {
    int i;
    for (i = 0; i < 5; i++) {
        printf("%d", i);
    }
    return 0;
}`,

  prog4: `int main() {
    int a = 3;
    int b = 7;
    int max;
    if (a > b) {
        max = a;
    } else {
        max = b;
    }
    int sum = a + b + max;
    return 0;
}`
};

/* ══════════════════════════════════════════════════════════
   9. RESPONSIVE GRAPH HELPERS  (defined first — used below)
══════════════════════════════════════════════════════════ */

/**
 * getGraphDimensions()
 * Returns node sizes, gaps, and padding scaled to the
 * current viewport width. Called fresh on each render so
 * graphs adapt if the user rotates the device.
 */
function getGraphDimensions() {
  const vw = window.innerWidth || document.documentElement.clientWidth;

  if (vw <= 480) {
    // Mobile portrait
    return { NW: 140, NH: 40, HGAP: 165, VGAP: 78, PAD: 16, FONT: 9, BADGE: 8 };
  } else if (vw <= 768) {
    // Large mobile / small tablet
    return { NW: 165, NH: 44, HGAP: 200, VGAP: 84, PAD: 24, FONT: 10, BADGE: 8 };
  } else if (vw <= 1024) {
    // Tablet
    return { NW: 185, NH: 46, HGAP: 220, VGAP: 88, PAD: 32, FONT: 10, BADGE: 9 };
  } else {
    // Desktop
    return { NW: 200, NH: 48, HGAP: 240, VGAP: 90, PAD: 40, FONT: 11, BADGE: 9 };
  }
}

/**
 * makeSVG(svgW, svgH, extraClass)
 * Creates an SVG element with responsive viewBox and
 * width="100%" so it scales to its container.
 * We always set preserveAspectRatio so the graph
 * looks correct when the SVG is scaled down.
 */
function makeSVG(svgW, svgH, extraClass) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  // width=100% + height=auto → scales to container, maintains aspect ratio
  svg.setAttribute('width',  '100%');
  svg.setAttribute('height', svgH);   // natural height in SVG units
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (extraClass) svg.setAttribute('class', extraClass);
  svg.style.display       = 'block';
  svg.style.background    = '#0a0c10';
  svg.style.borderRadius  = '10px';
  svg.style.minWidth      = '280px';  // never go below this on tiny screens
  return svg;
}

/**
 * svgText(svg, x, y, text, opts)
 * Helper to create an SVG text element.
 * opts: { fill, fontSize, fontFamily, anchor, opacity, fontWeight }
 */
function svgText(x, y, text, opts = {}) {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.setAttribute('fill',        opts.fill        || '#e4e8f4');
  t.setAttribute('font-size',   opts.fontSize    || '10');
  t.setAttribute('font-family', opts.fontFamily  || 'JetBrains Mono, monospace');
  t.setAttribute('text-anchor', opts.anchor      || 'middle');
  if (opts.opacity)    t.setAttribute('opacity',     opts.opacity);
  if (opts.fontWeight) t.setAttribute('font-weight', opts.fontWeight);
  t.textContent = text;
  return t;
}

/**
 * svgRect(x, y, w, h, rx, fill, stroke, strokeW)
 */
function svgRect(x, y, w, h, rx, fill, stroke, strokeW) {
  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  r.setAttribute('x', x); r.setAttribute('y', y);
  r.setAttribute('width', w); r.setAttribute('height', h);
  r.setAttribute('rx', rx || 0);
  r.setAttribute('fill', fill || 'none');
  if (stroke)  r.setAttribute('stroke', stroke);
  if (strokeW) r.setAttribute('stroke-width', strokeW);
  return r;
}

/**
 * svgPath(d, stroke, strokeW, dashArray, markerEnd)
 */
function svgPath(d, stroke, strokeW, dashArray, markerEnd) {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', stroke || '#3a4260');
  p.setAttribute('stroke-width', strokeW || '1.5');
  if (dashArray) p.setAttribute('stroke-dasharray', dashArray);
  if (markerEnd) p.setAttribute('marker-end', markerEnd);
  return p;
}

/* ══════════════════════════════════════════════════════════
   2. LEXER  (DFA-based tokenizer)
══════════════════════════════════════════════════════════ */

/** All C keywords we recognize */
const C_KEYWORDS = new Set([
  'int','float','double','char','void','if','else','while',
  'for','do','return','break','continue','switch','case',
  'default','struct','typedef','const','static','extern',
  'unsigned','signed','long','short','sizeof','printf','scanf'
]);

/** TOKEN TYPES */
const T = {
  KEYWORD   : 'Keyword',
  IDENTIFIER: 'Identifier',
  LITERAL   : 'Literal',
  OPERATOR  : 'Operator',
  DELIMITER : 'Delimiter',
  SYMBOL    : 'Symbol',
};

/**
 * tokenize(code) → Array of { num, value, type }
 * Implements a DFA-style scanner.
 */
function tokenize(code) {
  const tokens = [];
  let i = 0, num = 1;

  while (i < code.length) {
    const ch = code[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Single-line comments
    if (ch === '/' && code[i+1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    // Block comments
    if (ch === '/' && code[i+1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i+1] === '/')) i++;
      i += 2;
      continue;
    }

    // String literals
    if (ch === '"') {
      let val = '"';
      i++;
      while (i < code.length && code[i] !== '"') val += code[i++];
      val += '"'; i++;
      tokens.push({ num: num++, value: val, type: T.LITERAL });
      continue;
    }

    // Char literals
    if (ch === "'") {
      let val = "'";
      i++;
      while (i < code.length && code[i] !== "'") val += code[i++];
      val += "'"; i++;
      tokens.push({ num: num++, value: val, type: T.LITERAL });
      continue;
    }

    // Numeric literals
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i+1]))) {
      let val = '';
      while (i < code.length && /[0-9.]/.test(code[i])) val += code[i++];
      tokens.push({ num: num++, value: val, type: T.LITERAL });
      continue;
    }

    // Identifiers & keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let val = '';
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) val += code[i++];
      tokens.push({ num: num++, value: val, type: C_KEYWORDS.has(val) ? T.KEYWORD : T.IDENTIFIER });
      continue;
    }

    // Multi-char operators
    const two = code.slice(i, i+2);
    if (['++','--','==','!=','<=','>=','&&','||','+=','-=','*=','/=','->'].includes(two)) {
      tokens.push({ num: num++, value: two, type: T.OPERATOR });
      i += 2; continue;
    }

    // Single-char operators
    if (['+','-','*','/','%','=','<','>','!','&','|','^','~'].includes(ch)) {
      tokens.push({ num: num++, value: ch, type: T.OPERATOR });
      i++; continue;
    }

    // Delimiters
    if (['(',')',']','['].includes(ch)) {
      tokens.push({ num: num++, value: ch, type: T.DELIMITER });
      i++; continue;
    }

    // Symbols
    if (['{','}',';',',','.'].includes(ch)) {
      tokens.push({ num: num++, value: ch, type: T.SYMBOL });
      i++; continue;
    }

    // Unknown
    tokens.push({ num: num++, value: ch, type: T.SYMBOL });
    i++;
  }

  return tokens;
}

/* ══════════════════════════════════════════════════════════
   3. PARSER → Simplified AST
══════════════════════════════════════════════════════════ */

/**
 * parseToAST(tokens) → AST node tree
 * Recursive-descent parser; recognises common C constructs.
 */
function parseToAST(tokens) {
  let pos = 0;

  function peek(o = 0) { return tokens[pos + o]; }
  function consume()   { return tokens[pos++]; }
  function match(v)    { return peek() && peek().value === v; }
  function eat(v)      { if (match(v)) return consume(); }

  function parseBlock() {
    eat('{');
    const stmts = [];
    while (pos < tokens.length && !match('}')) {
      const s = parseStatement();
      if (s) stmts.push(s);
    }
    eat('}');
    return stmts;
  }

  function parseStatement() {
    const t = peek();
    if (!t) return null;

    if (t.value === 'return') {
      consume();
      const expr = parseExpr();
      eat(';');
      return { kind: 'Return', expr };
    }

    if (t.value === 'if') {
      consume(); eat('(');
      const cond = parseExpr(); eat(')');
      const thenBranch = match('{') ? parseBlock() : [parseStatement()];
      let elseBranch = null;
      if (peek() && peek().value === 'else') {
        consume();
        elseBranch = match('{') ? parseBlock() : [parseStatement()];
      }
      return { kind: 'If', cond, thenBranch, elseBranch };
    }

    if (t.value === 'for') {
      consume(); eat('(');
      const init = parseExpr(); eat(';');
      const cond = parseExpr(); eat(';');
      const upd  = parseExpr(); eat(')');
      const body = match('{') ? parseBlock() : [parseStatement()];
      return { kind: 'For', init, cond, upd, body };
    }

    if (t.value === 'while') {
      consume(); eat('(');
      const cond = parseExpr(); eat(')');
      const body = match('{') ? parseBlock() : [parseStatement()];
      return { kind: 'While', cond, body };
    }

    if (['int','float','double','char','void','unsigned','long','short'].includes(t.value)) {
      const typ = consume().value;
      const nameT = peek();
      if (!nameT || nameT.type !== 'Identifier') { eat(';'); return null; }
      const name = consume().value;
      if (match('=')) { consume(); const init = parseExpr(); eat(';'); return { kind: 'Declaration', dataType: typ, name, init }; }
      eat(';');
      return { kind: 'Declaration', dataType: typ, name, init: null };
    }

    if (t.type === 'Identifier' || t.type === 'Keyword') {
      const name = consume().value;
      if (match('(')) {
        consume();
        const args = [];
        while (!match(')') && pos < tokens.length) { args.push(parseExpr()); eat(','); }
        eat(')'); eat(';');
        return { kind: 'Call', name, args };
      }
      if (match('=')) { consume(); const expr = parseExpr(); eat(';'); return { kind: 'Assign', name, expr }; }
      const nxt = peek();
      if (nxt && ['++','--','+=','-=','*=','/='].includes(nxt.value)) {
        const op = consume().value;
        let expr = null;
        if (!['++','--'].includes(op)) expr = parseExpr();
        eat(';');
        return { kind: 'Assign', name, op, expr };
      }
      eat(';');
      return null;
    }

    consume();
    return null;
  }

  function parseExpr() {
    const parts = [];
    let depth = 0;
    while (pos < tokens.length) {
      const t = peek();
      if (!t) break;
      if (t.value === '(') depth++;
      if (t.value === ')') { if (depth === 0) break; depth--; }
      if (depth === 0 && [';', ',', '{'].includes(t.value)) break;
      parts.push(consume().value);
    }
    return parts.join(' ');
  }

  const root = { kind: 'Program', functions: [] };

  while (pos < tokens.length) {
    const t = peek();
    if (!t) break;
    if (['int','void','float','char','double'].includes(t.value)) {
      const retType = consume().value;
      const nameT = peek();
      if (!nameT || nameT.type !== 'Identifier') { consume(); continue; }
      const funcName = consume().value;
      if (match('(')) {
        let pDepth = 0;
        do { const c = consume(); if (c.value==='(') pDepth++; if (c.value===')') pDepth--; }
        while (pDepth > 0 && pos < tokens.length);
        if (match('{')) {
          const body = parseBlock();
          root.functions.push({ kind: 'Function', name: funcName, returnType: retType, body });
          continue;
        }
      }
    }
    consume();
  }

  return root;
}

/* ══════════════════════════════════════════════════════════
   4. CFG BUILDER
══════════════════════════════════════════════════════════ */

function buildCFG(ast) {
  let idCounter = 0;
  function makeNode(label, type) { return { id: idCounter++, label, type, successors: [] }; }

  const startNode = makeNode('START', 'start');
  const endNode   = makeNode('END',   'end');
  const allNodes  = [startNode];

  function processStatements(stmts, entryNode) {
    let current = entryNode;
    for (const stmt of stmts) { if (!stmt) continue; current = processStatement(stmt, current); }
    return current;
  }

  function processStatement(stmt, prev) {
    if (!stmt) return prev;
    switch (stmt.kind) {
      case 'Declaration': {
        const n = makeNode(`Declare: ${stmt.dataType} ${stmt.name}${stmt.init ? ` = ${stmt.init}` : ''}`, 'stmt');
        allNodes.push(n); prev.successors.push(n.id); return n;
      }
      case 'Assign': {
        const op = stmt.op || '=';
        const label = ['++','--'].includes(op) ? `${stmt.name}${op}` : `${stmt.name} ${op} ${stmt.expr}`;
        const n = makeNode(`Assign: ${label}`, 'stmt');
        allNodes.push(n); prev.successors.push(n.id); return n;
      }
      case 'Call': {
        const n = makeNode(`Call: ${stmt.name}(${stmt.args.join(', ')})`, 'call');
        allNodes.push(n); prev.successors.push(n.id); return n;
      }
      case 'Return': {
        const n = makeNode(`Return: ${stmt.expr || ''}`, 'stmt');
        allNodes.push(n); prev.successors.push(n.id); return n;
      }
      case 'If': {
        const condN = makeNode(`if (${stmt.cond})`, 'cond');
        allNodes.push(condN); prev.successors.push(condN.id);
        const thenEntry = makeNode('then', 'stmt'); allNodes.push(thenEntry); condN.successors.push(thenEntry.id);
        const thenExit  = processStatements(stmt.thenBranch || [], thenEntry);
        const merge     = makeNode('merge', 'stmt'); allNodes.push(merge); thenExit.successors.push(merge.id);
        if (stmt.elseBranch) {
          const elseEntry = makeNode('else', 'stmt'); allNodes.push(elseEntry); condN.successors.push(elseEntry.id);
          const elseExit  = processStatements(stmt.elseBranch, elseEntry); elseExit.successors.push(merge.id);
        } else { condN.successors.push(merge.id); }
        return merge;
      }
      case 'For': {
        const initN = makeNode(`for init: ${stmt.init}`, 'stmt'); allNodes.push(initN); prev.successors.push(initN.id);
        const condN = makeNode(`for cond: ${stmt.cond}`, 'loop'); allNodes.push(condN); initN.successors.push(condN.id);
        const bodyEntry = makeNode('loop body', 'stmt'); allNodes.push(bodyEntry); condN.successors.push(bodyEntry.id);
        const bodyExit  = processStatements(stmt.body || [], bodyEntry);
        const updN      = makeNode(`for upd: ${stmt.upd}`, 'stmt'); allNodes.push(updN);
        bodyExit.successors.push(updN.id); updN.successors.push(condN.id); // back edge
        const afterLoop = makeNode('after loop', 'stmt'); allNodes.push(afterLoop); condN.successors.push(afterLoop.id);
        return afterLoop;
      }
      case 'While': {
        const condN = makeNode(`while (${stmt.cond})`, 'loop'); allNodes.push(condN); prev.successors.push(condN.id);
        const bodyEntry = makeNode('loop body', 'stmt'); allNodes.push(bodyEntry); condN.successors.push(bodyEntry.id);
        const bodyExit  = processStatements(stmt.body || [], bodyEntry); bodyExit.successors.push(condN.id);
        const afterLoop = makeNode('after while', 'stmt'); allNodes.push(afterLoop); condN.successors.push(afterLoop.id);
        return afterLoop;
      }
      default: return prev;
    }
  }

  for (const fn of ast.functions) {
    const fnEntry = makeNode(`fn: ${fn.name}()`, 'stmt');
    allNodes.push(fnEntry); startNode.successors.push(fnEntry.id);
    const fnExit = processStatements(fn.body || [], fnEntry);
    fnExit.successors.push(endNode.id);
  }
  if (ast.functions.length === 0) startNode.successors.push(endNode.id);
  allNodes.push(endNode);
  return allNodes;
}

/* ══════════════════════════════════════════════════════════
   5. DFG BUILDER
══════════════════════════════════════════════════════════ */

function buildDFG(ast) {
  const nodes = [], edges = [], varDefs = {};
  let id = 0;
  function makeNode(label, kind, varName) { const n = { id: id++, label, kind, varName }; nodes.push(n); return n; }

  function processStmts(stmts) { for (const s of stmts) { if (s) processStmt(s); } }

  function processStmt(stmt) {
    switch (stmt.kind) {
      case 'Declaration': {
        const n = makeNode(`DEF ${stmt.name}${stmt.init ? ` = ${stmt.init}` : ''}`, 'def', stmt.name);
        varDefs[stmt.name] = n.id;
        if (stmt.init) {
          extractVarUses(stmt.init).forEach(v => {
            if (varDefs[v] !== undefined) {
              const u = makeNode(`USE ${v} in ${stmt.name}`, 'use', v);
              edges.push({ from: varDefs[v], to: u.id, label: v });
              edges.push({ from: u.id, to: n.id, label: '→' });
            }
          });
        }
        break;
      }
      case 'Assign': {
        const n = makeNode(`DEF ${stmt.name}`, 'def', stmt.name);
        varDefs[stmt.name] = n.id;
        extractVarUses(stmt.expr || '').forEach(v => {
          if (varDefs[v] !== undefined) edges.push({ from: varDefs[v], to: n.id, label: v });
        });
        break;
      }
      case 'Call': {
        const n = makeNode(`CALL ${stmt.name}(...)`, 'call', stmt.name);
        stmt.args.forEach(a => extractVarUses(a).forEach(v => {
          if (varDefs[v] !== undefined) edges.push({ from: varDefs[v], to: n.id, label: v });
        }));
        break;
      }
      case 'If': {
        const condN = makeNode(`COND: ${stmt.cond}`, 'cond', '');
        extractVarUses(stmt.cond).forEach(v => {
          if (varDefs[v] !== undefined) edges.push({ from: varDefs[v], to: condN.id, label: v });
        });
        processStmts(stmt.thenBranch || []); processStmts(stmt.elseBranch || []);
        break;
      }
      case 'For':   processStmts(stmt.body || []); break;
      case 'While': processStmts(stmt.body || []); break;
      default: break;
    }
  }

  for (const fn of ast.functions) processStmts(fn.body || []);
  return { nodes, edges };
}

function extractVarUses(exprStr) {
  if (!exprStr) return new Set();
  const ids = new Set();
  (String(exprStr).match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []).forEach(m => { if (!C_KEYWORDS.has(m)) ids.add(m); });
  return ids;
}

/* ══════════════════════════════════════════════════════════
   6. CPG BUILDER
══════════════════════════════════════════════════════════ */
function buildCPG(cfg, dfg) { return { cfg, dfg }; }

/* ══════════════════════════════════════════════════════════
   7A. RENDERER — TOKEN TABLE
   Mobile (<480px): card layout
   Larger: traditional table with horizontal scroll
══════════════════════════════════════════════════════════ */

function renderTokens(tokens) {
  const container = document.getElementById('tokenOutput');

  // Stat chips
  const stats = {};
  tokens.forEach(t => { stats[t.type] = (stats[t.type] || 0) + 1; });
  const statsEl = document.getElementById('tokenStats');
  statsEl.innerHTML = '';
  const colors = {
    [T.KEYWORD]:'chip-kw', [T.IDENTIFIER]:'chip-id', [T.OPERATOR]:'chip-op',
    [T.LITERAL]:'chip-lit', [T.DELIMITER]:'chip-delim', [T.SYMBOL]:'chip-sym',
  };
  Object.entries(stats).forEach(([type, count]) => {
    const chip = document.createElement('span');
    chip.className = `stat-chip ${colors[type] || ''}`;
    chip.innerHTML = `<span>${count}</span>${type}`;
    statsEl.appendChild(chip);
  });

  const vw = window.innerWidth || 480;

  if (vw <= 479) {
    // ── CARD LAYOUT for small phones ──
    const frag = document.createDocumentFragment();
    const grid = document.createElement('div');
    grid.className = 'token-card-grid fade-in';
    grid.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

    tokens.forEach((tok, idx) => {
      const card = document.createElement('div');
      card.className = 'row-anim';
      card.style.cssText = `
        display:grid; grid-template-columns:2rem 1fr auto;
        align-items:center; gap:8px;
        background:var(--bg2); border:1px solid var(--border);
        border-radius:8px; padding:8px 10px;
        animation-delay:${idx * 8}ms;
      `;
      const chipClass = colors[tok.type] || '';
      card.innerHTML = `
        <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px;">${tok.num}</span>
        <code style="color:var(--lit);font-family:var(--font-mono);font-size:13px;word-break:break-all;">${escHtml(tok.value)}</code>
        <span class="token-chip ${chipClass}" style="font-size:10px;">${tok.type}</span>
      `;
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);

  } else {
    // ── TABLE LAYOUT for larger screens ──
    const wrap = document.createElement('div');
    wrap.className = 'token-table-wrap fade-in';

    const table = document.createElement('table');
    table.className = 'token-table';
    table.innerHTML = `<thead><tr><th>#</th><th>Token Value</th><th>Token Type</th></tr></thead>`;

    const tbody = document.createElement('tbody');
    tokens.forEach((tok, idx) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${idx * 10}ms`;
      tr.className = 'row-anim';
      const chipClass = colors[tok.type] || '';
      tr.innerHTML = `
        <td class="t-num">${tok.num}</td>
        <td class="t-val"><code>${escHtml(tok.value)}</code></td>
        <td class="t-type"><span class="token-chip ${chipClass}">${tok.type}</span></td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    container.innerHTML = '';
    container.appendChild(wrap);
  }
}

/* ══════════════════════════════════════════════════════════
   7B. RENDERER — AST TREE
══════════════════════════════════════════════════════════ */

const AST_ICONS = {
  Program:'◈', Function:'⊕', Declaration:'◎', Assign:'←', If:'⟁',
  For:'⟳', While:'⟳', Call:'⊙', Return:'↩', Expr:'◦', default:'●',
};
const AST_KIND_CLASSES = {
  Program:'nk-program', Function:'nk-function', Declaration:'nk-decl',
  Assign:'nk-assign', If:'nk-if', For:'nk-loop', While:'nk-loop',
  Call:'nk-call', Return:'nk-return',
};

function renderAST(ast) {
  const container = document.getElementById('astOutput');
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'ast-tree fade-in';

  function buildNodeEl(node, isRoot = false) {
    const div = document.createElement('div');
    div.className = 'ast-node' + (isRoot ? ' ast-root' : '');

    const icon   = AST_ICONS[node.kind] || AST_ICONS.default;
    const kClass = AST_KIND_CLASSES[node.kind] || '';
    const label  = buildASTLabel(node);

    div.innerHTML = `
      <span class="ast-node-label">
        <span class="ast-icon">${icon}</span>
        <span class="ast-kind ${kClass}">${node.kind}</span>
        <span class="ast-val">${label}</span>
      </span>
    `;

    getASTChildren(node).forEach(child => div.appendChild(buildNodeEl(child)));
    return div;
  }

  wrap.appendChild(buildNodeEl(ast, true));
  container.appendChild(wrap);
}

function buildASTLabel(node) {
  switch (node.kind) {
    case 'Program':     return '';
    case 'Function':    return `<code>${escHtml(node.returnType)} ${escHtml(node.name)}()</code>`;
    case 'Declaration': return `<code>${escHtml(node.dataType)} ${escHtml(node.name)}${node.init ? ` = ${escHtml(node.init)}` : ''}</code>`;
    case 'Assign':      return `<code>${escHtml(node.name)} ${escHtml(node.op || '=')} ${escHtml(node.expr || '')}</code>`;
    case 'If':          return `<code>cond: ${escHtml(node.cond)}</code>`;
    case 'For':         return `<code>init:${escHtml(node.init)} cond:${escHtml(node.cond)} upd:${escHtml(node.upd)}</code>`;
    case 'While':       return `<code>cond: ${escHtml(node.cond)}</code>`;
    case 'Call':        return `<code>${escHtml(node.name)}(${(node.args||[]).map(escHtml).join(', ')})</code>`;
    case 'Return':      return `<code>${escHtml(node.expr || '')}</code>`;
    default:            return '';
  }
}

function getASTChildren(node) {
  switch (node.kind) {
    case 'Program':  return node.functions || [];
    case 'Function': return node.body || [];
    case 'If': {
      var then = node.thenBranch || [];
      var els  = node.elseBranch || [];
      return then.concat(els);
    }
    case 'For':   return node.body || [];
    case 'While': return node.body || [];
    default:      return [];
  }
}

/* ══════════════════════════════════════════════════════════
   7C. RENDERER — CFG (responsive SVG)
   Key changes vs original:
   - getGraphDimensions() provides size-appropriate node dims
   - makeSVG() sets width="100%" so SVG scales to container
   - HGAP/VGAP are smaller on mobile → nodes don't overlap
   - layoutCFG uses the responsive dims
══════════════════════════════════════════════════════════ */

const CFG_COLORS = {
  start:'#00d4aa', end:'#ff6b4a', stmt:'#5b8cff',
  cond:'#ffca28', loop:'#bd93f9', call:'#8be9fd',
};

function renderCFG(cfgNodes) {
  const container = document.getElementById('cfgOutput');
  container.innerHTML = '';

  if (!cfgNodes || cfgNodes.length === 0) {
    container.innerHTML = '<div class="placeholder-msg">No nodes to display</div>';
    return;
  }

  const D = getGraphDimensions(); // responsive dims
  const { NW: W, NH: H, PAD } = D;

  const positions = layoutCFG(cfgNodes, D);
  const posVals = Object.values(positions);
  const maxX = posVals.reduce(function(m, p) { return p.x > m ? p.x : m; }, 0);
  const maxY = posVals.reduce(function(m, p) { return p.y > m ? p.y : m; }, 0);
  const svgW = maxX + W + PAD * 2;
  const svgH = maxY + H + PAD * 2;

  const svg = makeSVG(svgW, svgH, 'flow-svg fade-in');

  // Arrow markers
  svg.innerHTML = `<defs>
    <marker id="arrow-cfg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#4a5068"/>
    </marker>
    <marker id="arrow-back" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#ffca28"/>
    </marker>
  </defs>`;

  // Edges
  cfgNodes.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;
    n.successors.forEach(sid => {
      const sPos = positions[sid];
      if (!sPos) return;
      const isBack = sPos.y < pos.y;
      const x1 = pos.x + W/2, y1 = pos.y + H;
      const x2 = sPos.x + W/2, y2 = sPos.y;
      let d;
      if (isBack) {
        const offset = W * 0.45;
        d = `M${x1},${pos.y} C${x1-offset},${pos.y-15} ${x2-offset},${sPos.y+H+15} ${x2},${sPos.y+H}`;
        svg.appendChild(svgPath(d, '#ffca28', 1.5, '4 3', 'url(#arrow-back)'));
      } else {
        d = `M${x1},${y1} C${x1},${y1+16} ${x2},${y2-16} ${x2},${y2}`;
        svg.appendChild(svgPath(d, '#3a4260', 1.5, null, 'url(#arrow-cfg)'));
      }
    });
  });

  // Nodes
  cfgNodes.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;
    const color = CFG_COLORS[n.type] || '#5b8cff';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Shadow
    g.appendChild(svgRect(pos.x+2, pos.y+2, W, H, 7, 'rgba(0,0,0,0.35)'));
    // Body
    g.appendChild(svgRect(pos.x, pos.y, W, H, 7, '#13161e', color, 1.5));
    // Top color bar
    g.appendChild(svgRect(pos.x, pos.y, W, 4, 7, color));
    // Label text
    g.appendChild(svgText(pos.x + W/2, pos.y + H/2 + 4, truncate(n.label, labelMaxChars(D.FONT)), { fontSize: D.FONT }));
    // ID badge
    g.appendChild(svgText(pos.x + 5, pos.y + D.FONT + 3, `#${n.id}`, { fill: color, fontSize: D.BADGE, anchor: 'start', opacity: '0.7' }));

    svg.appendChild(g);
  });

  container.appendChild(svg);
}

/**
 * layoutCFG — BFS-layered layout using responsive dimensions
 */
function layoutCFG(nodes, D) {
  const { HGAP, VGAP, PAD } = D || getGraphDimensions();
  const positions = {}, visited = new Set(), layers = {};
  const queue = [0];
  layers[0] = 0;

  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes.find(n => n.id === id);
    if (!node) continue;
    node.successors.forEach(sid => {
      if (layers[sid] === undefined || layers[sid] <= layers[id]) layers[sid] = layers[id] + 1;
      if (!visited.has(sid)) queue.push(sid);
    });
  }

  const byLayer = {};
  Object.entries(layers).forEach(([id, layer]) => {
    if (!byLayer[layer]) byLayer[layer] = [];
    byLayer[layer].push(Number(id));
  });

  Object.entries(byLayer).forEach(([layer, ids]) => {
    const y = Number(layer) * VGAP + PAD;
    ids.forEach((id, idx) => { positions[id] = { x: idx * HGAP + PAD, y }; });
  });

  return positions;
}

/** How many chars to allow in node label based on font size */
function labelMaxChars(fontSize) {
  if (fontSize <= 9)  return 20;
  if (fontSize <= 10) return 23;
  return 26;
}

/* ══════════════════════════════════════════════════════════
   7D. RENDERER — DFG (responsive SVG)
══════════════════════════════════════════════════════════ */

function renderDFG(dfg) {
  const container = document.getElementById('dfgOutput');
  container.innerHTML = '';

  if (!dfg || dfg.nodes.length === 0) {
    container.innerHTML = '<div class="placeholder-msg">No data flow nodes found. Try a program with variable assignments.</div>';
    return;
  }

  const { nodes, edges } = dfg;
  const D = getGraphDimensions();
  const { NW, NH, HGAP, VGAP, PAD, FONT, BADGE } = D;

  // Grid layout: columns based on screen
  const vw   = window.innerWidth || 768;
  const cols  = vw <= 480 ? 2 : Math.min(Math.ceil(Math.sqrt(nodes.length)) + 1, 4);

  const positions = {};
  nodes.forEach((n, idx) => {
    positions[n.id] = {
      x: (idx % cols) * HGAP + PAD,
      y: Math.floor(idx / cols) * VGAP + PAD,
    };
  });

  const dfgPosVals = Object.values(positions);
  const maxX = dfgPosVals.reduce(function(m, p) { return p.x > m ? p.x : m; }, 0);
  const maxY = dfgPosVals.reduce(function(m, p) { return p.y > m ? p.y : m; }, 0);
  const svgW = maxX + NW + PAD * 2;
  const svgH = maxY + NH + PAD * 2;

  const svg = makeSVG(svgW, svgH, 'flow-svg fade-in');

  const DFG_COLORS = { def:'#ff6b4a', use:'#8be9fd', cond:'#ffca28', call:'#bd93f9' };

  svg.innerHTML = `<defs>
    <marker id="arrow-dfg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#ff6b4a"/>
    </marker>
  </defs>`;

  // Edges
  edges.forEach(edge => {
    const fp = positions[edge.from], tp = positions[edge.to];
    if (!fp || !tp) return;
    const x1 = fp.x + NW/2, y1 = fp.y + NH;
    const x2 = tp.x + NW/2, y2 = tp.y;
    const p = svgPath(
      `M${x1},${y1} C${x1},${y1+24} ${x2},${y2-24} ${x2},${y2}`,
      '#ff6b4a', 1.5, null, 'url(#arrow-dfg)'
    );
    p.setAttribute('opacity', '.6');
    svg.appendChild(p);

    // Edge label
    const lbl = svgText((x1+x2)/2, (y1+y2)/2, edge.label, { fill:'#ffca28', fontSize: BADGE });
    svg.appendChild(lbl);
  });

  // Nodes
  nodes.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;
    const color = DFG_COLORS[n.kind] || '#5b8cff';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    g.appendChild(svgRect(pos.x, pos.y, NW, NH, 6, '#13161e', color, 1.5));
    g.appendChild(svgRect(pos.x, pos.y, NW, 3,  6, color));
    g.appendChild(svgText(pos.x + NW/2, pos.y + NH/2 + 4, truncate(n.label, labelMaxChars(FONT)), { fontSize: FONT }));
    g.appendChild(svgText(pos.x + 4, pos.y + BADGE + 2, n.kind.toUpperCase(), { fill: color, fontSize: BADGE, anchor: 'start', opacity: '0.8' }));

    svg.appendChild(g);
  });

  container.appendChild(svg);
}

/* ══════════════════════════════════════════════════════════
   7E. RENDERER — CPG (responsive SVG overlay)
══════════════════════════════════════════════════════════ */

function renderCPG(cpgData) {
  const container = document.getElementById('cpgOutput');
  container.innerHTML = '';

  const { cfg, dfg } = cpgData;

  // Legend
  const legend = document.createElement('div');
  legend.className = 'cpg-legend fade-in';
  legend.innerHTML = `
    <div class="cpg-leg-item"><div class="cpg-leg-line ast"></div> AST / Syntax edges</div>
    <div class="cpg-leg-item"><div class="cpg-leg-line cfg"></div> Control-flow edges</div>
    <div class="cpg-leg-item"><div class="cpg-leg-line dfg"></div> Data-flow edges</div>
  `;
  container.appendChild(legend);

  if (!cfg || cfg.length === 0) {
    container.insertAdjacentHTML('beforeend', '<div class="placeholder-msg">No CPG to display</div>');
    return;
  }

  const D = getGraphDimensions();
  const { NW: W, NH: H, PAD, FONT, BADGE } = D;

  const positions = layoutCFG(cfg, D);
  const cpgPosVals = Object.values(positions);
  const maxX = cpgPosVals.reduce(function(m, p) { return p.x > m ? p.x : m; }, 0);
  const maxY = cpgPosVals.reduce(function(m, p) { return p.y > m ? p.y : m; }, 0);
  const svgW = maxX + W + PAD * 2;
  const svgH = maxY + H + PAD * 2 + 40;

  const svg = makeSVG(svgW, svgH, 'flow-svg fade-in');

  svg.innerHTML = `<defs>
    <marker id="arr-cfg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#00d4aa"/>
    </marker>
    <marker id="arr-dfg" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#ff6b4a"/>
    </marker>
  </defs>`;

  // CFG control-flow edges (green)
  cfg.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;
    n.successors.forEach(sid => {
      const sPos = positions[sid];
      if (!sPos) return;
      const isBack = sPos.y <= pos.y;
      const x1 = pos.x + W/2, y1 = pos.y + H;
      const x2 = sPos.x + W/2, y2 = sPos.y;
      const d = isBack
        ? `M${x1},${pos.y} C${x1 - W*0.4},${pos.y-20} ${x2 - W*0.4},${sPos.y+H+20} ${x2},${sPos.y+H}`
        : `M${x1},${y1} C${x1},${y1+16} ${x2},${y2-16} ${x2},${y2}`;
      const p = svgPath(d, '#00d4aa', 1.5, null, 'url(#arr-cfg)');
      p.setAttribute('opacity', '.5');
      svg.appendChild(p);
    });
  });

  // DFG data-flow edges (red dashed, offset right)
  dfg.edges.forEach(edge => {
    const srcCfg = cfg.find(n => {
      const lbl = n.label.toLowerCase();
      const v = (dfg.nodes.find(dn => dn.id === edge.from)?.varName || '').toLowerCase();
      return v && lbl.includes(v);
    });
    const dstCfg = cfg.find(n => {
      const lbl = n.label.toLowerCase();
      const v = (dfg.nodes.find(dn => dn.id === edge.to)?.varName || '').toLowerCase();
      return v && lbl.includes(v) && n !== srcCfg;
    });
    if (!srcCfg || !dstCfg) return;
    const fp = positions[srcCfg.id], tp = positions[dstCfg.id];
    if (!fp || !tp) return;
    const offset = W * 0.35;
    const x1 = fp.x + W * 0.75, y1 = fp.y + H/2;
    const x2 = tp.x + W * 0.75, y2 = tp.y + H/2;
    const p = svgPath(
      `M${x1},${y1} C${x1+offset},${y1} ${x2+offset},${y2} ${x2},${y2}`,
      '#ff6b4a', 1.5, '5 3', 'url(#arr-dfg)'
    );
    p.setAttribute('opacity', '.55');
    svg.appendChild(p);
  });

  // CFG nodes
  cfg.forEach(n => {
    const pos = positions[n.id];
    if (!pos) return;
    const color = CFG_COLORS[n.type] || '#5b8cff';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    g.appendChild(svgRect(pos.x+2, pos.y+2, W, H, 7, 'rgba(0,0,0,0.30)'));
    g.appendChild(svgRect(pos.x, pos.y, W, H, 7, '#13161e', color, 2));
    g.appendChild(svgRect(pos.x, pos.y, W, 4, 7, color));
    g.appendChild(svgText(pos.x + W/2, pos.y + H/2 + 4, truncate(n.label, labelMaxChars(FONT)), { fontSize: FONT }));

    svg.appendChild(g);
  });

  container.appendChild(svg);
}

/* ══════════════════════════════════════════════════════════
   8. UI HELPERS
══════════════════════════════════════════════════════════ */

/** Load a sample program into the editor */
function loadSample() {
  const key  = document.getElementById('sampleSelect').value;
  const code = SAMPLES[key];
  if (code) document.getElementById('codeInput').value = code;
}

/** Clear the code editor */
function clearCode() {
  document.getElementById('codeInput').value = '';
  document.getElementById('sampleSelect').value = '';
}

/** Switch between result tabs — also updates aria-selected */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  const panel = document.getElementById('tab-' + name);
  panel.classList.add('active');
  panel.setAttribute('aria-hidden', 'false');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  // On mobile, scroll the tab button into view smoothly
  btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/** Show a status message */
function showStatus(msg, type = 'success') {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = `status-msg ${type}`;
}

/** Main analyze function */
function analyzeCode() {
  const code = document.getElementById('codeInput').value.trim();
  if (!code) {
    showStatus('⚠ Please enter or select a C program first.', 'error');
    return;
  }

  // Animate the button icon
  const icon = document.querySelector('.btn-icon');
  if (icon) icon.style.transform = 'rotate(360deg)';

  showStatus('⟳ Analyzing…', 'success');

  setTimeout(() => {
    try {
      const chkLex = document.getElementById('chkLex').checked;
      const chkAST = document.getElementById('chkAST').checked;
      const chkCFG = document.getElementById('chkCFG').checked;
      const chkDFG = document.getElementById('chkDFG').checked;
      const chkCPG = document.getElementById('chkCPG').checked;

      const tokens   = tokenize(code);
      const ast      = parseToAST(tokens.slice());
      const cfgNodes = buildCFG(ast);
      const dfg      = buildDFG(ast);
      const cpg      = buildCPG(cfgNodes, dfg);

      if (chkLex) renderTokens(tokens);
      if (chkAST) renderAST(ast);
      if (chkCFG) renderCFG(cfgNodes);
      if (chkDFG) renderDFG(dfg);
      if (chkCPG) renderCPG(cpg);

      showStatus(`✓ Done — ${tokens.length} tokens · ${cfgNodes.length} CFG nodes · ${dfg.nodes.length} DFG nodes`, 'success');

      // Scroll to results — on mobile use 'start', on desktop keep centered
      const isMobile = (window.innerWidth || 768) < 769;
      document.getElementById('resultsArea').scrollIntoView({
        behavior: 'smooth',
        block: isMobile ? 'start' : 'nearest',
      });

      if (icon) icon.style.transform = '';

    } catch (err) {
      showStatus(`✗ Error: ${err.message}`, 'error');
      console.error(err);
    }
  }, 60);
}

/* ── Utilities ── */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/* ── Auto-load first sample on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sampleSelect').value = 'prog1';
  loadSample();
});