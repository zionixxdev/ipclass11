import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ClipboardList, Play } from 'lucide-react';
import { getChapter, questionsByTopic } from '../data';
import { useProgress } from '../lib/store';
import { Card, ProgressBar } from '../components/ui';
import NotFound from './NotFound';

export default function ChapterView() {
  const { chapterId } = useParams();
  const chapter = chapterId ? getChapter(chapterId) : undefined;
  const { state } = useProgress();
  if (!chapter) return <NotFound />;

  const learned = chapter.topics.filter((t) => state.learnedTopics.includes(t.id)).length;
  const completion = Math.round((learned / chapter.topics.length) * 100);

  return (
    <div className="space-y-6">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} /> All chapters
      </Link>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-xl font-extrabold text-brand-200">
            {chapter.number}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-slate-100 sm:text-2xl">{chapter.title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{chapter.summary}</p>
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>{learned}/{chapter.topics.length} topics learned</span>
                <span className="font-semibold text-slate-300">{completion}%</span>
              </div>
              <ProgressBar value={completion} tone={completion === 100 ? 'green' : 'brand'} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/practice?mode=chapter&chapter=${chapter.id}`} className="btn-primary">
            <ClipboardList size={16} /> Practise this chapter
          </Link>
          <Link to={`/learn/${chapter.id}/${chapter.topics[0].id}`} className="btn-ghost">
            <Play size={16} /> Start from topic 1
          </Link>
        </div>
      </Card>

      <div className="space-y-3">
        {chapter.topics.map((t, i) => {
          const isLearned = state.learnedTopics.includes(t.id);
          const bank = (questionsByTopic[t.id] || []).length;
          return (
            <Link key={t.id} to={`/learn/${chapter.id}/${t.id}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-400/40">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-sm font-bold text-slate-300">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-100">{t.title}</div>
                <div className="text-xs text-slate-400">{bank} questions · {isLearned ? 'learned' : 'not started'}</div>
              </div>
              {isLearned ? <CheckCircle2 className="shrink-0 text-emerald-400" size={20} /> : <Circle className="shrink-0 text-slate-600" size={20} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
