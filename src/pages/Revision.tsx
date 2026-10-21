import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  Calculator,
  ChevronDown,
  FileText,
  GitCompare,
  Layers,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { chapters, questions as ALL, getTopic } from '../data';
import type { Question, Table } from '../data/types';
import { useProgress } from '../lib/store';
import { cn } from '../lib/utils';
import { Card, EmptyState, SectionTitle } from '../components/ui';
import { CodeBlock } from '../components/CodeBlock';

const CHEATSHEET = [
  { label: 'Print & input', code: `print("Hello", name, sep="-", end="!\\n")\nname = input("Enter name: ")   # returns str\nage = int(input("Age: "))      # convert` },
  { label: 'Data types', code: `x = 10        # int\ny = 3.14      # float\nz = 2 + 3j    # complex\nok = True     # bool\ns = "hi"      # str\nt = (1, 2)    # tuple (immutable)\nl = [1, 2]    # list (mutable)\nprint(type(x))` },
  { label: 'Operators', code: `7 / 2   # 3.5   true division\n7 // 2  # 3     floor division\n7 % 2   # 1     modulus\n2 ** 3  # 8     exponent\n"ab" * 2  # "abab"\n3 in [1,2,3]  # True` },
  { label: 'Conditionals', code: `if marks >= 90:\n    print("A")\nelif marks >= 75:\n    print("B")\nelse:\n    print("C")` },
  { label: 'Loops', code: `for i in range(1, 6):\n    print(i)\n\nwhile n > 0:\n    print(n)\n    n -= 1\n\nfor i in range(5):\n    if i == 3:\n        break` },
  { label: 'Lists', code: `l = [10, 20, 30]\nl[0]      # 10\nl[-1]     # 30\nl[0:2]    # [10, 20]\nl.append(40)\nl.insert(1, 15)\nl.remove(20)\nl.sort()\nlen(l); max(l); min(l); sum(l)` },
  { label: 'Exceptions', code: `try:\n    x = int(input())\n    print(10 / x)\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")\nexcept ValueError:\n    print("Not a number")\nfinally:\n    print("Done")` },
];

const LIST_METHODS: { m: string; d: string; ex: string }[] = [
  { m: 'append(x)', d: 'Adds a single item to the end', ex: 'l.append(5)' },
  { m: 'extend(iterable)', d: 'Adds all items of another list', ex: 'l.extend([6,7])' },
  { m: 'insert(i, x)', d: 'Inserts x at index i', ex: 'l.insert(0, 1)' },
  { m: 'remove(x)', d: 'Removes the first occurrence of x', ex: 'l.remove(3)' },
  { m: 'pop([i])', d: 'Removes and returns the item at index i (last by default)', ex: 'l.pop()' },
  { m: 'clear()', d: 'Empties the list', ex: 'l.clear()' },
  { m: 'index(x)', d: 'Returns index of the first occurrence of x', ex: 'l.index(3)' },
  { m: 'count(x)', d: 'Counts occurrences of x', ex: 'l.count(2)' },
  { m: 'reverse()', d: 'Reverses the list in place', ex: 'l.reverse()' },
  { m: 'sort()', d: 'Sorts the list in place (ascending by default)', ex: 'l.sort()' },
  { m: 'copy()', d: 'Returns a shallow copy', ex: 'l2 = l.copy()' },
];

const BUILTINS: { m: string; d: string }[] = [
  { m: 'len(l)', d: 'Number of elements' },
  { m: 'max(l) / min(l)', d: 'Largest / smallest element' },
  { m: 'sum(l)', d: 'Sum of numeric elements' },
  { m: 'sorted(l)', d: 'Returns a new sorted list' },
  { m: 'list(seq)', d: 'Creates a list from a sequence' },
  { m: 'any(l) / all(l)', d: 'True if any / all elements are true' },
];

