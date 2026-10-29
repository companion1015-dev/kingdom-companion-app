#!/usr/bin/env node
// Kingdom Companion — app-language tools.
//   npm run i18n -- check                      every language complete? every text in the code translated?
//   npm run i18n -- wrap <files…> [--dry]      wrap visible English text in <T>…</T> (for new screens)
//   npm run i18n -- export                     write i18n-review.csv for native-speaker reviewers
//   npm run i18n -- new <code> "<Native>" "<English>" <ltr|rtl>   scaffold a new language
const fs = require('fs'), path = require('path')
const ts = require(path.join(process.cwd(), 'node_modules', 'typescript'))

const MESSAGES_DIR = 'src/lib/i18n/messages'
const ENT = { '&ldquo;': '“', '&rdquo;': '”', '&lsquo;': '‘', '&rsquo;': '’', '&apos;': "'", '&quot;': '"', '&amp;': '&', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&nbsp;': ' ' }
const decode = s => s.replace(/&[a-z]+;/g, m => ENT[m] ?? m).replace(/\s+/g, ' ').trim()
const hasLetters = s => /[A-Za-z]{2}/.test(s) && !/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(s.trim()) && !/^(https?:\/\/|www\.)\S+$/i.test(s.trim()) // emails and links are never translated
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"
const parse = (file, text) => ts.createSourceFile(file, text ?? fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const walkFiles = (dir, out = []) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.next') walkFiles(p, out) } else if (/\.(ts|tsx)$/.test(e.name)) out.push(p) } return out }

// Never translated: brand, Scripture, copyright notices, and sentences split around links/values.
const SKIP = new Set([
  'Kingdom Companion', '“Your word is a lamp for my feet, a light on my path.”', '— Psalm 119:105',
  'Scripture quotations from the Holy Bible, New International Version® (NIV). All rights reserved.',
  "We've sent a verification link to", '. Please click the link to activate your account.', 'By creating an account you agree to our', 'and',
])

function loadDictionaries() {
  const langs = {}
  if (!fs.existsSync(MESSAGES_DIR)) return langs
  for (const f of fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.ts')).sort()) {
    const sf = parse(path.join(MESSAGES_DIR, f)); const dict = {}
    sf.forEachChild(function visit(n) {
      if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer))
        for (const p of n.initializer.properties)
          if (ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name)) && (ts.isStringLiteral(p.initializer) || ts.isNoSubstitutionTemplateLiteral(p.initializer)))
            dict[ts.isStringLiteral(p.name) ? p.name.text : p.name.text] = p.initializer.text
      ts.forEachChild(n, visit)
    })
    langs[f.replace(/\.ts$/, '')] = dict
  }
  return langs
}

function usedTexts() {
  const used = new Set()
  for (const file of walkFiles('src')) {
    if (file.includes(path.join('lib', 'i18n'))) continue
    const sf = parse(file)
    ;(function w(n) {
      if (ts.isJsxElement(n) && n.openingElement.tagName.getText() === 'T' && n.children.length === 1 && ts.isJsxText(n.children[0])) { const k = decode(n.children[0].getText()); if (hasLetters(k)) used.add(k) }
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (n.expression.text === 'tr' || n.expression.text === 't') && n.arguments.length === 1 && ts.isStringLiteralLike(n.arguments[0])) { const k = decode(n.arguments[0].text); if (hasLetters(k)) used.add(k) }
      ts.forEachChild(n, w)
    })(sf)
  }
  return used
}

function check() {
  const langs = loadDictionaries(), codes = Object.keys(langs), union = new Set(), used = usedTexts()
  codes.forEach(c => Object.keys(langs[c]).forEach(k => union.add(k))); used.forEach(k => union.add(k))
  let failed = false
  console.log('Languages: en (source), ' + codes.join(', ') + '   |   ' + union.size + ' texts in use\n')
  for (const c of codes) {
    const d = langs[c], missing = [...union].filter(k => !(k in d)), empty = Object.keys(d).filter(k => !String(d[k]).trim())
    const bad = missing.length + empty.length; if (bad) failed = true
    console.log(c.padEnd(4) + String(Object.keys(d).length - empty.length).padStart(4) + ' translated   ' + missing.length + ' missing   ' + empty.length + ' empty' + (bad ? '   ✗' : '   ✓'))
    missing.slice(0, 8).forEach(k => console.log('       missing: ' + k.slice(0, 90)))
    if (missing.length > 8) console.log('       … and ' + (missing.length - 8) + ' more')
    empty.slice(0, 3).forEach(k => console.log('       empty:   ' + k.slice(0, 90)))
  }
  console.log(failed ? '\nFAILED — some languages are incomplete. Missing texts show in English for those users until translated.' : '\nOK — every language is complete.')
  process.exit(failed ? 1 : 0)
}

