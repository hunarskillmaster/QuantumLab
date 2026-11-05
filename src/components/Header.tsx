import React from 'react';
import { PhysicsCategory } from '../types/physics';
import { Volume2, VolumeX, Download, Atom } from 'lucide-react';

interface HeaderProps {
  activeCategory: PhysicsCategory;
  onSelectCategory: (category: PhysicsCategory) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExportCSV: () => void;
  experimentName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  audioEnabled,
  onToggleAudio,
  onExportCSV,
  experimentName,
}) => {
  const categories: { id: PhysicsCategory; label: string }[] = [
    { id: 'mechanics', label: 'Mechanics' },
    { id: 'waves', label: 'Waves & Optics' },
    { id: 'electromagnetism', label: 'Electromagnetism' },
    { id: 'thermodynamics', label: 'Thermodynamics' },
    { id: 'quantum', label: 'Quantum & Astro' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950/50">
          <Atom className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            QuantumLab
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Interactive Physics Sandbox
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-medium">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-cyan-400 font-semibold'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Mute Laboratory Audio' : 'Enable Laboratory Audio Synthesizer'}
          className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
            audioEnabled
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800 hover:bg-cyan-900/60'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{audioEnabled ? 'Audio ON' : 'Muted'}</span>
        </button>

        <button
          onClick={onExportCSV}
          title={`Download real-time telemetry log for ${experimentName} as CSV`}
          className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
};
