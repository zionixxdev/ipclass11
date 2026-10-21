import { cn } from '../lib/utils';
import { getDiagram } from '../data';

/**
 * Renders the inline SVG diagram for a topic (from src/data/diagrams.json).
 * The SVGs are authored to use `currentColor`, and the frame sets a colour
 * per theme, so a single diagram renders correctly in both light and dark.
 */
export function Diagram({ topicId, className }: { topicId: string; className?: string }) {
  const d = getDiagram(topicId);
  if (!d) return null;
  return (
    <figure className={cn('m-0', className)}>
      <div
        className="diagram-frame w-full overflow-hidden rounded-xl border border-white/10 p-3 sm:p-4"
        // The markup comes from our own bundled diagrams.json (trusted, authored
        // content) — no user input is ever injected here.
        dangerouslySetInnerHTML={{ __html: d.svg }}
      />
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">{d.title}.</span> {d.caption}
      </figcaption>
    </figure>
  );
}

export function hasDiagram(topicId: string): boolean {
  return !!getDiagram(topicId);
}
