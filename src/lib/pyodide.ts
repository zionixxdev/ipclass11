// Browser-based Python execution using Pyodide (loaded on demand from a CDN).
// If Pyodide cannot be loaded (offline, blocked, slow), callers get a clear
// "unavailable" signal and the UI falls back to static tracing — code is never
// pretended to have run.

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export interface RunResult {
  stdout: string;
  stderr: string;
  ok: boolean;
  durationMs: number;
}

type Status = 'idle' | 'loading' | 'ready' | 'failed';
let status: Status = 'idle';
let pyodide: any = null;
let loadPromise: Promise<any> | null = null;

const statusListeners = new Set<(s: Status, msg?: string) => void>();

function setStatus(s: Status, msg?: string) {
  status = s;
  statusListeners.forEach((fn) => fn(s, msg));
}

export function onPyodideStatus(fn: (s: Status, msg?: string) => void): () => void {
  statusListeners.add(fn);
  fn(status);
  return () => statusListeners.delete(fn);
}

export function pyodideStatus(): Status {
  return status;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export async function ensurePyodide(): Promise<any> {
  if (status === 'ready' && pyodide) return pyodide;
  if (loadPromise) return loadPromise;
  setStatus('loading');
  loadPromise = (async () => {
    try {
      await loadScript(PYODIDE_BASE + 'pyodide.js');
      const loadPyodide = (globalThis as any).loadPyodide;
      if (typeof loadPyodide !== 'function') throw new Error('loadPyodide not found');
      pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
      // Install a stdin shim so input() reads from a pre-supplied buffer.
      await pyodide.runPythonAsync(`
import builtins as _b
_b.__stdin_lines__ = []
_b.__stdin_pos__ = 0
def _cp_input(prompt=""):
    if prompt:
        print(prompt, end="")
    pos = _b.__stdin_pos__
    lines = _b.__stdin_lines__
    if pos < len(lines):
        _b.__stdin_pos__ = pos + 1
        return lines[pos]
    return ""
_b.input = _cp_input
`);
      setStatus('ready');
      return pyodide;
    } catch (e: any) {
      setStatus('failed', e?.message || 'Pyodide failed to load');
      loadPromise = null;
      throw e;
    }
  })();
  return loadPromise;
}

const PREAMBLE = `
import builtins as _b
_b.__stdin_lines__ = __CP_STDIN__
_b.__stdin_pos__ = 0
`;

export async function runPython(code: string, stdinText = ''): Promise<RunResult> {
  const started = performance.now();
  const py = await ensurePyodide();
  const out: string[] = [];
  const err: string[] = [];
  py.setStdout({ batched: (s: string) => out.push(s) });
  py.setStderr({ batched: (s: string) => err.push(s) });

  const lines = stdinText.length ? stdinText.replace(/\r\n/g, '\n').split('\n') : [];
  await py.runPythonAsync(PREAMBLE.replace('__CP_STDIN__', JSON.stringify(lines)));

  let ok = true;
  try {
    // Execute in a fresh namespace so runs do not contaminate each other.
    const globals = py.globals.get('dict')();
    await py.runPythonAsync(code, { globals });
  } catch (e: any) {
    ok = false;
    const msg = e?.message ? String(e.message) : String(e);
    err.push(msg.trim() + '\n');
  }
  return {
    stdout: out.join(''),
    stderr: err.join(''),
    ok,
    durationMs: Math.round(performance.now() - started),
  };
}
