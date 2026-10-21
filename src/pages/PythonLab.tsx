import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Code2, Cpu, Loader2, Play, RotateCcw, Terminal, Zap } from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';
import { Card, SectionTitle, Spinner } from '../components/ui';
import { ensurePyodide, onPyodideStatus, pyodideStatus, runPython, type RunResult } from '../lib/pyodide';
import { LAB_CODE_KEY, LAB_STDIN_KEY } from '../lib/storage';
import { cn } from '../lib/utils';

interface Sample {
  name: string;
  code: string;
  stdin?: string;
  notes: string[];
}

const SAMPLES: Sample[] = [
  {
    name: 'Hello World',
    code: `print("Hello World")`,
    notes: ['print() displays text on the screen.', 'The text inside quotes is a string literal.'],
  },
  {
    name: 'Input & Output',
    code: `name = input("Enter your name: ")
age = int(input("Enter your age: "))
print("Hello", name + "!")
print("Next year you will be", age + 1)`,
    stdin: 'Aditya\n16',
    notes: ['input() always returns a string — use int() to convert.', 'print() with commas inserts a space between values.'],
  },
  {
    name: 'If-Elif-Else',
    code: `marks = int(input("Enter marks: "))
if marks >= 90:
    print("Grade A")
elif marks >= 75:
    print("Grade B")
elif marks >= 50:
    print("Grade C")
else:
    print("Needs improvement")`,
    stdin: '82',
    notes: ['Python uses indentation to define blocks.', 'elif is checked only if the earlier conditions were false.'],
  },
  {
    name: 'For loop with range()',
    code: `for i in range(1, 6):
    print(i, "squared is", i * i)`,
    notes: ['range(1, 6) produces 1,2,3,4,5 — the stop value is excluded.', 'The loop body must be indented.'],
  },
  {
    name: 'While loop',
    code: `n = int(input("Enter a number: "))
total = 0
i = 1
while i <= n:
    total += i
    i += 1
print("Sum of first", n, "numbers is", total)`,
    stdin: '5',
    notes: ['A while loop runs while the condition is true.', 'Forgetting to update i causes an infinite loop.'],
  },
  {
    name: 'Operators & precedence',
    code: `a = 10
b = 3
print("a + b =", a + b)
print("a / b =", a / b)     # true division -> float
print("a // b =", a // b)   # floor division -> int
print("a % b =", a % b)
print("2 + 3 * 4 =", 2 + 3 * 4)`,
    notes: ['/ always returns a float.', '// gives the floor (integer) quotient.', '* has higher precedence than +.'],
  },
  {
    name: 'Lists',
    code: `marks = [45, 78, 90, 33, 67]
print("Marks:", marks)
print("First:", marks[0], "Last:", marks[-1])
print("Sliced:", marks[1:4])
marks.append(100)
print("After append:", marks)
print("Max:", max(marks), "Sum:", sum(marks))`,
    notes: ['Indexing starts at 0; -1 is the last element.', 'Slicing marks[1:4] gives elements at index 1,2,3.', 'append() adds to the end.'],
  },
  {
    name: 'Error handling (try/except)',
    code: `try:
    a = int(input("Enter a number: "))
    print("100 /", a, "=", 100 / a)
except ZeroDivisionError:
    print("Cannot divide by zero!")
except ValueError:
    print("Please enter a valid number.")`,
    stdin: '0',
    notes: ['try/except catches runtime errors instead of crashing.', 'ZeroDivisionError occurs when dividing by zero.'],
  },
];