const ERRORS: { e: string; cause: string; fix: string }[] = [
  { e: 'SyntaxError', cause: 'Invalid Python syntax (missing colon, bracket, quote)', fix: 'Check punctuation and indentation carefully.' },
  { e: 'IndentationError', cause: 'Inconsistent or missing indentation', fix: 'Use consistent spaces (4) inside a block.' },
  { e: 'NameError', cause: 'Using a variable that has not been defined', fix: 'Define the variable before use; check spelling.' },
  { e: 'TypeError', cause: 'Operation on incompatible types, e.g. "a" + 1', fix: 'Convert types: "a" + str(1).' },
  { e: 'ValueError', cause: 'Right type, wrong value, e.g. int("abc")', fix: 'Validate input before conversion.' },
  { e: 'ZeroDivisionError', cause: 'Dividing by zero', fix: 'Guard against zero denominator.' },
  { e: 'IndexError', cause: 'List index out of range', fix: 'Check index bounds (0 to len-1).' },
  { e: 'KeyError', cause: 'Dictionary key not found', fix: 'Use .get() or check key existence.' },
  { e: 'AttributeError', cause: 'Calling a method the object does not have', fix: 'Check the correct method name/type.' },
  { e: 'ImportError', cause: 'Module could not be imported', fix: 'Check the module name/installation.' },
];

const OUTPUT_PATTERNS = [
  { title: 'print with multiple values', code: 'print("Sum is", 3 + 4)', out: 'Sum is 7' },
  { title: 'sep and end', code: 'print("a", "b", sep="-", end="!")', out: 'a-b!' },
  { title: 'String repetition', code: 'print("ab" * 3)', out: 'ababab' },
  { title: 'True division vs floor', code: 'print(7 / 2, 7 // 2)', out: '3.5 3' },
  { title: 'Precedence', code: 'print(2 + 3 * 4 ** 2)', out: '50' },
  { title: 'List slicing', code: 'l = [1,2,3,4,5]\nprint(l[1:4], l[::-1])', out: '[2, 3, 4] [5, 4, 3, 2, 1]' },
  { title: 'Boolean of numbers', code: 'print(bool(0), bool(5))', out: 'False True' },
];

const CONVERSIONS = [
  { unit: '1 nibble', value: '4 bits' },
  { unit: '1 byte (B)', value: '8 bits' },
  { unit: '1 kilobyte (KB)', value: '1024 bytes (2^10 B)' },
  { unit: '1 megabyte (MB)', value: '1024 KB (2^20 B)' },
  { unit: '1 gigabyte (GB)', value: '1024 MB (2^30 B)' },
  { unit: '1 terabyte (TB)', value: '1024 GB (2^40 B)' },
  { unit: '1 petabyte (PB)', value: '1024 TB (2^50 B)' },
];

type Tab = 'notes' | 'definitions' | 'differences' | 'cheatsheet' | 'errors' | 'outputs' | 'units' | 'mistakes' | 'quick';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'notes', label: 'Chapter notes', icon: <BookOpen size={15} /> },
  { id: 'definitions', label: 'Definitions', icon: <FileText size={15} /> },
  { id: 'differences', label: 'Differences', icon: <GitCompare size={15} /> },
  { id: 'cheatsheet', label: 'Python cheat sheet', icon: <Terminal size={15} /> },
  { id: 'errors', label: 'Error guide', icon: <AlertTriangle size={15} /> },
  { id: 'outputs', label: 'Output patterns', icon: <Layers size={15} /> },
  { id: 'units', label: 'Units & conversions', icon: <Calculator size={15} /> },
  { id: 'mistakes', label: 'Mistake notebook', icon: <RefreshCw size={15} /> },
  { id: 'quick', label: 'Quick revision', icon: <Sparkles size={15} /> },
];