function exportCsv() {
  const langs = loadDictionaries(), codes = Object.keys(langs), keys = new Set(); codes.forEach(c => Object.keys(langs[c]).forEach(k => keys.add(k)))
  const esc = s => '"' + String(s ?? '').replace(/"/g, '""') + '"'
  const rows = [['English', ...codes].map(esc).join(',')]
  for (const k of [...keys].sort((a, b) => a.localeCompare(b))) rows.push([k, ...codes.map(c => langs[c][k] ?? '')].map(esc).join(','))
  fs.writeFileSync('i18n-review.csv', '\ufeff' + rows.join('\r\n') + '\r\n')
  console.log('Wrote i18n-review.csv — ' + keys.size + ' texts × ' + codes.length + ' languages (opens in Excel / Google Sheets).')
}

function newLanguage(code, native, english, dir) {
  if (!code || !native || !english || !['ltr', 'rtl'].includes(dir)) { console.log('Usage: npm run i18n -- new <code> "<Native name>" "<English name>" <ltr|rtl>'); process.exit(1) }
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(code)) { console.log('Invalid language code: ' + code); process.exit(1) }
  const cfgP = 'src/lib/i18n/config.ts', trP = 'src/lib/i18n/translate.ts'
  let cfg = fs.readFileSync(cfgP, 'utf8'), tra = fs.readFileSync(trP, 'utf8')
  if (cfg.includes("code: '" + code + "'")) { console.log('Language already exists: ' + code); process.exit(1) }
  for (const [s, m] of [[cfg, '// i18n:new-language'], [tra, '// i18n:imports'], [tra, '// i18n:dictionaries']]) if (!s.includes(m)) { console.log('Marker missing: ' + m); process.exit(1) }
  const ident = code.replace(/[^a-z]/gi, '')
  cfg = cfg.replace('  // i18n:new-language', `  { code: ${q(code)}, native: ${q(native)}, english: ${q(english)}, dir: '${dir}', status: 'hidden', intl: ${q(code)} },\n  // i18n:new-language`)
  tra = tra.replace('// i18n:imports', `import ${ident} from './messages/${code}'\n// i18n:imports`).replace('  // i18n:dictionaries', `  ${q(code)}: ${ident},\n  // i18n:dictionaries`)
  const keys = new Set(); Object.values(loadDictionaries()).forEach(d => Object.keys(d).forEach(k => keys.add(k)))
  const body = [...keys].sort((a, b) => a.localeCompare(b)).map(k => `  ${q(k)}: '',`).join('\n')
  fs.writeFileSync(path.join(MESSAGES_DIR, code + '.ts'), `// ${english} — fill in each translation. Empty ones show in English until done.\n// Then set status to 'beta' in src/lib/i18n/config.ts to offer the language.\nconst messages: Record<string, string> = {\n${body}\n}\nexport default messages\n`)
  fs.writeFileSync(cfgP, cfg); fs.writeFileSync(trP, tra)
  console.log(`Added ${english} (${code}), hidden from users for now.\nNext: fill in src/lib/i18n/messages/${code}.ts (or run "npm run i18n -- export" for a reviewer spreadsheet),\nthen set status: 'beta' in src/lib/i18n/config.ts and run "npm run i18n -- check".`)
}

