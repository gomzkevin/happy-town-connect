// Load the actual Edge renderer offline without starting its HTTP server.
// Only Deno transport imports are removed; pricing/mapping/rendering are unchanged.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const sourceUrl = new URL('../../supabase/functions/generate-quote/index.ts', import.meta.url);
let source = await readFile(sourceUrl, 'utf8');
source = source.slice(0, source.indexOf('// ─── Entry Point'));
source = source.replace(/^import .* from "https:\/\/(?:deno\.land|esm\.sh\/@supabase)[^\n]+\n/gm, '');
source = source.replace('https://esm.sh/pdf-lib@1.17.1', pathToFileURL(require.resolve('pdf-lib')).href);
source = source.replace(/from "(\.\.[^"]+)"/g, (_, relative) => `from "${new URL(relative, sourceUrl).href}"`);
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
const errors = compiled.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) || [];
if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: f => f, getCurrentDirectory: () => '.', getNewLine: () => '\n' }));
export const renderer = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
export const offlineAssets = { loadIcons: async () => ({service: new Map(), decorative: [], logo: null}) };
