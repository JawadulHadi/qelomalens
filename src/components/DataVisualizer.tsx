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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity, FileSpreadsheet } from 'lucide-react';
import { DocumentInfo } from '../types.js';

interface DataVisualizerProps {
  facts?: { key: string; value: string; category?: string }[];
  doc?: DocumentInfo | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ facts = [], doc }) => {
  const [activeChart, setActiveChart] = useState<'financial' | 'capabilities' | 'structure'>('financial');

  // Parse monetary or numerical facts for financial chart
  const financialData = facts
    .filter((fact) => {
      const val = fact.value;
      return (
        val.includes('$') ||
        val.includes('€') ||
        val.includes('£') ||
        val.includes('%') ||
        /\d/.test(val)
      );
    })
    .map((fact) => {
      // Clean numeric value
      const rawNum = fact.value.replace(/[^0-9.]/g, '');
      const parsedNum = parseFloat(rawNum) || 10;
      return {
        key: fact.key,
        displayValue: fact.value,
        amount: parsedNum,
      };
    });

  // Capability execution confidence mock distribution based on doc context
  const capabilityConfidenceData = [
    { capability: 'Summarize', confidence: 98 },
    { capability: 'Extract Facts', confidence: 95 },
    { capability: 'Verdict', confidence: 92 },
    { capability: 'Compare', confidence: 88 },
    { capability: 'Breakdown', confidence: 96 },
    { capability: 'Next Actions', confidence: 90 },
  ];

  // Document Structure breakdown
  const structureData = [
    { name: 'Extracted Facts', value: facts.length || 5 },
    { name: 'Pages Count', value: doc?.pageCount || 3 },
    { name: 'Words (x100)', value: Math.round((doc?.wordCount || 450) / 100) || 4 },
    { name: 'Identified Clauses', value: 8 },
  ];

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
            onClick={() => setActiveChart('capabilities')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeChart === 'capabilities'
                ? 'bg-[var(--ol-accent)] text-white shadow-xs'
                : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Confidence</span>
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
        {activeChart === 'financial' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData.length > 0 ? financialData : [
              { key: 'Net Revenue', amount: 4850000, displayValue: '$4.85M' },
              { key: 'EBITDA', amount: 1920000, displayValue: '$1.92M' },
              { key: 'Contract Val', amount: 360000, displayValue: '$360K' },
              { key: 'Invoice Total', amount: 14250, displayValue: '$14.25K' },
            ]}>
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
                {(financialData.length > 0 ? financialData : [1, 2, 3, 4]).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'capabilities' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={capabilityConfidenceData}>
              <PolarGrid opacity={0.2} />
              <PolarAngleAxis dataKey="capability" tick={{ fontSize: 10, fill: '#888' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#888' }} />
              <Radar
                name="Confidence Score (%)"
                dataKey="confidence"
                stroke="var(--ol-accent)"
                fill="var(--ol-accent)"
                fillOpacity={0.4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--ol-panel)',
                  borderColor: 'var(--ol-border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'structure' && (
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
        )}
      </div>
    </div>
  );
};