// ---- wrap: add <T> around visible English text -------------------------------------------------
function wrapFiles(files, { dry = false } = {}) {
  const keys = new Set(); let total = 0
  for (const file of files) {
    if (!fs.existsSync(file)) { console.log('MISSING', file); continue }
    const src = fs.readFileSync(file, 'utf8'), sf = parse(file, src), edits = []; let needT = false, needTr = false
    const noTranslate = n => { for (let p = n.parent; p; p = p.parent) { const open = ts.isJsxElement(p) ? p.openingElement : ts.isJsxSelfClosingElement(p) ? p : null
        if (open && open.attributes.properties.some(a => ts.isJsxAttribute(a) && a.name.getText() === 'translate' && a.initializer && ts.isStringLiteral(a.initializer) && a.initializer.text === 'no')) return true } return false }
    const comp = n => { let c = null; for (let p = n; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) && p.name && /^[A-Z]/.test(p.name.text)) c = p
        if (ts.isVariableDeclaration(p) && /^[A-Z]/.test(p.name.getText()) && p.initializer && (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))) c = p.initializer }
      return c }
    ;(function walk(n) {
      if (ts.isJsxText(n)) {
        const raw = n.getText(), core = raw.trim(), key = decode(core)
        const insideT = n.parent && ts.isJsxElement(n.parent) && n.parent.openingElement.tagName.getText() === 'T'
        if (!insideT && hasLetters(key) && !SKIP.has(key) && !noTranslate(n)) {
          keys.add(key); needT = true
          const lead = raw.slice(0, raw.indexOf(core)), trail = raw.slice(raw.indexOf(core) + core.length)
          edits.push([n.getStart(), n.getEnd(), lead + '<T>' + core.replace(/\s+/g, ' ') + '</T>' + trail])
        }
      }
      if (ts.isJsxExpression(n) && n.expression && n.parent && ts.isJsxElement(n.parent) && n.parent.openingElement.tagName.getText() !== 'T'
          && /^[a-z]\w*\.(label|description|group)$/.test(n.expression.getText()) && !noTranslate(n)) { needT = true; edits.push([n.getStart(), n.getEnd(), '<T>' + n.getText() + '</T>']) }
      if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && ['aria-label', 'placeholder', 'title', 'alt'].includes(n.name.getText())) {
        const v = decode(n.initializer.text)
        if (hasLetters(v) && !SKIP.has(v) && !noTranslate(n)) {
          const c = comp(n)
          if (c && c.body && ts.isBlock(c.body)) { keys.add(v); needTr = true; edits.push([n.initializer.getStart(), n.initializer.getEnd(), '{tr(' + q(n.initializer.text) + ')}']) }
          else console.log('  (left as-is, not inside a component: ' + file + ' → ' + v.slice(0, 50) + ')')
        }
      }
      ts.forEachChild(n, walk)
    })(sf)
    if (dry || !edits.length) continue
    let out = src; for (const e of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, e[0]) + e[2] + out.slice(e[1])
    if (needTr) {
      const sf2 = parse(file, out), pos = []
      ;(function w(n) { if ((ts.isFunctionDeclaration(n) && n.name && /^[A-Z]/.test(n.name.text)) || (ts.isVariableDeclaration(n) && /^[A-Z]/.test(n.name.getText()) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)))) {
          const f = ts.isFunctionDeclaration(n) ? n : n.initializer
          if (f.body && ts.isBlock(f.body) && /\btr\(/.test(f.body.getText()) && !/const tr = useTr\(\)/.test(f.body.getText())) pos.push(f.body.getStart() + 1) }
        ts.forEachChild(n, w) })(sf2)
      for (const p of pos.sort((a, b) => b - a)) out = out.slice(0, p) + '\n  const tr = useTr()' + out.slice(p)
    }
    if (!/@\/components\/i18n\/T'/.test(out)) {
      const imp = needT && needTr ? "import T, { useTr } from '@/components/i18n/T'" : needT ? "import T from '@/components/i18n/T'" : "import { useTr } from '@/components/i18n/T'"
      const sf3 = parse(file, out); let last = 0, hasImport = false
      sf3.statements.forEach(s => { if (ts.isImportDeclaration(s)) { last = s.getEnd(); hasImport = true } })
      if (!hasImport) for (const s of sf3.statements) { if (ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression)) last = s.getEnd(); else break } // keep 'use client' first
      out = last === 0 ? imp + '\n' + out : out.slice(0, last) + '\n' + imp + out.slice(last)
    }
    fs.writeFileSync(file, out); total += edits.length; console.log('patched', file)
  }
  const dicts = loadDictionaries(), known = new Set(); Object.values(dicts).forEach(d => Object.keys(d).forEach(k => known.add(k)))
  const fresh = [...keys].filter(k => !known.has(k))
  if (fresh.length) { console.log('\n' + fresh.length + ' text(s) still need translations — add them to each file in src/lib/i18n/messages/:'); fresh.forEach(k => console.log('  ' + q(k))) }
  return { total, keys: [...keys], fresh }
}

module.exports = { wrapFiles, loadDictionaries }
if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === 'check') check()
  else if (cmd === 'export') exportCsv()
  else if (cmd === 'new') newLanguage(...rest)
  else if (cmd === 'wrap') { const dry = rest.includes('--dry'); const r = wrapFiles(rest.filter(a => a !== '--dry'), { dry }); console.log(dry ? '\n(dry run — nothing changed)' : '\nDone. Edited ' + r.total + ' places.') }
  else console.log('Commands: check | wrap <files…> [--dry] | export | new <code> "<Native>" "<English>" <ltr|rtl>')
}