function TableView({ t }: { t: Table }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        {t.title && <caption className="border-b border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-300">{t.title}</caption>}
        <thead className="bg-white/5 text-slate-300"><tr>{t.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {t.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-white/5">{row.map((cell, ci) => <td key={ci} className="px-3 py-2 align-top text-slate-300">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Revision() {
  const { state, isBookmarked, toggleBookmark } = useProgress();
  const [tab, setTab] = useState<Tab>('notes');
  const [openChapter, setOpenChapter] = useState<string | null>(chapters[0]?.id ?? null);
  const [quickIdx, setQuickIdx] = useState(0);
  const [quickFlipped, setQuickFlipped] = useState(false);

  const mistakeQuestions = state.mistakes.map((id) => ALL.find((q) => q.id === id)).filter(Boolean) as Question[];

  // Quick revision deck: every topic's formal definition.
  const deck = chapters.flatMap((c) => c.topics.map((t) => ({ chapter: c, topic: t })));
  const card = deck[quickIdx % Math.max(1, deck.length)];

  const allDifferences: { chapter: string; t: Table }[] = chapters.flatMap((c) =>
    c.topics.flatMap((t) => (t.content.differences || []).map((d) => ({ chapter: `Ch ${c.number} · ${t.title}`, t: d })))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Revision Center</h1>
        <p className="mt-1 text-sm text-slate-400">Everything you need for last-minute revision — notes, definitions, tables, cheat sheets and your own mistake notebook.</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition', tab === t.id ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="space-y-3">
          {chapters.map((c) => {
            const open = openChapter === c.id;
            return (
              <Card key={c.id} className="overflow-hidden">
                <button className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={() => setOpenChapter(open ? null : c.id)}>
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-200">{c.number}</span>
                    <span className="font-semibold text-slate-100">{c.title}</span>
                  </span>
                  <ChevronDown className={cn('shrink-0 text-slate-400 transition', open && 'rotate-180')} size={18} />
                </button>
                {open && (
                  <div className="space-y-4 border-t border-white/10 p-4">
                    {c.topics.map((t) => (
                      <div key={t.id}>
                        <p className="mb-1 text-sm font-semibold text-brand-200">{t.title}</p>
                        <p className="text-sm text-slate-300">{t.content.formalDefinition}</p>
                        {t.content.examNotes?.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {t.content.examNotes.map((n, i) => <li key={i} className="text-xs text-slate-400">• {n}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'definitions' && (
        <div className="space-y-3">
          {chapters.map((c) => (
            <Card key={c.id} className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-300">Chapter {c.number} · {c.title}</p>
              <div className="space-y-3">
                {c.topics.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-semibold text-slate-200">{t.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{t.content.formalDefinition}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'differences' && (
        <div className="space-y-4">
          {allDifferences.length === 0 ? (
            <EmptyState icon={<GitCompare size={22} />} title="No difference tables" message="Difference tables will appear here as they are added to chapters." />
          ) : (
            allDifferences.map((d, i) => (
              <Card key={i} className="p-4">
                <p className="mb-2 text-xs text-slate-500">{d.chapter}</p>
                <TableView t={d.t} />
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'cheatsheet' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {CHEATSHEET.map((c) => (
            <Card key={c.label} className="p-4">
              <p className="mb-2 text-sm font-semibold text-slate-100">{c.label}</p>
              <CodeBlock code={c.code} />
            </Card>
          ))}
          <Card className="p-4 lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-100">List methods reference</p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-300"><tr><th className="px-3 py-2 text-left">Method</th><th className="px-3 py-2 text-left">Purpose</th><th className="px-3 py-2 text-left">Example</th></tr></thead>
                <tbody>
                  {LIST_METHODS.map((r) => (
                    <tr key={r.m} className="border-t border-white/5">
                      <td className="px-3 py-2 font-mono text-xs text-brand-200">{r.m}</td>
                      <td className="px-3 py-2 text-slate-300">{r.d}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">{r.ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mb-2 mt-4 text-sm font-semibold text-slate-100">Built-in functions</p>
            <div className="flex flex-wrap gap-2">
              {BUILTINS.map((b) => <span key={b.m} className="chip" title={b.d}>{b.m} — {b.d}</span>)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'errors' && (
        <Card className="p-4">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-300"><tr><th className="px-3 py-2 text-left">Exception</th><th className="px-3 py-2 text-left">Typical cause</th><th className="px-3 py-2 text-left">How to fix</th></tr></thead>
              <tbody>
                {ERRORS.map((r) => (
                  <tr key={r.e} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-rose-300">{r.e}</td>
                    <td className="px-3 py-2 text-slate-300">{r.cause}</td>
                    <td className="px-3 py-2 text-slate-400">{r.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'outputs' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {OUTPUT_PATTERNS.map((p) => (
            <Card key={p.title} className="p-4">
              <p className="mb-2 text-sm font-semibold text-slate-100">{p.title}</p>
              <CodeBlock code={p.code} />
              <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</p>
              <pre className="code-block whitespace-pre-wrap text-emerald-300">{p.out}</pre>
            </Card>
          ))}
        </div>
      )}

      {tab === 'units' && (
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-slate-100">Memory &amp; storage units (binary convention, powers of 1024)</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-300"><tr><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-left">Equals</th></tr></thead>
              <tbody>
                {CONVERSIONS.map((c) => (
                  <tr key={c.unit} className="border-t border-white/5">
                    <td className="px-3 py-2 text-slate-200">{c.unit}</td>
                    <td className="px-3 py-2 text-slate-400">{c.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Note: storage manufacturers sometimes use decimal powers (1 KB = 1000 B). Always follow the convention stated in the question.</p>
        </Card>
      )}

      {tab === 'mistakes' && (
        <div className="space-y-3">
          {mistakeQuestions.length === 0 ? (
            <EmptyState icon={<RefreshCw size={22} />} title="No mistakes yet" message="Questions you answer incorrectly are collected here automatically for revision." action={<Link to="/practice?mode=quick" className="btn-primary mt-2">Start practising</Link>} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{mistakeQuestions.length} question(s) to review</p>
                <Link to="/practice?mode=weak" className="btn-soft">Practise all mistakes</Link>
              </div>
              {mistakeQuestions.map((q) => (
                <Card key={q.id} className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="chip">{q.chapterId.replace('ch', 'Ch ')}</span>
                    <span className="chip">{getTopic(q.topicId)?.title}</span>
                    <button className={cn('btn-ghost ml-auto !px-2.5 !py-1.5', isBookmarked(q.id) && '!text-amber-300')} onClick={() => toggleBookmark(q.id)}>
                      <Bookmark size={15} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{q.question}</p>
                  <p className="mt-2 text-xs text-emerald-300">Correct: {String(q.correctAnswer ?? q.modelAnswer)}</p>
                  <p className="mt-1 text-sm text-slate-400">{q.explanation}</p>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'quick' && card && (
        <div className="space-y-4">
          <SectionTitle icon={<Sparkles size={18} />} title="Quick revision mode" subtitle="Flip through one concept at a time" />
          <button
            onClick={() => setQuickFlipped((v) => !v)}
            className="card flex min-h-[220px] w-full flex-col items-center justify-center gap-3 p-8 text-center transition hover:border-brand-400/40"
          >
            <span className="text-xs uppercase tracking-wide text-brand-300">{card.chapter.number}. {card.topic.title}</span>
            {!quickFlipped ? (
              <span className="text-lg font-bold text-slate-100">Tap to reveal the definition</span>
            ) : (
              <span className="max-w-2xl text-[15px] leading-relaxed text-slate-200">{card.topic.content.formalDefinition}</span>
            )}
            {quickFlipped && card.topic.content.keywords?.length > 0 && (
              <span className="mt-2 flex flex-wrap justify-center gap-2">
                {card.topic.content.keywords.map((k, i) => <span key={i} className="chip">{k}</span>)}
              </span>
            )}
          </button>
          <div className="flex items-center justify-center gap-3">
            <button className="btn-ghost" onClick={() => { setQuickFlipped(false); setQuickIdx((i) => (i - 1 + deck.length) % deck.length); }}>Previous</button>
            <span className="text-sm text-slate-400">{quickIdx % deck.length + 1} / {deck.length}</span>
            <button className="btn-primary" onClick={() => { setQuickFlipped(false); setQuickIdx((i) => (i + 1) % deck.length); }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
