import { useRef, useState } from 'react';
import { Download, Moon, RotateCcw, Sparkles, Sun, Upload, User } from 'lucide-react';
import { useProgress } from '../lib/store';
import { ONBOARD_KEY, PROGRESS_KEY } from '../lib/storage';
import { Card, SectionTitle, Toggle } from '../components/ui';
import { toISODate } from '../lib/utils';

export default function SettingsPage() {
  const { state, updateSettings, exportData, resetProgress } = useProgress();
  const { settings } = state;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [tourMsg, setTourMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== 'object') throw new Error('bad');
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
        setImportMsg('Imported successfully. Reloading…');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setImportMsg('That file could not be read as an IPPrep progress export.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Preferences are stored locally on this device. No account or login is required.</p>
      </div>

      <Card className="p-5">
        <SectionTitle icon={<User size={18} />} title="Profile & exam" />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Your name (optional)</label>
            <input className="input" value={settings.name} placeholder="e.g. Aditya" onChange={(e) => updateSettings({ name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Exam date</label>
              <input type="date" className="input" value={settings.examDate} min={toISODate(new Date())} onChange={(e) => updateSettings({ examDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Default long-answer marks</label>
              <input type="number" min={1} max={10} className="input" value={settings.laMarks} onChange={(e) => updateSettings({ laMarks: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Appearance & content" />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon size={18} className="text-brand-300" /> : <Sun size={18} className="text-amber-300" />}
              <div>
                <p className="text-sm font-medium text-slate-200">Theme</p>
                <p className="text-xs text-slate-400">Currently {settings.theme === 'dark' ? 'dark' : 'light'}</p>
              </div>
            </div>
            <button className="btn-ghost" onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
              Switch to {settings.theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Hinglish explanations</p>
              <p className="text-xs text-slate-400">Show the simple Hinglish explanation on topic pages</p>
            </div>
            <Toggle checked={settings.showHinglish} onChange={(v) => updateSettings({ showHinglish: v })} label="Hinglish" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-200"><Sparkles size={14} className="text-brand-300" /> Welcome tour</p>
              <p className="text-xs text-slate-400">Show the 4-step introduction again</p>
            </div>
            <button
              className="btn-ghost"
              onClick={() => {
                try {
                  localStorage.removeItem(ONBOARD_KEY);
                } catch {
                  /* ignore */
                }
                setTourMsg('The welcome tour will appear again next time you open the app.');
              }}
            >
              Show tour
            </button>
          </div>
          {tourMsg && <p className="text-sm text-brand-300">{tourMsg}</p>}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Data & privacy" />
        <p className="mb-3 text-sm text-slate-400">Everything you do is stored in your browser's local storage. Nothing is sent to a server.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportData}><Download size={16} /> Export progress</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import progress</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); }}
          />
        </div>
        {importMsg && <p className="mt-2 text-sm text-amber-300">{importMsg}</p>}

        <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/5 p-4">
          <p className="text-sm font-semibold text-rose-200">Reset all progress</p>
          <p className="mt-1 text-xs text-rose-200/80">Permanently clears learned topics, attempts, bookmarks, mistakes and mock results on this device.</p>
          {!confirmReset ? (
            <button className="btn-ghost mt-3 !border-rose-400/30 !text-rose-200" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} /> Reset progress…
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn !bg-rose-600 text-white" onClick={() => { resetProgress(); setConfirmReset(false); }}>Yes, reset everything</button>
              <button className="btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500">IPPrep 11 · Built for Class 11 Informatics Practices (IP). Practice content only — not official CBSE material.</p>
    </div>
  );
}
