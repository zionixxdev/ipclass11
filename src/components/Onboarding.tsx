import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, PartyPopper, Save, Sparkles, Target, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = [
  {
    icon: <PartyPopper size={26} />,
    title: 'Welcome to IPPrep 11!',
    body: 'Ye tumhara personal Class 11 Informatics Practices teacher hai — saare 8 chapters, 670 practice questions, aur ek Python Lab jahan tum real code chala sakte ho. Koi login nahi chahiye.',
    points: ['8 chapters, topic by topic', '670 questions with full explanations', 'Real Python running in your browser'],
  },
  {
    icon: <BookOpen size={26} />,
    title: 'Learn → Practise → Test',
    body: 'Har topic ke saath ek visual diagram, simple Hinglish explanation, aur exam-ready definition milti hai. Padhne ke baad usi topic ka practice karo — sab answers ke explanation ke saath.',
    points: ['Read the visual overview first', 'Mark a topic learned when you finish it', 'Practise the same topic straight away'],
  },
  {
    icon: <Terminal size={26} />,
    title: 'Write real Python',
    body: 'Python Lab me apna code likho aur chalao — sab kuch tumhare browser me hota hai. Python Examples me CBSE-style programs ka bada collection hai, har ek ka output aur explanation ke saath.',
    points: ['Run code without installing anything', '97 ready examples, one tap to run', 'Predict the output, then check'],
  },
  {
    icon: <Save size={26} />,
    title: 'Your progress saves itself',
    body: 'Jo bhi tum padhte aur solve karte ho, wo is device par automatically save ho jata hai. Dashboard par apni readiness dekho, aur weak topics par focus karo.',
    points: ['No account, no login', 'Dashboard shows your weak areas', 'Export your progress anytime in Settings'],
  },
];

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 animate-pop sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow">
            {step.icon}
          </div>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={onClose}>
            Skip
          </button>
        </div>

        <h2 className="text-xl font-extrabold text-slate-100">{step.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-300">{step.body}</p>

        <ul className="mt-4 space-y-2">
          {step.points.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-slate-400">
              <Sparkles size={14} className="shrink-0 text-brand-300" /> {p}
            </li>
          ))}
        </ul>

        {/* progress dots */}
        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((_, n) => (
            <span key={n} className={cn('h-1.5 rounded-full transition-all', n === i ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/20')} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {i > 0 && (
            <button className="btn-ghost" onClick={() => setI((v) => v - 1)}>
              Back
            </button>
          )}
          {!last ? (
            <button className="btn-primary ml-auto" onClick={() => setI((v) => v + 1)}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <Link to="/learn" className="btn-primary ml-auto" onClick={onClose}>
              <BookOpen size={16} /> Start learning
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4 text-xs text-slate-500">
          <Link to="/help" onClick={onClose} className="inline-flex items-center gap-1 hover:text-slate-300">
            <Target size={12} /> How to use this app
          </Link>
          <Link to="/mocks" onClick={onClose} className="inline-flex items-center gap-1 hover:text-slate-300">
            <GraduationCap size={12} /> Take a mock test
          </Link>
        </div>
      </div>
    </div>
  );
}
