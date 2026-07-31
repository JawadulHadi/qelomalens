import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, FileSpreadsheet } from 'lucide-react';
import { DocumentInfo } from '../types.js';

interface DataVisualizerProps {
  facts?: { key: string; value: string; category?: string }[];
  doc?: DocumentInfo | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ facts = [], doc }) => {
  const [activeChart, setActiveChart] = useState<'financial' | 'structure'>('financial');

  // Parse monetary or numerical facts for the financial chart. Only ever
  // reflects facts genuinely extracted from this document — no invented
  // placeholder figures when there's nothing to chart yet. Requires a real
  // currency/percent signal (or an explicit "Financial" category from
  // EXTRACT_FACTS) rather than "contains any digit", which would otherwise
  // chart things like "4 years" or "2021 - Present" as dollar amounts.
  const financialData = facts
    .filter((fact) => {
      const val = fact.value;
      return (
        fact.category === 'Financial' ||
        val.includes('$') ||
        val.includes('€') ||
        val.includes('£') ||
        val.includes('%') ||
        /\b\d+(?:,\d{3})*(?:\.\d+)?\s?(?:USD|SGD|EUR|GBP)\b/i.test(val)
      );
    })
    .map((fact) => {
      const rawNum = fact.value.replace(/[^0-9.]/g, '');
      const parsedNum = parseFloat(rawNum) || 0;
      return {
        key: fact.key,
        displayValue: fact.value,
        amount: parsedNum,
      };
    })
    .filter((fact) => fact.amount > 0);

  // Document structure breakdown — every value here is a genuine count
  // derived from this document, never a placeholder shown as if real.
  const structureData = [
    { name: 'Extracted Facts', value: facts.length },
    ...(doc?.pageCount ? [{ name: 'Pages', value: doc.pageCount }] : []),
    ...(doc?.wordCount ? [{ name: 'Words (x100)', value: Math.max(1, Math.round(doc.wordCount / 100)) }] : []),
  ].filter((entry) => entry.value > 0);

  return (
    <div className="w-full bg-[var(--ol-panel)] border border-[var(--ol-border)] rounded-2xl p-4 flex flex-col gap-4 shadow-sm font-body">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ol-border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ol-accent)]/10 text-[var(--ol-accent)] border border-[var(--ol-accent)]/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-head font-bold text-xs text-[var(--ol-brand)]">Data Analytics & Visualization</h4>
            <p className="text-[10px] text-[var(--ol-muted)]">Interactive visual metrics derived from document facts</p>
          </div>
        </div>

        {/* Chart Switcher */}
        <div className="flex items-center bg-[var(--ol-surface)] p-1 rounded-lg border border-[var(--ol-border)] text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveChart('financial')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeChart === 'financial'
                ? 'bg-[var(--ol-accent)] text-white shadow-xs'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)]'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Monetary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('structure')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeChart === 'structure'
                ? 'bg-[var(--ol-accent)] text-white shadow-xs'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)]'
            }`}
          >
            <PieIcon className="w-3 h-3" />
            <span>Structure</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Display */}
      <div className="w-full h-52 sm:h-60 pt-2">
        {activeChart === 'financial' &&
          (financialData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="key" tick={{ fontSize: 10, fill: '#888' }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ol-panel)',
                    borderColor: 'var(--ol-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--ol-brand)',
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {financialData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-[var(--ol-muted)] italic px-6">
              No monetary values detected in this document yet — try EXTRACT_FACTS if you haven't already.
            </div>
          ))}

        {activeChart === 'structure' &&
          (structureData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={structureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {structureData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ol-panel)',
                    borderColor: 'var(--ol-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-[var(--ol-muted)] italic px-6">
              No structural data available for this document yet.
            </div>
          ))}
      </div>
    </div>
  );
};
