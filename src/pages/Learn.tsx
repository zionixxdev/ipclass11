import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { chapters, questionsByChapter } from '../data';
import { useProgress } from '../lib/store';
import { Card, ProgressBar } from '../components/ui';

export default function Learn() {
  const { state } = useProgress();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Learn Chapters</h1>
        <p className="mt-1 text-sm text-slate-400">Every syllabus topic, taught from the basics with Hinglish explanations, formal definitions, examples, tables, code and a topic quiz.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {chapters.map((ch) => {
          const learned = ch.topics.filter((t) => state.learnedTopics.includes(t.id)).length;
          const total = ch.topics.length;
          const completion = total ? Math.round((learned / total) * 100) : 0;
          const bank = (questionsByChapter[ch.id] || []).length;
          return (
            <Card key={ch.id} className="flex flex-col p-5 transition hover:border-brand-400/40">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-lg font-extrabold text-brand-200">
                    {ch.number}
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-100">{ch.title}</h2>
                    <p className="text-xs text-slate-400">{total} topics · {bank} questions</p>
                  </div>
                </div>
                {completion === 100 ? <CheckCircle2 className="text-emerald-400" size={20} /> : <Circle className="text-slate-600" size={20} />}
              </div>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{ch.summary}</p>
              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>{learned}/{total} topics learned</span>
                  <span className="font-semibold text-slate-300">{completion}%</span>
                </div>
                <ProgressBar value={completion} tone={completion === 100 ? 'green' : 'brand'} />
              </div>
              <div className="flex gap-2">
                <Link to={`/learn/${ch.id}`} className="btn-primary flex-1">
                  <BookOpen size={16} /> Open chapter
                </Link>
                <Link to={`/practice?mode=chapter&chapter=${ch.id}`} className="btn-ghost">
                  Practise <ArrowRight size={15} />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
