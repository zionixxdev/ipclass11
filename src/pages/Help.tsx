import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  BookMarked,
  CalendarDays,
  ClipboardList,
  Code2,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Target,
  Terminal,
  Trophy,
} from 'lucide-react';
import { Card, SectionTitle } from '../components/ui';

const STEPS = [
  {
    icon: <BookOpen size={20} />,
    title: '1. Learn one topic',
    text: 'Open Learn Chapters and pick a chapter. Read the visual overview, the simple Hinglish explanation and the formal definition. When you are done, tap “Mark as learned” — a topic only counts as learned when you say so.',
    to: '/learn',
    cta: 'Open Learn Chapters',
  },
  {
    icon: <Target size={20} />,
    title: '2. Practise that topic',
    text: 'At the bottom of every topic press “Practice this topic”. In learning mode you get instant feedback and a full explanation after each answer.',
    to: '/practice?mode=quick',
    cta: 'Try a quick practice',
  },
  {
    icon: <Terminal size={20} />,
    title: '3. Run the code yourself',
    text: 'Use the Python Lab to write and run real Python in your browser, or open any program from Python Examples and press “Run in Lab”. Predicting the output before you run it is the single best exam habit.',
    to: '/lab',
    cta: 'Open Python Lab',
  },
  {
    icon: <GraduationCap size={20} />,
    title: '4. Test yourself',
    text: 'When a few chapters are done, take a Mock Test. Objective questions are scored automatically and descriptive ones show model answers so you can mark yourself honestly.',
    to: '/mocks',
    cta: 'Take a mock test',
  },
];

const SECTIONS = [
  { icon: <BarChart3 size={16} />, name: 'Dashboard', text: 'Your readiness at a glance, plus a recommended next step.' },
  { icon: <BookOpen size={16} />, name: 'Learn Chapters', text: 'All 8 chapters, topic by topic, with diagrams, definitions and a topic quiz.' },
  { icon: <ClipboardList size={16} />, name: 'Practice Questions', text: 'Build a custom set by chapter, type, difficulty, or focus on weak areas and mistakes.' },
  { icon: <Terminal size={16} />, name: 'Python Lab', text: 'Write and run real Python. Includes ready-made sample programs.' },
  { icon: <Code2 size={16} />, name: 'Python Examples', text: 'A large library of CBSE-style programs with output and explanation.' },
  { icon: <GraduationCap size={16} />, name: 'Mock Tests', text: 'Timed, section-wise papers with automatic scoring and analysis.' },
  { icon: <RefreshCw size={16} />, name: 'Revision', text: 'Notes, definitions, cheat sheets, your mistake notebook and flashcards.' },
  { icon: <BarChart3 size={16} />, name: 'Progress', text: 'Charts of your accuracy, weak subtopics and mock-test history.' },
  { icon: <BookMarked size={16} />, name: 'Bookmarks', text: 'Every question you saved, with answers and explanations.' },
  { icon: <HelpCircle size={16} />, name: 'Help', text: 'This page — how to use the app and how to study.' },
];

const PLAN = [
  { day: 'Day 1–2', work: 'Chapter 1 & 2 (theory). Read every topic, mark them learned, then do 10 practice questions per chapter.' },
  { day: 'Day 3–4', work: 'Chapter 3 & 4. In the Python Lab, retype every code example instead of copying it.' },
  { day: 'Day 5–6', work: 'Chapter 5 (data types & operators). Focus on output-based questions — operator precedence trips everyone up.' },
  { day: 'Day 7–8', work: 'Chapter 6 (conditions & loops). Write at least 5 programs from scratch before looking at the model solution.' },
  { day: 'Day 9', work: 'Chapter 7 (errors). Practise the “Find and correct the error” questions until you can name the error type instantly.' },
  { day: 'Day 10–11', work: 'Chapter 8 (lists). Drill indexing and slicing — draw the list on paper with index numbers.' },
  { day: 'Day 12+', work: 'Revision + full mock tests. Use Weak Areas practice and your Mistake Notebook every single day.' },
];

export default function Help() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Help &amp; How to Use</h1>
        <p className="mt-1 text-sm text-slate-400">
          New here? Follow the four steps below. Everything is saved on your own device — no login needed.
        </p>
      </div>

      {/* Quick start */}
      <div>
        <SectionTitle icon={<ListChecks size={18} />} title="Quick start in 4 steps" />
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <Card key={s.title} className="flex flex-col p-5">
              <div className="mb-3 inline-flex rounded-xl bg-brand-500/15 p-2 text-brand-300">{s.icon}</div>
              <h3 className="font-bold text-slate-100">{s.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
              <Link to={s.to} className="btn-soft mt-3 self-start">{s.cta}</Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Section guide */}
      <Card className="p-5">
        <SectionTitle icon={<BookOpen size={18} />} title="What each section does" />
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.name} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="mt-0.5 shrink-0 text-brand-300">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                <p className="text-xs text-slate-400">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Study plan */}
      <Card className="p-5">
        <SectionTitle icon={<CalendarDays size={18} />} title="A suggested 12-day study plan" subtitle="Adjust it to your own exam date — set it on the Dashboard" />
        <ol className="space-y-3">
          {PLAN.map((p, i) => (
            <li key={p.day} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-200">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-slate-200">{p.day}</p>
                <p className="text-sm text-slate-400">{p.work}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Exam tips */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={<Lightbulb size={18} />} title="Study habits that actually work" />
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• <b>Retype code, never copy it.</b> Typing forces you to notice the syntax — quotes, colons and brackets.</li>
            <li>• <b>Predict before you run.</b> Write the expected output on paper, then check it in the Lab.</li>
            <li>• <b>Trace loops on paper.</b> Make a small table of the loop variable's value each time round.</li>
            <li>• <b>Use the Mistake Notebook daily.</b> It fills up automatically with every question you get wrong.</li>
            <li>• <b>Do short sessions often.</b> Two 25-minute sessions beat one long tired one.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle icon={<Trophy size={18} />} title="In the exam hall" />
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Read the whole paper once, then start with the questions you are most confident about.</li>
            <li>• For “predict the output”, write the output line by line — one mark often comes per line.</li>
            <li>• For programming questions, write the input, the process and the output clearly. Add comments.</li>
            <li>• Watch indentation in Python — it carries marks.</li>
            <li>• If you get an error question, name the error type (syntax / runtime / logical) and then fix it.</li>
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle icon={<HelpCircle size={18} />} title="Common questions" />
        <div className="space-y-3">
          {[
            { q: 'Do I need to create an account?', a: 'No. There is no login. Your progress, bookmarks and mistakes are saved in your browser on this device.' },
            { q: 'Will my progress be lost if I switch devices?', a: 'Yes — progress lives on one device. Use Settings → Export progress to save a file, then Import it on another device.' },
            { q: 'Is the Python Lab safe?', a: 'Yes. Your code runs inside your own browser using a WebAssembly build of Python. Nothing is sent to a server.' },
            { q: 'Are these official CBSE questions?', a: 'No. Everything here is original practice material written to match the syllabus. It is not an official CBSE paper or prediction.' },
            { q: 'The Python Lab says the runtime is unavailable — what now?', a: 'That happens when you are offline. You can still read every sample program and the expected output, and use the Python Examples library to study.' },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-slate-200">Q. {f.q}</p>
              <p className="mt-1 text-sm text-slate-400">A. {f.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
