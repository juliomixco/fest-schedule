import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFestivalStore } from '../../stores';
import { findParser } from '../../parsers';
import type { Festival } from '../../types';

export function FestivalManager() {
  const { festivals, activeFestivalId, addFestival, updateFestival, removeFestival, setActiveFestival } =
    useFestivalStore();
  const [importUrl, setImportUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  async function handleUrlImport() {
    const parser = findParser(importUrl);
    if (!parser) {
      setError('No parser available for this URL.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const festival = await parser.parse(importUrl);
      await addFestival(festival);
      setImportUrl('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const festival: Festival = JSON.parse(text);
      if (!festival.id) festival.id = uuidv4();
      await addFestival(festival);
    } catch {
      setError('Invalid JSON file.');
    }
    e.target.value = '';
  }

  async function handleRename(id: string) {
    const festival = festivals.find((f) => f.id === id);
    if (!festival) return;
    await updateFestival({ ...festival, name: renameValue });
    setRenamingId(null);
  }

  return (
    <div className="p-4 space-y-6 text-white">
      <h2 className="text-lg font-bold">Festivals</h2>

      {/* Festival list */}
      <ul className="space-y-2">
        {festivals.map((f) => (
          <li
            key={f.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors
              ${f.id === activeFestivalId ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'}`}
            onClick={() => setActiveFestival(f.id)}
          >
            {renamingId === f.id ? (
              <input
                className="flex-1 bg-neutral-600 rounded px-2 py-0.5 text-sm"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(f.id); if (e.key === 'Escape') setRenamingId(null); }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate text-sm">{f.name}</span>
            )}
            <button
              className="text-xs text-neutral-400 hover:text-white px-1"
              onClick={(e) => { e.stopPropagation(); setRenamingId(f.id); setRenameValue(f.name); }}
              title="Rename"
            >✏</button>
            <button
              className="text-xs text-red-400 hover:text-red-300 px-1"
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${f.name}"?`)) removeFestival(f.id); }}
              title="Delete"
            >✕</button>
          </li>
        ))}
        {festivals.length === 0 && <p className="text-sm text-neutral-500">No festivals yet. Import one below.</p>}
      </ul>

      {/* URL import */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-300">Import from URL</label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-neutral-800 rounded px-3 py-2 text-sm placeholder-neutral-500"
            placeholder="https://www.graspop.be/en/line-up/thursday/schedule"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
          />
          <button
            className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            onClick={handleUrlImport}
            disabled={loading || !importUrl}
          >
            {loading ? '...' : 'Import'}
          </button>
        </div>
      </div>

      {/* JSON import */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-300">Import from JSON</label>
        <input type="file" accept=".json" className="text-sm text-neutral-300" onChange={handleJsonImport} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
