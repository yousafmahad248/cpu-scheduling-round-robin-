import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Cpu, ArrowLeft, CheckCircle2, User, HelpCircle, Layers } from "lucide-react";
import { SimulationStep, ProcessInput, ProcessResult } from "../types.ts";

interface QueueSimulationProps {
  step: SimulationStep;
  processes: ProcessInput[] | ProcessResult[];
  quantum: number;
}

export default function QueueSimulation({ step, processes, quantum }: QueueSimulationProps) {
  const { readyQueue, runningId, remainingBurstTimes, completedIds, unarrivedIds, event } = step;

  // Helper to find initial burst time for sizing and progress calculation
  const getInitialBurst = (pId: string): number => {
    const match = processes.find(p => p.id === pId);
    return match ? match.burstTime : 1;
  };

  // Helper to get color of process
  const getProcessColor = (pId: string): string => {
    const match = processes.find(p => p.id === pId);
    return match ? match.color : "#64748b";
  };

  // Build full list of processes not yet arrived
  const unarrivedProcesses = processes.filter(p => unarrivedIds.includes(p.id));

  // Build full list of completed processes
  const completedProcesses = processes.filter(p => completedIds.includes(p.id));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-slate-100 shadow-xl" id="queue-simulation">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
            <Layers className="w-5 h-5" /> Queue & Process State Simulation
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Step-by-step state of the Ready Queue (FIFO conveyor), CPU execution, and context transitions.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Clock Time: <strong className="font-mono text-indigo-300">{step.time}</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            Time Quantum: <strong className="font-mono text-violet-300">{quantum}</strong>
          </div>
        </div>
      </div>

      {/* Grid Layout of different queues */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative min-h-[220px]">
        
        {/* Lane 1: Unarrived Pool */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col xl:col-span-1" id="lane-unarrived">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono uppercase">
              Unarrived Pool ({unarrivedProcesses.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 content-start flex-grow overflow-y-auto max-h-[140px] p-1">
            <AnimatePresence mode="popLayout">
              {unarrivedProcesses.map((p) => (
                <motion.div
                  key={p.id}
                  layoutId={`process-${p.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between gap-3 bg-slate-900 shadow-sm text-sm"
                  style={{ borderLeftWidth: "4px", borderLeftColor: p.color }}
                >
                  <span className="font-mono font-bold">{p.id}</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Arrival: {p.arrivalTime}</span>
                    <span className="text-[10px] text-slate-300 block">Burst: {p.burstTime}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {unarrivedProcesses.length === 0 && (
              <span className="text-xs text-slate-600 italic m-auto">All processes have arrived.</span>
            )}
          </div>
        </div>

        {/* Lane 2: Ready Queue Conveyor Belt (2/4 span) */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col xl:col-span-2 relative" id="lane-ready-queue">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono uppercase flex items-center gap-1">
              Ready Queue (FIFO) <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Head on right →</span>
          </div>

          <div className="flex items-center gap-3 flex-grow overflow-x-auto min-h-[90px] p-2 bg-slate-900/30 rounded-lg border border-slate-800/40 relative">
            <AnimatePresence mode="popLayout">
              {readyQueue.map((pId, idx) => {
                const color = getProcessColor(pId);
                const initBurst = getInitialBurst(pId);
                const remBurst = remainingBurstTimes[pId] ?? initBurst;
                const progressPct = (remBurst / initBurst) * 100;

                return (
                  <motion.div
                    key={`${pId}-${idx}`}
                    layoutId={`process-${pId}`}
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex-shrink-0 w-28 p-3 rounded-xl border border-slate-700/60 bg-slate-850 shadow-md relative group hover:border-indigo-500/50 transition-colors"
                    style={{ borderTop: `4px solid ${color}` }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-extrabold text-sm text-indigo-100">{pId}</span>
                      <span className="text-[9px] bg-slate-950 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
                        Rem: {remBurst}
                      </span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ width: `${progressPct}%`, backgroundColor: color }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-2 block text-center">
                      Queue index #{idx}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {readyQueue.length === 0 && (
              <span className="text-xs text-slate-600 italic m-auto">Ready Queue is empty.</span>
            )}
          </div>
          
          {/* Loopback Arrow (Visualization representation for preempted processes moving to the back) */}
          <div className="absolute -bottom-4 right-10 hidden xl:flex items-center gap-1 text-[10px] text-indigo-400 font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full z-10">
            <ArrowLeft className="w-3 h-3 animate-pulse" /> slice expired / loops back
          </div>
        </div>

        {/* Lane 3: CPU Stage */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col xl:col-span-1" id="lane-cpu">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> CPU Core
            </span>
            {runningId && (
              <span className="text-[9px] text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-1.5 py-0.5 rounded font-mono uppercase animate-pulse">
                Active
              </span>
            )}
          </div>

          <div className="flex-grow flex items-center justify-center min-h-[110px] relative p-1">
            <AnimatePresence mode="wait">
              {runningId ? (
                <motion.div
                  key={`running-${runningId}`}
                  layoutId={`process-${runningId}`}
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -15 }}
                  className="w-full max-w-[140px] p-4 rounded-xl border-2 bg-slate-900 shadow-lg text-center relative overflow-hidden"
                  style={{ borderColor: getProcessColor(runningId) }}
                >
                  <div className="absolute top-0 right-0 w-3 h-3">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: getProcessColor(runningId) }}></span>
                  </div>
                  
                  <span className="font-mono font-black text-xl tracking-wide block" style={{ color: getProcessColor(runningId) }}>
                    {runningId}
                  </span>
                  
                  <div className="mt-3 bg-slate-950/80 rounded-lg p-1.5 border border-slate-800 font-mono">
                    <span className="text-[10px] text-slate-500 block leading-none">Remaining Burst</span>
                    <strong className="text-lg text-slate-200 mt-0.5 block">
                      {remainingBurstTimes[runningId] ?? getInitialBurst(runningId)}
                    </strong>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 block mt-2 text-center uppercase tracking-wide font-medium">
                    Executing...
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-4 border border-dashed border-slate-850 rounded-xl bg-slate-900/30 w-full max-w-[140px] h-full flex flex-col justify-center items-center"
                >
                  <Cpu className="w-8 h-8 text-slate-600 stroke-[1.2] mb-1 animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium">
                    {event.includes("Context Switch") ? (
                      <span className="text-red-400 animate-pulse">Switching...</span>
                    ) : (
                      "CPU Idle"
                    )}
                  </span>
                  <span className="text-[9px] text-slate-600 block mt-1 font-mono">
                    No active thread
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Completed tray at the bottom */}
      <div className="mt-6 bg-slate-950/30 border border-slate-850 rounded-xl p-4" id="lane-completed">
        <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono uppercase mb-3 block flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Queue ({completedProcesses.length})
        </span>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-950/40 rounded-lg border border-slate-800/50 min-h-[60px] items-center">
          <AnimatePresence>
            {completedProcesses.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                className="px-3 py-1.5 rounded-lg border border-emerald-900 bg-emerald-950/30 text-emerald-300 flex items-center gap-2 text-xs shadow-inner"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="font-mono font-extrabold">{p.id}</span>
                <span className="text-[10px] text-emerald-500 font-mono">Done</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {completedProcesses.length === 0 && (
            <span className="text-xs text-slate-600 italic m-auto py-1">Processes appear here as they complete execution.</span>
          )}
        </div>
      </div>

      {/* Real-time Ticker Event Log bar */}
      <div className="mt-5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-indigo-200 text-sm flex items-start gap-2.5 shadow-inner">
        <span className="font-mono text-xs font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50 mt-0.5 whitespace-nowrap">
          Log t={step.time}
        </span>
        <span className="font-sans leading-relaxed text-indigo-100 flex-grow">
          {event}
        </span>
      </div>
    </div>
  );
}
