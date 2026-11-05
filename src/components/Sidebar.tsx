import React, { useState, useMemo } from 'react';
import { ExperimentDef, PhysicsCategory } from '../types/physics';
import { PHYSICS_CATEGORIES } from '../data/experiments';
import { Search, ChevronDown, ChevronRight, Compass, Activity, Zap, Flame, Atom } from 'lucide-react';

interface SidebarProps {
  experiments: ExperimentDef[];
  activeExperimentId: string;
  onSelectExperiment: (id: string) => void;
  activeCategory: PhysicsCategory;
  onSelectCategory: (category: PhysicsCategory) => void;
}

const CATEGORY_ICONS: Record<PhysicsCategory, React.ComponentType<{ className?: string }>> = {
  mechanics: Compass,
  waves: Activity,
  electromagnetism: Zap,
  thermodynamics: Flame,
  quantum: Atom,
};

export const Sidebar: React.FC<SidebarProps> = ({
  experiments,
  activeExperimentId,
  onSelectExperiment,
  activeCategory,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    mechanics: true,
    waves: true,
    electromagnetism: true,
    thermodynamics: true,
    quantum: true,
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const filteredExperiments = useMemo(() => {
    if (!searchQuery.trim()) return experiments;
    const q = searchQuery.toLowerCase();
    return experiments.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [experiments, searchQuery]);

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col h-[calc(100vh-53px)] select-none">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 20 physics experiments..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Experiments Accordion Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {PHYSICS_CATEGORIES.map((cat) => {
          const catExperiments = filteredExperiments.filter((e) => e.category === cat.id);
          if (catExperiments.length === 0) return null;

          const isExpanded = expandedCategories[cat.id] ?? true;
          const Icon = CATEGORY_ICONS[cat.id] || Compass;

          return (
            <div key={cat.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => {
                  toggleCategory(cat.id);
                  onSelectCategory(cat.id);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 text-left rounded-md hover:bg-slate-900/60 transition-colors text-slate-300 group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                  <span className="text-xs font-semibold text-slate-200 tracking-tight">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                  <span>{catExperiments.length}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {/* Experiments list */}
              {isExpanded && (
                <div className="pl-3 space-y-0.5 border-l border-slate-800/60 ml-3">
                  {catExperiments.map((exp) => {
                    const isActive = exp.id === activeExperimentId;
                    // Find index in main list for natural editorial numbering
                    const overallIndex = experiments.findIndex((e) => e.id === exp.id) + 1;
                    const paddedIdx = overallIndex < 10 ? `0${overallIndex}` : `${overallIndex}`;

                    return (
                      <button
                        key={exp.id}
                        onClick={() => {
                          onSelectExperiment(exp.id);
                          onSelectCategory(exp.category);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-baseline gap-2 ${
                          isActive
                            ? 'bg-cyan-950/60 text-cyan-200 font-medium border border-cyan-800/70 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {paddedIdx}.
                        </span>
                        <div className="truncate">
                          <div className="truncate text-[12px]">{exp.name}</div>
                          <div className="text-[10px] text-slate-500 truncate font-normal">
                            {exp.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span>20 ACTIVE LABS</span>
        <span className="text-cyan-400">60 FPS RUNTIME</span>
      </div>
    </aside>
  );
};