export default function PythonLab() {
  const [code, setCode] = useState(SAMPLES[0].code);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(pyodideStatus());
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>(SAMPLES[0].notes);
  const [activeSample, setActiveSample] = useState(0);
  const [executed, setExecuted] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => onPyodideStatus((s, msg) => { setStatus(s); if (msg) setError(msg); }), []);

  // A program handed over from the Python Examples page.
  useEffect(() => {
    try {
      const pending = localStorage.getItem(LAB_CODE_KEY);
      if (!pending) return;
      setCode(pending);
      setStdin(localStorage.getItem(LAB_STDIN_KEY) || '');
      setNotes(['This program was opened from Python Examples — press Run to see the output for yourself.']);
      setResult(null);
      setExecuted(false);
      localStorage.removeItem(LAB_CODE_KEY);
      localStorage.removeItem(LAB_STDIN_KEY);
    } catch {
      /* storage unavailable — keep the default sample */
    }
  }, []);

  const load = () => {
    setError(null);
    ensurePyodide().catch((e) => setError(e?.message || 'Could not load Python.'));
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setExecuted(false);
    try {
      const r = await runPython(code, stdin);
      setResult(r);
      setExecuted(true);
    } catch (e: any) {
      setError(e?.message || 'Python runtime unavailable.');
    } finally {
      setRunning(false);
    }
  };

  const loadSample = (i: number) => {
    setActiveSample(i);
    setCode(SAMPLES[i].code);
    setStdin(SAMPLES[i].stdin || '');
    setNotes(SAMPLES[i].notes);
    setResult(null);
    setExecuted(false);
    taRef.current?.focus();
  };

  const lines = useMemo(() => code.split('\n').length, [code]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Python Lab</h1>
        <p className="mt-1 text-sm text-slate-400">Write and run real Python in your browser. Execution is powered by Pyodide (CPython compiled to WebAssembly) — your code never leaves your device.</p>
      </div>

      {/* Runtime status banner */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className={cn('grid h-9 w-9 place-items-center rounded-lg', status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-brand-500/15 text-brand-300')}>
          {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Cpu size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100">
            {status === 'ready' ? 'Python runtime ready' : status === 'loading' ? 'Loading Python runtime…' : status === 'failed' ? 'Python runtime unavailable' : 'Python runtime not loaded yet'}
          </p>
          <p className="text-xs text-slate-400">
            {status === 'ready'
              ? 'Code runs locally in a sandboxed WebAssembly environment.'
              : status === 'failed'
              ? 'You are likely offline. You can still study the sample programs, expected outputs and tracing notes below.'
              : 'Loaded on demand (about 10 MB, first load only).'}
          </p>
        </div>
        {status !== 'ready' && (
          <button className="btn-primary" onClick={load} disabled={status === 'loading'}>
            {status === 'loading' ? <Spinner /> : <Zap size={16} />} Load runtime
          </button>
        )}
      </Card>

      {error && (
        <Card className="flex items-start gap-2 border-rose-400/30 p-3 text-sm text-rose-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
        </Card>
      )}

      {/* Samples */}
      <div>
        <SectionTitle icon={<Code2 size={18} />} title="Sample programs" subtitle="Load a syllabus-ready example, then edit and run it" />
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => loadSample(i)}
              className={cn('rounded-lg border px-3 py-1.5 text-sm transition', i === activeSample ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Terminal size={16} /> Editor</span>
            <span className="text-xs text-slate-500">{lines} lines</span>
          </div>
          <div className="relative">
            <textarea
              ref={taRef}
              className="code-block min-h-[280px] w-full resize-y !text-slate-100"
              value={code}
              spellCheck={false}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Write your Python code here…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Program input (stdin) — one value per line</label>
            <textarea
              className="input min-h-[64px] resize-y font-mono text-xs"
              value={stdin}
              spellCheck={false}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Values for input() calls, one per line…"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={run} disabled={running || status === 'loading'}>
              {running ? <Spinner /> : <Play size={16} />} Run
            </button>
            <button className="btn-ghost" onClick={() => { setCode(SAMPLES[activeSample].code); setStdin(SAMPLES[activeSample].stdin || ''); setResult(null); setExecuted(false); }}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Console */}
        <div className="space-y-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Terminal size={16} /> Output console</span>
          {/* A dark console in both themes (same treatment as code blocks), so
              the light theme layer must not recolour its text. */}
          <div className="code-block max-h-[420px] min-h-[280px] overflow-y-auto">
            {!executed && !result && <span className="console-muted">Press “Run” to execute your code. Output appears here.</span>}
            {result && (
              <>
                {result.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}
                {result.stderr && <pre className="mt-2 whitespace-pre-wrap console-err">{result.stderr}</pre>}
                {!result.stdout && !result.stderr && <span className="console-muted">(no output)</span>}
              </>
            )}
          </div>
          {result && executed && (
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('chip', result.ok ? '!border-emerald-400/30 !text-emerald-300' : '!border-rose-400/30 !text-rose-300')}>
                {result.ok ? 'Ran without errors' : 'Finished with an error'}
              </span>
              <span className="chip">executed in {result.durationMs} ms</span>
            </div>
          )}
          {!executed && (
            <p className="text-xs text-slate-500">The console only shows output after your code has actually run — nothing is simulated.</p>
          )}
        </div>
      </div>

      {/* Notes + static fallback */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-300">Step-by-step notes</h3>
          <ul className="space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-brand-300">•</span>{n}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Study without execution</h3>
          <p className="text-sm text-slate-400">If the runtime cannot load, read each sample, predict its output on paper, then compare with the expected output below. This mirrors the “Predict the Output” questions in the exam.</p>
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Current sample code</p>
            <CodeBlock code={code} />
          </div>
        </Card>
      </div>
    </div>
  );
}
