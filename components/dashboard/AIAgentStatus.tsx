'use client'

const AGENTS = [
  { name: 'Vision Analyzer',         color: '#E8621A', confidence: 94, lastRun: '2 min ago',  desc: 'Photo → category & severity' },
  { name: 'Duplicate Detector',      color: '#8B5CF6', confidence: 98, lastRun: '2 min ago',  desc: 'pgvector similarity search'  },
  { name: 'Decay Prediction',        color: '#F5A623', confidence: 89, lastRun: '5 min ago',  desc: '0–100 urgency scoring'       },
  { name: 'Authority Finder',        color: '#3B82F6', confidence: 96, lastRun: '2 min ago',  desc: 'Nominatim reverse geocode'   },
  { name: 'Resolution Planner',      color: '#2ECC71', confidence: 91, lastRun: '12 min ago', desc: '5-step action plan'          },
  { name: 'RTI Generation',          color: '#E74C3C', confidence: 97, lastRun: '18 min ago', desc: 'RTI Act 2005 application'    },
]

export default function AIAgentStatus() {
  return (
    <div className="border-b border-[#2E2E2E]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
        <span className="text-[11px] font-medium text-white">AI Agent Status</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2ECC71]" />
          </span>
          <span className="text-[9px] text-[#2ECC71]">All agents online</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-[#2E2E2E]">
        {AGENTS.map((agent, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-[#2E2E2E] last:border-b-0 sm:border-r sm:last:border-r-0 lg:nth-child-3n:border-r-0 hover:bg-[#1C1C1C] transition-colors">
            {/* Pulse dot */}
            <div className="relative shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: agent.color }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ background: agent.color }} />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-medium text-white truncate">{agent.name}</span>
                <span className="text-[9px] text-[#2ECC71] shrink-0 font-medium">Online</span>
              </div>
              <p className="text-[9px] text-[#555] m-0 mb-1.5">{agent.desc} · {agent.lastRun}</p>
              {/* Confidence bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-0.5 bg-[#2E2E2E] rounded-full">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ background: agent.color, width: `${agent.confidence}%` }} />
                </div>
                <span className="text-[9px] shrink-0" style={{ color: agent.color }}>{agent.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
