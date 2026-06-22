export interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
  color: string;
}

export interface ProcessResult {
  id: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  color: string;
}

export interface GanttBlock {
  processId: string | "IDLE";
  startTime: number;
  endTime: number;
  color: string;
}

export interface SimulationStep {
  time: number;
  event: string;
  readyQueue: string[];
  runningId: string | null;
  remainingBurstTimes: Record<string, number>;
  completedIds: string[];
  unarrivedIds: string[];
}

export interface AverageStats {
  averageTurnaroundTime: number;
  averageWaitingTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  totalTime: number;
}

export interface SimulationResult {
  processes: ProcessResult[];
  ganttChart: GanttBlock[];
  steps: SimulationStep[];
  averages: AverageStats;
  quantum: number;
  contextSwitch: number;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
