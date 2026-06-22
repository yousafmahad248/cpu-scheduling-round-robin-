import { HelpCircle, Calculator, Award, ArrowUpRight, Cpu, Zap } from "lucide-react";
import { ProcessResult, AverageStats } from "../types.ts";

interface ProcessTableProps {
  results: ProcessResult[];
  averages: AverageStats;
}

export default function ProcessTable({ results, averages }: ProcessTableProps) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center italic text-slate-500">
        Input processes and run simulation to view stats breakdown.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-slate-100 shadow-xl" id="process-table">
      
      {/* Title */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <Calculator className="w-5 h-5" /> Detailed Scheduling Stats & Results
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Individual process latency tracking and performance metrics. Hover over headers to view formula definitions.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
          <Award className="w-4 h-4 text-amber-500" /> Math Verified
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
        <table className="w-full text-left border-collapse min-w-[650px] font-sans">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-mono tracking-wider text-slate-400 uppercase select-none">
              <th className="py-3 px-4 font-bold text-slate-300">Process ID</th>
              <th className="py-3 px-4 group relative cursor-help">
                <span className="flex items-center gap-1">
                  Arrival Time (AT) <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-15">
                  Point in time when process enters the ready queue.
                </span>
              </th>
              <th className="py-3 px-4 group relative cursor-help">
                <span className="flex items-center gap-1">
                  Burst Time (BT) <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-15">
                  Total CPU time requested by the process.
                </span>
              </th>
              <th className="py-3 px-4 group relative cursor-help">
                <span className="flex items-center gap-1">
                  Completion Time (CT) <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-15">
                  Timestamp when process completes all execution.
                </span>
              </th>
              <th className="py-3 px-4 group relative cursor-help text-indigo-300">
                <span className="flex items-center gap-1">
                  Turnaround Time (TAT) <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-11">
                  Formula: TAT = Completion Time (CT) - Arrival Time (AT)
                </span>
              </th>
              <th className="py-3 px-4 group relative cursor-help text-emerald-300">
                <span className="flex items-center gap-1">
                  Waiting Time (WT) <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-11">
                  Formula: WT = Turnaround Time (TAT) - Burst Time (BT)
                </span>
              </th>
              <th className="py-3 px-4 group relative cursor-help text-amber-300">
                <span className="flex items-center gap-1">
                  Response Time (RT) <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-11">
                  Formula: RT = First Execution Time - Arrival Time (AT)
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
            {results.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.color }}></span>
                  <span className="text-slate-200 text-base">{p.id}</span>
                </td>
                <td className="py-3 px-4 text-slate-300">{p.arrivalTime}</td>
                <td className="py-3 px-4 text-slate-300">{p.burstTime}</td>
                <td className="py-3 px-4 text-slate-300">{p.completionTime}</td>
                <td className="py-3 px-4 text-indigo-200 font-bold">{p.turnaroundTime}</td>
                <td className="py-3 px-4 text-emerald-200 font-bold">{p.waitingTime}</td>
                <td className="py-3 px-4 text-amber-200 font-bold">{p.responseTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid of Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        
        {/* Card 1: Avg TAT */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block leading-none">
              Avg Turnaround Time
            </span>
            <span className="text-xs text-slate-400 font-mono italic mt-1 block">
              TAT = CT - AT
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-indigo-400">
              {averages.averageTurnaroundTime.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">ticks</span>
          </div>
        </div>

        {/* Card 2: Avg WT */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block leading-none">
              Avg Waiting Time
            </span>
            <span className="text-xs text-slate-400 font-mono italic mt-1 block">
              WT = TAT - BT
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {averages.averageWaitingTime.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">ticks</span>
          </div>
        </div>

        {/* Card 3: Avg RT */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block leading-none">
              Avg Response Time
            </span>
            <span className="text-xs text-slate-400 font-mono italic mt-1 block">
              RT = FirstRun - AT
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-amber-400">
              {averages.averageResponseTime.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">ticks</span>
          </div>
        </div>

        {/* Card 4: CPU Utilization */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block leading-none flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-500" /> CPU Utilization
            </span>
            <span className="text-[9px] text-slate-600 font-sans block mt-1 leading-tight">
              Active running vs idle time.
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-sky-400">
              {averages.cpuUtilization.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 5: Throughput */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block leading-none flex items-center gap-1">
              <Zap className="w-3 h-3 text-slate-500" /> Throughput
            </span>
            <span className="text-[9px] text-slate-600 font-sans block mt-1 leading-tight">
              Completed processes/tick.
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-pink-400">
              {averages.throughput.toFixed(3)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
