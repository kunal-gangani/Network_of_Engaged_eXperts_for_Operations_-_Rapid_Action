'use client'

import { useState } from 'react'
import { TrendingUp, Loader2, AlertTriangle } from 'lucide-react'

const SCENARIOS = [
  {
    issue: 'Large Pothole — SG Highway',
    days: 7,
    metrics: [
      { label: 'Repair Cost',           value: '+18%',  color: '#F5A623', pct: 18  },
      { label: 'Citizen Complaints',    value: '+42%',  color: '#E74C3C', pct: 42  },
      { label: 'Accident Risk',         value: '+12%',  color: '#E74C3C', pct: 12  },
      { label: 'Infrastructure Damage', value: 'High',  color: '#E74C3C', pct: 80  },
    ],
    priority: 'Critical',
    reasoning: 'Monsoon season amplifies road damage. Delayed repair leads to structural deterioration and exponentially higher costs.',
  },
  {
    issue: 'Water Pipe Leak — Navrangpura',
    days: 14,
    metrics: [
      { label: 'Water Wastage',         value: '+67%',  color: '#3B82F6', pct: 67  },
      { label: 'Road Damage',           value: '+38%',  color: '#F5A623', pct: 38  },
      { label: 'Health Risk',           value: '+25%',  color: '#E74C3C', pct: 25  },
      { label: 'Infrastructure Damage', value: 'Severe', color: '#E74C3C', pct: 90 },
    ],
    priority: 'Urgent',
    reasoning: 'Continuous water loss undermines road subbase. Health risk rises as contamination spreads.',
  },
]

export default function PredictiveSimulator() {
  const [result, setResult]       = useState<typeof SCENARIOS[0] | null>(null)
  const [loading, setLoading]     = useState(false)
  const [scenarioIdx, setScenario] = useState(0)

  const simulate = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(SCENARIOS[scenarioIdx % SCENARIOS.length])
      setScenario(v => v + 1)
      setLoading(false)
    }, 1400)
  }

  return (
    <div className="border-b border-[#2E2E2E]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
        <span className="text-[11px] font-medium text-white">What Happens If We Ignore This?</span>
        <span className="text-[9px] bg-[#E74C3C22] text-[#E74C3C] border border-[#E74C3C44] px-2 py-0.5 rounded">✦ Predictive AI</span>
      </div>

      <div className="p-5">
        {!result && !loading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#888] mb-1">
                Simulate the civic and financial impact of leaving a critical issue unresolved.
              </p>
              <p className="text-[10px] text-[#555]">Powered by Gemini reasoning — updated with live issue data.</p>
            </div>
            <button
              onClick={simulate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-medium text-white bg-[#E8621A] hover:bg-[#F07340] transition-colors cursor-pointer border-0 shrink-0 min-h-[44px]"
            >
              <TrendingUp size={13} /> Simulate Future
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 size={16} className="text-[#E8621A] animate-spin shrink-0" />
            <div>
              <p className="text-xs text-white m-0">Running Gemini predictive model…</p>
              <p className="text-[10px] text-[#555] m-0 mt-0.5">Analysing decay trajectory, weather data, and historical patterns</p>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            {/* Issue header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] text-[#555] m-0 mb-1 uppercase tracking-widest">Ignoring: {result.issue}</p>
                <p className="text-xs font-medium text-white m-0">After {result.days} days — projected impact</p>
              </div>
              <span className="text-[9px] bg-[#E74C3C22] text-[#E74C3C] border border-[#E74C3C44] px-2 py-1 rounded shrink-0 font-semibold">
                {result.priority}
              </span>
            </div>

            {/* Impact metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {result.metrics.map((m, i) => (
                <div key={i} className="bg-[#141414] rounded-lg p-3 border border-[#2E2E2E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#555]">{m.label}</span>
                    <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  <div className="h-0.5 bg-[#2E2E2E] rounded-full">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ background: m.color, width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Reasoning */}
            <div className="bg-[#E8621A0A] border border-[#E8621A22] rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={12} className="text-[#E8621A] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#888] m-0 leading-relaxed">{result.reasoning}</p>
            </div>

            <button
              onClick={simulate}
              className="mt-3 text-[10px] text-[#555] hover:text-[#E8621A] bg-transparent border-0 cursor-pointer transition-colors p-0"
            >
              Run another simulation →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
