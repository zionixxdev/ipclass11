import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { chapters, questions as ALL, getTopic } from '../data';
import type { QuestionType } from '../data/types';
import { QUESTION_TYPE_LABELS } from '../data/types';
import { useProgress } from '../lib/store';
import { cn } from '../lib/utils';
import { Card, EmptyState } from '../components/ui';
import { QuestionCard } from '../components/QuestionCard';

export default function Bookmarks() {
  const { state, isBookmarked, toggleBookmark } = useProgress();
  const [chapterFilter, setChapterFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const list = useMemo(() => {
    let qs = ALL.filter((q) => state.bookmarks.includes(q.id));
    if (chapterFilter) qs = qs.filter((q) => q.chapterId === chapterFilter);
    if (typeFilter) qs = qs.filter((q) => q.type === typeFilter);
    return qs;
  }, [state.bookmarks, chapterFilter, typeFilter]);

  if (state.bookmarks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Bookmarks</h1>
        <EmptyState
          icon={<BookMarked size={22} />}
          title="No bookmarks yet"
          message="Tap the bookmark icon on any question to save it here for quick revision."
          action={<Link to="/practice?mode=quick" className="btn-primary mt-2">Browse questions</Link>}
        />
      </div>
    );
  }

  const usedChapters = [...new Set(ALL.filter((q) => state.bookmarks.includes(q.id)).map((q) => q.chapterId))];
  const usedTypes = [...new Set(ALL.filter((q) => state.bookmarks.includes(q.id)).map((q) => q.type))] as QuestionType[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Bookmarks</h1>
        <p className="mt-1 text-sm text-slate-400">{state.bookmarks.length} saved question(s). Answers and explanations are shown below.</p>
      </div>

      <Card className="flex flex-wrap gap-3 p-3">
        <select className="input !w-auto" value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
          <option value="">All chapters</option>
          {usedChapters.map((cid) => {
            const ch = chapters.find((c) => c.id === cid);
            return <option key={cid} value={cid}>Ch {ch?.number}: {ch?.title}</option>;
          })}
        </select>
        <select className="input !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {usedTypes.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
        </select>
        <Link to="/practice?mode=revision" className={cn('btn-soft ml-auto')}>Practise bookmarks</Link>
      </Card>

      {list.length === 0 ? (
        <EmptyState icon={<BookMarked size={22} />} title="Nothing matches" message="No bookmarks match the selected filters." />
      ) : (
        <div className="space-y-4">
          {list.map((q) => (
            <div key={q.id}>
              <p className="mb-1.5 text-xs text-slate-500">{getTopic(q.topicId)?.title}</p>
              <QuestionCard
                q={q}
                answer={undefined}
                onAnswer={() => {}}
                revealed
                bookmark={isBookmarked(q.id)}
                onBookmark={() => toggleBookmark(q.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
