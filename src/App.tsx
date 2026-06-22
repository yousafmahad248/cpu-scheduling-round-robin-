import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Settings2, 
  Dices, 
  BookOpen, 
  Cpu, 
  HelpCircle, 
  Layers, 
  Activity, 
  GraduationCap, 
  Flame,
  Wrench,
  AlertCircle
} from "lucide-react";
import { ProcessInput, SimulationResult } from "./types.ts";
import QueueSimulation from "./components/QueueSimulation.tsx";
import GanttChart from "./components/GanttChart.tsx";
import ProcessTable from "./components/ProcessTable.tsx";
import TutorChat from "./components/TutorChat.tsx";
import { simulateRoundRobin } from "./utils/scheduler.ts";

const COLOR_PALETTE = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#14b8a6", // teal-500
  "#ef4444", // red-500
];

const DEFAULT_PROCESSES: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 5, color: "#3b82f6" },
  { id: "P2", arrivalTime: 1, burstTime: 4, color: "#10b981" },
  { id: "P3", arrivalTime: 2, burstTime: 2, color: "#f59e0b" },
  { id: "P4", arrivalTime: 4, burstTime: 1, color: "#8b5cf6" },
];

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(DEFAULT_PROCESSES);
  const [quantum, setQuantum] = useState<number>(2);
  const [contextSwitch, setContextSwitch] = useState<number>(0);
  
  // Simulation Outcome State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Playback Control States
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [durationMs, setDurationMs] = useState<number>(1000); // speed standard delay: 1000ms
  
  // Custom interactive processes form state
  const [newId, setNewId] = useState<string>("");
  const [newArrival, setNewArrival] = useState<number>(0);
  const [newBurst, setNewBurst] = useState<number>(3);
  const [newColor, setNewColor] = useState<string>(COLOR_PALETTE[0]);

  // Handle calculation
  const runSimulation = useCallback(async (activeProcs = processes, activeQ = quantum, activeCS = contextSwitch) => {
    setIsLoading(true);
    setErrorText(null);
    try {
      // Fetch calculation from backend in Node.js
      const response = await fetch("/api/scheduler/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          processes: activeProcs, 
          quantum: activeQ, 
          contextSwitch: activeCS 
        }),
      });

      if (!response.ok) {
        throw new Error("Backend server did not respond correctly. Switching to robust client-side backup simulation solver.");
      }

      const results: SimulationResult = await response.json();
      setSimulationResult(results);
      setCurrentStepIdx(0);
      setIsPlaying(false);
    } catch (err: any) {
      console.warn("Express server error, loading fallback solver:", err.message);
      // Client-side backup fallback calculation
      const results = simulateRoundRobin(activeProcs, activeQ, activeCS);
      setSimulationResult(results);
      setCurrentStepIdx(0);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [processes, quantum, contextSwitch]);

  // Initial load simulation
  useEffect(() => {
    runSimulation();
  }, []);

  // Step ticker increment timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && simulationResult) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= simulationResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, durationMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, simulationResult, durationMs]);

  // Handle Preset Loaders
  const loadPreset = (presetName: string) => {
    let targetProcs: ProcessInput[] = [];
    let targetQ = 2;
    let targetCS = 0;

    switch (presetName) {
      case "classic":
        targetProcs = [
          { id: "P1", arrivalTime: 0, burstTime: 8, color: "#3b82f6" },
          { id: "P2", arrivalTime: 1, burstTime: 4, color: "#10b981" },
          { id: "P3", arrivalTime: 2, burstTime: 9, color: "#f59e0b" },
          { id: "P4", arrivalTime: 3, burstTime: 5, color: "#8b5cf6" },
        ];
        targetQ = 4;
        targetCS = 0;
        break;
      case "switch_overhead":
        targetProcs = [
          { id: "P1", arrivalTime: 0, burstTime: 6, color: "#3b82f6" },
          { id: "P2", arrivalTime: 2, burstTime: 3, color: "#10b981" },
          { id: "P3", arrivalTime: 4, burstTime: 4, color: "#f59e0b" },
        ];
        targetQ = 3;
        targetCS = 1; // 1 unit context-switching cost
        break;
      case "contention":
        targetProcs = [
          { id: "P1", arrivalTime: 0, burstTime: 6, color: "#3b82f6" },
          { id: "P2", arrivalTime: 0, burstTime: 4, color: "#10b981" },
          { id: "P3", arrivalTime: 0, burstTime: 2, color: "#f59e0b" },
          { id: "P4", arrivalTime: 0, burstTime: 1, color: "#8b5cf6" },
        ];
        targetQ = 1; // tiny quantum means lots of preemption switches
        targetCS = 0;
        break;
      case "fcfs":
        targetProcs = [
          { id: "P1", arrivalTime: 0, burstTime: 4, color: "#3b82f6" },
          { id: "P2", arrivalTime: 1, burstTime: 6, color: "#10b981" },
          { id: "P3", arrivalTime: 3, burstTime: 3, color: "#f59e0b" },
        ];
        targetQ = 20; // Quantum > all bursts, translates exactly to FCFS behavior
        targetCS = 0;
        break;
      default:
        targetProcs = DEFAULT_PROCESSES;
        targetQ = 2;
        targetCS = 0;
    }

    setProcesses(targetProcs);
    setQuantum(targetQ);
    setContextSwitch(targetCS);
    runSimulation(targetProcs, targetQ, targetCS);
  };

  const handleAddField = () => {
    // Generate valid id
    const candidateId = newId.trim() !== "" ? newId.trim().toUpperCase() : `P${processes.length + 1}`;
    
    // Check duplication
    if (processes.some(p => p.id === candidateId)) {
      alert(`Process ID "${candidateId}" already exists. Please choose a unique name.`);
      return;
    }

    const updated = [
      ...processes,
      {
        id: candidateId,
        arrivalTime: Math.max(0, newArrival),
        burstTime: Math.max(1, newBurst),
        color: newColor
      }
    ];

    setProcesses(updated);
    setNewId("");
    // Pick next available color from standard palette randomly
    setNewColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    runSimulation(updated, quantum, contextSwitch);
  };

  const handleDeleteProc = (idToDelete: string) => {
    if (processes.length <= 1) {
      alert("At least one process is required to run scheduling simulations.");
      return;
    }
    const updated = processes.filter(p => p.id !== idToDelete);
    setProcesses(updated);
    runSimulation(updated, quantum, contextSwitch);
  };

  const handleRandomizeColors = () => {
    const updated = processes.map(p => ({
      ...p,
      color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
    }));
    setProcesses(updated);
    runSimulation(updated, quantum, contextSwitch);
  };

  // Safe variables for current simulated states
  const activeStep = simulationResult?.steps[currentStepIdx] || null;
  const currentSimTime = activeStep ? activeStep.time : 0;
  const totalSimTime = simulationResult?.averages.totalTime || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 lg:p-8 flex flex-col gap-6 select-none" id="dashboard-wrapper">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header Banner */}
      <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-100 bg-clip-text text-transparent flex items-center gap-2">
              Round Robin CPU Scheduler Visualizer
            </h1>
            <p className="text-xs text-slate-400 font-medium font-sans">
              Full-Stack interactive queue visualizer, time analyst, and AI operating systems solver.
            </p>
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="flex items-center gap-3 h-fit text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-400 font-sans">ENV:</span>
            <span className="text-emerald-400">Node/FullStack</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-slate-400 font-sans">
            Port: <span className="text-slate-100 font-mono">3000</span>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column (SPAN 4): Input parameters, processes controller, presets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Preset Buttons Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl" id="presets-panel">
            <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-2 mb-3 font-mono">
              <BookOpen className="w-4 h-4" /> Academic Study Presets
            </h2>
            <p className="text-xs text-slate-400 leading-normal mb-4 font-sans">
              Load typical textbook CPU scheduling test-cases to observe queue state differences:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => loadPreset("classic")}
                className="text-xs py-2 px-3 rounded-xl border border-slate-850 bg-slate-950/60 hover:bg-slate-850 text-indigo-300 font-medium hover:border-indigo-500/40 transition-all font-sans text-left"
              >
                🎓 1. Classic Case
              </button>
              <button 
                onClick={() => loadPreset("switch_overhead")}
                className="text-xs py-2 px-3 rounded-xl border border-slate-850 bg-slate-950/60 hover:bg-slate-850 text-emerald-300 font-medium hover:border-emerald-500/40 transition-all font-sans text-left"
              >
                ⚡ 2. Switching Cost
              </button>
              <button 
                onClick={() => loadPreset("contention")}
                className="text-xs py-2 px-3 rounded-xl border border-slate-850 bg-slate-950/60 hover:bg-slate-850 text-amber-300 font-medium hover:border-amber-500/40 transition-all font-sans text-left"
              >
                🔥 3. High Contention
              </button>
              <button 
                onClick={() => loadPreset("fcfs")}
                className="text-xs py-2 px-3 rounded-xl border border-slate-850 bg-slate-950/60 hover:bg-slate-850 text-violet-300 font-medium hover:border-violet-500/40 transition-all font-sans text-left"
              >
                🌀 4. FCFS Limit
              </button>
            </div>
          </div>

          {/* Configuration Inputs Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="config-panel">
            <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-2 border-b border-slate-800 pb-2.5 font-mono">
              <Settings2 className="w-4 h-4" /> Core Scheduler Parameters
            </h2>

            {/* Time Quantum */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                Time Quantum (TQ)
                <span className="text-[10px] text-slate-500 font-mono">(Slice size)</span>
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={quantum}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantum(val);
                    runSimulation(processes, val, contextSwitch);
                  }}
                  className="flex-grow accent-indigo-500 h-1.5 bg-slate-950 rounded-lg"
                />
                <span className="w-10 text-center font-mono font-bold bg-slate-950 px-2 py-1 rounded text-indigo-300 border border-slate-850 text-sm">
                  {quantum}
                </span>
              </div>
            </div>

            {/* Context Switch */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                Context Switch Overhead
                <span className="text-[10px] text-slate-500 font-mono">(Switching delay units)</span>
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="4" 
                  value={contextSwitch}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setContextSwitch(val);
                    runSimulation(processes, quantum, val);
                  }}
                  className="flex-grow accent-emerald-500 h-1.5 bg-slate-950 rounded-lg"
                />
                <span className="w-10 text-center font-mono font-bold bg-slate-950 px-2 py-1 rounded text-emerald-300 border border-slate-850 text-sm">
                  {contextSwitch}
                </span>
              </div>
            </div>
          </div>

          {/* Processes List Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="processes-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4" /> Configured Processes
              </h2>
              <button 
                onClick={handleRandomizeColors}
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition-all"
                title="Randomize Colors"
              >
                <Dices className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Process Inputs list */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {processes.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between gap-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 text-xs font-mono"
                  style={{ borderLeft: `3px solid ${p.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{p.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      Arr: <strong className="text-slate-200">{p.arrivalTime}</strong>
                    </span>
                    <span className="text-slate-400">
                      Burst: <strong className="text-slate-200">{p.burstTime}</strong>
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteProc(p.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title={`Delete Process ${p.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Process Form Panel */}
            <div className="p-3.5 bg-slate-950/40 border border-slate-850/60 rounded-xl flex flex-col gap-3 mt-1">
              <span className="text-xs font-bold text-slate-400 font-mono">Add Process</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">ID</label>
                  <input 
                    type="text" 
                    placeholder="P5..."
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 tracking-wide font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Arrival</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={isNaN(newArrival) ? "" : newArrival}
                    onChange={(e) => setNewArrival(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Burst</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="3"
                    value={isNaN(newBurst) ? "" : newBurst}
                    onChange={(e) => setNewBurst(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Color Chooser row */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Color:</span>
                  <div className="flex gap-1">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-4 h-4 rounded-full border ${newColor === c ? "border-white scale-110" : "border-transparent opacity-60"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleAddField}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 leading-none shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Set
                </button>
              </div>
            </div>

            {/* Run Button */}
            <button 
              onClick={() => runSimulation()}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 disabled:opacity-50 transition-all font-sans cursor-pointer mt-1"
            >
              <Cpu className="w-4 h-4" /> Generate Simulator Outcome
            </button>
          </div>

        </div>

        {/* Right Column (SPAN 8): Playback slider, active queue graphics, timelines, tables, tutor */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Simulation Slider and Control Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="simulation-player-controls">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Playback Buttons Group */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIdx(0);
                  }}
                  disabled={!simulationResult}
                  className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl disabled:opacity-40 transition-colors"
                  title="Reset to Step 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentStepIdx(p => Math.max(0, p - 1))}
                  disabled={!simulationResult || currentStepIdx === 0}
                  className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl disabled:opacity-40 transition-colors"
                  title="Previous Step"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                {/* BIG PLAY BUTTON */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={!simulationResult || currentStepIdx >= (simulationResult?.steps.length || 1) - 1}
                  className={`px-4 py-2 rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer ${
                    isPlaying 
                      ? "bg-amber-600 text-white hover:bg-amber-500" 
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> Play Simulator
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setCurrentStepIdx(p => Math.min((simulationResult?.steps.length || 1) - 1, p + 1))}
                  disabled={!simulationResult || currentStepIdx >= (simulationResult?.steps.length || 1) - 1}
                  className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl disabled:opacity-40 transition-colors"
                  title="Next Step"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress and speed sliders */}
              <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
                
                {/* Speed selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850 text-slate-400">
                  <span className="font-sans">Delay:</span>
                  <button 
                    onClick={() => setDurationMs(1500)}
                    className={`px-1.5 py-0.5 rounded transition-all ${durationMs === 1500 ? "bg-indigo-650 text-slate-100" : "hover:text-slate-200"}`}
                  >
                    0.5x
                  </button>
                  <button 
                    onClick={() => setDurationMs(1000)}
                    className={`px-1.5 py-0.5 rounded transition-all ${durationMs === 1000 ? "bg-indigo-650 text-slate-100" : "hover:text-slate-200"}`}
                  >
                    1x
                  </button>
                  <button 
                    onClick={() => setDurationMs(400)}
                    className={`px-1.5 py-0.5 rounded transition-all ${durationMs === 400 ? "bg-indigo-650 text-slate-100" : "hover:text-slate-200"}`}
                  >
                    2x
                  </button>
                </div>

                {/* Step indicator badge */}
                <div className="bg-slate-950/60 text-indigo-300 border border-slate-850 px-3 py-1.5 rounded-xl font-bold">
                  Step {currentStepIdx + 1} / {simulationResult?.steps.length || 1}
                </div>
              </div>

            </div>

            {/* Seamless Seeking range bar slider */}
            {simulationResult && (
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-mono text-slate-500">t=0</span>
                <input 
                  type="range"
                  min="0"
                  max={simulationResult.steps.length - 1}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStepIdx(parseInt(e.target.value) || 0);
                  }}
                  className="flex-grow accent-indigo-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-slate-300">t={totalSimTime}</span>
              </div>
            )}

          </div>

          {/* Active Queue Snapshot Graphic Component */}
          {activeStep && simulationResult ? (
            <QueueSimulation 
              step={activeStep} 
              processes={processes} 
              quantum={quantum}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center italic text-slate-500">
              Generating queue visualizer data...
            </div>
          )}

          {/* Detailed Gantt Chart */}
          {simulationResult && (
            <GanttChart 
              ganttChart={simulationResult.ganttChart}
              currentTime={currentSimTime}
              totalTime={totalSimTime}
            />
          )}

          {/* Detailed Statistics Grid and calculations */}
          {simulationResult && (
            <ProcessTable 
              results={simulationResult.processes}
              averages={simulationResult.averages}
            />
          )}

          {/* Tutor Chat interface */}
          <div className="mt-2" id="classroom-ai-tutor font-sans">
            <div className="flex items-center gap-1.5 font-sans font-bold text-base text-indigo-400 mb-3 px-1 uppercase tracking-wider font-mono">
              <GraduationCap className="w-5 h-5" /> OS Advisor & Analysis (Gemini)
            </div>
            <TutorChat simulationResults={simulationResult} />
          </div>

        </div>

      </main>

    </div>
  );
}
