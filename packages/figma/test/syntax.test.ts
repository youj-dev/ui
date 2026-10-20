import ts from 'typescript'
import { bundlePlugin } from '../scripts/bundle'
import { buildKit } from '../src/data/build-kit'

/* Figma's plugin sandbox is not a browser: the bundle keeps to ES2017 syntax
 * and to the globals the sandbox has. This walks the built code.js and names
 * anything newer, so a dependency or a new idiom can't slip past the build's
 * target unnoticed. */

const LATER_SYNTAX: [string, (n: ts.Node) => boolean][] = [
  ['optional chaining', (n) => (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) && !!n.questionDotToken],
  ['?? / ??= / ||= / &&=', (n) => ts.isBinaryExpression(n) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.QuestionQuestionEqualsToken, ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.AmpersandAmpersandEqualsToken].includes(n.operatorToken.kind)],
  ['object spread or rest', (n) => ts.isSpreadAssignment(n) || (ts.isObjectBindingPattern(n) && n.elements.some((e) => !!e.dotDotDotToken))],
  ['optional catch binding', (n) => ts.isCatchClause(n) && !n.variableDeclaration],
  ['class fields', (n) => ts.isPropertyDeclaration(n) || ts.isPrivateIdentifier(n) || ts.isClassStaticBlockDeclaration(n)],
  ['for await', (n) => ts.isForOfStatement(n) && !!n.awaitModifier],
  ['async generators', (n) => (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n)) && !!n.asteriskToken && !!n.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)],
  ['BigInt literals', (n) => n.kind === ts.SyntaxKind.BigIntLiteral],
  ['numeric separators', (n) => ts.isNumericLiteral(n) && n.getText().includes('_')],
  ['ES2018+ regular expressions', (n) => ts.isRegularExpressionLiteral(n) && (/\/[a-z]*[sdv][a-z]*$/.test(n.text) || /\(\?<[=!]|\(\?<[a-zA-Z]|\\[pP]\{/.test(n.text))],
]

// Not in Figma's sandbox: the plugin gets figma.* equivalents or nothing.
const MISSING_GLOBALS = ['structuredClone', 'TextEncoder', 'TextDecoder', 'atob', 'btoa', 'fetch', 'document', 'window', 'localStorage', 'queueMicrotask', 'requestAnimationFrame']

test('the bundle keeps to ES2017 syntax and the sandbox’s globals', async () => {
  const code = await bundlePlugin(buildKit(), false)
  const file = ts.createSourceFile('code.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const found = new Map<string, string>()
  const globals = new Set<string>()
  const visit = (n: ts.Node) => {
    for (const [what, is] of LATER_SYNTAX) if (!found.has(what) && is(n)) found.set(what, n.getText().slice(0, 80))
    if (ts.isIdentifier(n) && MISSING_GLOBALS.includes(n.text)) {
      const parent = n.parent
      const member = ts.isPropertyAccessExpression(parent) && parent.name === n
      const key = (ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) && parent.name === n
      if (!member && !key) globals.add(n.text)
    }
    // Top-level await: an await outside any function.
    if (ts.isAwaitExpression(n)) {
      let p: ts.Node | undefined = n.parent
      while (p && !ts.isFunctionLike(p)) p = p.parent
      if (!p) found.set('top-level await', n.getText().slice(0, 80))
    }
    ts.forEachChild(n, visit)
  }
  visit(file)
  expect(Object.fromEntries(found)).toEqual({})
  expect([...globals]).toEqual([])
  // One classic script: no module syntax at the top.
  expect(file.statements.some((s) => ts.isImportDeclaration(s) || ts.isExportDeclaration(s) || ts.isExportAssignment(s))).toBe(false)
})
