import { motion } from "motion/react";
import { Clock, Hourglass } from "lucide-react";
import { GanttBlock } from "../types.ts";

interface GanttChartProps {
  ganttChart: GanttBlock[];
  currentTime: number;
  totalTime: number;
}

export default function GanttChart({ ganttChart, currentTime, totalTime }: GanttChartProps) {
  // If no blocks are available
  if (!ganttChart || ganttChart.length === 0 || totalTime === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center italic text-slate-500">
        Run simulation to generate Gantt timeline chart.
      </div>
    );
  }

  // Safe percentage calculation
  const getPct = (value: number) => {
    return (value / totalTime) * 100;
  };

  // Generate tick markers. If totalTime is large, show ticks every 2, 5, or 10 units.
  const getTickInterval = () => {
    if (totalTime <= 15) return 1;
    if (totalTime <= 40) return 2;
    if (totalTime <= 100) return 5;
    return 10;
  };

  const ticks: number[] = [];
  const interval = getTickInterval();
  for (let i = 0; i <= totalTime; i += interval) {
    ticks.push(i);
  }
  // Make sure the absolute last time unit gets a tick if it's not already aligned
  if (ticks[ticks.length - 1] !== totalTime) {
    ticks.push(totalTime);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-slate-100 shadow-xl" id="gantt-chart">
      <div className="flex items-center justify-between gap-3 pb-3 mb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" /> CPU Gantt Chart Timeline
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Synchronized execution tracking. The white cursor displays the active simulated playback clock position.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
          Total Time: <strong className="text-emerald-400">{totalTime} units</strong>
        </div>
      </div>

      {/* Gantt Bar container */}
      <div className="relative pt-2 pb-6">
        
        {/* Horizontal bar wrapping all blocks */}
        <div className="relative w-full h-14 bg-slate-950 rounded-xl border border-slate-800 flex overflow-hidden shadow-inner cursor-pointer select-none">
          {ganttChart.map((block, idx) => {
            const widthPct = getPct(block.endTime - block.startTime);
            const isIdle = block.processId === "IDLE";
            const isContextSwitch = isIdle && block.color === "#b91c1c"; // RED color set we configured
            
            return (
              <div
                key={`${block.processId}-${idx}`}
                className="relative h-full border-r border-slate-950/40 flex flex-col items-center justify-center transition-all group overflow-hidden"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: block.color,
                }}
              >
                {/* Visual tooltip pop */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Text inside block */}
                <span className="font-mono font-black text-xs md:text-sm text-slate-950 tracking-wider text-shadow truncate px-1">
                  {isContextSwitch ? "CS" : block.processId}
                </span>

                <span className="hidden group-hover:block absolute bottom-1 text-[8px] md:text-[9px] font-mono leading-none bg-slate-950 text-slate-200 px-1 py-0.5 rounded border border-slate-800 z-20">
                  {block.startTime}-{block.endTime}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating Playback Overlay Cursor Line */}
        <div
          className="absolute top-0 bottom-4 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${getPct(currentTime)}%`,
          }}
        >
          {/* Circular grip at top of cursor */}
          <div className="absolute -top-1 -ml-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-950 shadow flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block"></span>
          </div>
          {/* Current playback time badge */}
          <div className="absolute -bottom-5 -ml-6 bg-white text-slate-950 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-slate-200 z-10 leading-none">
            t={currentTime}
          </div>
        </div>

        {/* Ticks timeline ruler */}
        <div className="relative w-full mt-3 h-6">
          {ticks.map((tick, idx) => {
            const leftPct = getPct(tick);
            return (
              <div
                key={`tick-${tick}-${idx}`}
                className="absolute flex flex-col items-center -ml-3"
                style={{ left: `${leftPct}%` }}
              >
                {/* Tick tickline */}
                <div className="w-0.5 h-1.5 bg-slate-700 rounded-full"></div>
                {/* Tick label */}
                <span className="text-[10px] font-mono font-medium text-slate-500 mt-1">
                  {tick}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Gantt Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap gap-4 text-xs font-mono justify-center items-center">
        <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Legend:</span>
        {/* Collect unique running processes */}
        {Array.from(new Set(ganttChart.map(b => b.processId))).map((pId, idx) => {
          if (pId === "IDLE") return null;
          const matchBlock = ganttChart.find(b => b.processId === pId);
          return (
            <div key={`legend-${pId}-${idx}`} className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: matchBlock?.color }}></span>
              <span className="text-slate-300">{pId}</span>
            </div>
          );
        })}
        {ganttChart.some(b => b.processId === "IDLE" && b.color === "#475569") && (
          <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-600"></span>
            <span className="text-slate-400">CPU Idle</span>
          </div>
        )}
        {ganttChart.some(b => b.processId === "IDLE" && b.color === "#b91c1c") && (
          <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-700 animate-pulse"></span>
            <span className="text-red-400 font-bold">Context Switch (CS)</span>
          </div>
        )}
      </div>
    </div>
  );
}
