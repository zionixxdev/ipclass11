import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

const KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except',
  'finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try',
  'while','with','yield',
]);
const BUILTINS = new Set([
  'print','input','len','range','int','float','str','bool','list','tuple','dict','set','type','sum','min','max','abs',
  'sorted','append','extend','insert','remove','pop','clear','index','count','reverse','sort','copy','enumerate','zip',
  'map','filter','id','isinstance','format','open','round','divmod','ord','chr',
]);

type Tok = { t: string; c: string };

const RE = /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|\b(\d+\.?\d*)\b|\b([A-Za-z_]\w*)\b/g;

function tokenize(code: string): Tok[] {
  const out: Tok[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    if (m.index > last) out.push({ t: code.slice(last, m.index), c: '' });
    if (m[1]) out.push({ t: m[1], c: 'tok-com' });
    else if (m[2]) out.push({ t: m[2], c: 'tok-str' });
    else if (m[3]) out.push({ t: m[3], c: 'tok-num' });
    else if (m[4]) {
      const w = m[4];
      const after = code.slice(RE.lastIndex);
      if (KEYWORDS.has(w)) out.push({ t: w, c: 'tok-kw' });
      else if (BUILTINS.has(w)) out.push({ t: w, c: 'tok-bi' });
      else if (/^\s*\(/.test(after)) out.push({ t: w, c: 'tok-fn' });
      else out.push({ t: w, c: '' });
    }
    last = RE.lastIndex;
  }
  if (last < code.length) out.push({ t: code.slice(last), c: '' });
  return out;
}

export function CodeBlock({ code, className, showCopy = true }: { code: string; className?: string; showCopy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const toks = React.useMemo(() => tokenize(code ?? ''), [code]);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className={cn('relative', className)}>
      {showCopy && (
        <button
          onClick={copy}
          className="absolute right-2 top-2 z-10 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:text-slate-100"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
      <pre className="code-block">
        <code>
          {toks.map((tk, i) =>
            tk.c ? (
              <span key={i} className={tk.c}>
                {tk.t}
              </span>
            ) : (
              <React.Fragment key={i}>{tk.t}</React.Fragment>
            )
          )}
        </code>
      </pre>
    </div>
  );
}
