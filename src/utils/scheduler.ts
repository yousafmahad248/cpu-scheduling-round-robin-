import { ProcessInput, SimulationResult, ProcessResult, GanttBlock, SimulationStep } from "../types.ts";

export function simulateRoundRobin(
  inputs: ProcessInput[],
  quantum: number,
  contextSwitch: number = 0
): SimulationResult {
  // Sort inputs primarily by arrivalTime and then by process ID alphabetically
  const processes = [...inputs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.id.localeCompare(b.id);
  });

  const n = processes.length;
  const remainingTime: Record<string, number> = {};
  const responseTime: Record<string, number> = {};
  const completionTime: Record<string, number> = {};
  const colors: Record<string, string> = {};

  for (const p of processes) {
    remainingTime[p.id] = p.burstTime;
    responseTime[p.id] = -1;
    colors[p.id] = p.color;
  }

  const steps: SimulationStep[] = [];
  const ganttChart: GanttBlock[] = [];

  let currentTime = 0;
  const readyQueue: string[] = [];
  const completedIds: string[] = [];

  // Track which processes have been pushed to readyQueue at least once
  const enteredQueue = new Set<string>();

  // Helper to add newly arrived processes to the ready queue
  const checkArrivals = (timeLimit: number) => {
    // Add all processes that have arrived up to timeLimit and haven't entered queue yet
    const arrivals = processes.filter(
      p => p.arrivalTime <= timeLimit && !enteredQueue.has(p.id) && remainingTime[p.id] > 0
    );
    // Sort arrivals by arrivalTime, then process ID
    arrivals.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id);
    });
    for (const arr of arrivals) {
      readyQueue.push(arr.id);
      enteredQueue.add(arr.id);
    }
  };

  // Run initial arrival check at t = 0
  checkArrivals(0);

  let lastActiveId: string | null = null;

  while (completedIds.length < n) {
    // If ready queue is empty, but there are still incomplete processes,
    // we must advance time to the next arriving process.
    if (readyQueue.length === 0) {
      const nextArrivals = processes.filter(p => !enteredQueue.has(p.id) && remainingTime[p.id] > 0);
      if (nextArrivals.length > 0) {
        // Find the minimum arrival time among not entered processes
        const minArrival = Math.min(...nextArrivals.map(p => p.arrivalTime));
        
        // Add an IDLE block in the Gantt chart if needed
        if (currentTime < minArrival) {
          ganttChart.push({
            processId: "IDLE",
            startTime: currentTime,
            endTime: minArrival,
            color: "#475569" // slate-600
          });

          // Add a simulation step for entering IDLE
          steps.push({
            time: currentTime,
            event: `CPU is idle waiting for processes to arrive.`,
            readyQueue: [],
            runningId: null,
            remainingBurstTimes: { ...remainingTime },
            completedIds: [...completedIds],
            unarrivedIds: processes.filter(p => !enteredQueue.has(p.id)).map(p => p.id)
          });

          currentTime = minArrival;
        }
        checkArrivals(currentTime);
      } else {
        // Safety exit
        break;
      }
    }

    // Dequeue a process to execute
    const currentId = readyQueue.shift()!;

    // Check if there is context switch overhead (only if we switch active running processes)
    if (contextSwitch > 0 && lastActiveId !== null && lastActiveId !== currentId) {
      const switchEnd = currentTime + contextSwitch;
      ganttChart.push({
        processId: "IDLE", // Represents overhead / context switch idle period
        startTime: currentTime,
        endTime: switchEnd,
        color: "#b91c1c" // darker red-700 for overhead context switch
      });

      steps.push({
        time: currentTime,
        event: `Context Switch overhead: switching from ${lastActiveId} to ${currentId} (${contextSwitch} unit${contextSwitch > 1 ? 's' : ''})`,
        readyQueue: [currentId, ...readyQueue],
        runningId: null,
        remainingBurstTimes: { ...remainingTime },
        completedIds: [...completedIds],
        unarrivedIds: processes.filter(p => !enteredQueue.has(p.id)).map(p => p.id)
      });

      currentTime = switchEnd;
      // Recheck arrivals that happened during context switch
      checkArrivals(currentTime);
    }

    // Set response time if it is the first time running
    if (responseTime[currentId] === -1) {
      const pObj = processes.find(p => p.id === currentId);
      responseTime[currentId] = currentTime - (pObj ? pObj.arrivalTime : 0);
    }

    const execTime = Math.min(remainingTime[currentId], quantum);
    const startExecTime = currentTime;

    // Record the step *before* execution starts
    steps.push({
      time: startExecTime,
      event: `Process ${currentId} loaded on CPU. Runs for up to ${execTime} unit${execTime > 1 ? 's' : ''} (Burst left: ${remainingTime[currentId]}).`,
      readyQueue: [...readyQueue],
      runningId: currentId,
      remainingBurstTimes: { ...remainingTime },
      completedIds: [...completedIds],
      unarrivedIds: processes.filter(p => !enteredQueue.has(p.id)).map(p => p.id)
    });

    // Execute
    remainingTime[currentId] -= execTime;
    currentTime += execTime;

    // Record Gantt block
    ganttChart.push({
      processId: currentId,
      startTime: startExecTime,
      endTime: currentTime,
      color: colors[currentId]
    });

    // Check arrivals during execution
    checkArrivals(currentTime);

    // If the process completed
    if (remainingTime[currentId] === 0) {
      completionTime[currentId] = currentTime;
      completedIds.push(currentId);
      lastActiveId = currentId;

      steps.push({
        time: currentTime,
        event: `Process ${currentId} completed execution.`,
        readyQueue: [...readyQueue],
        runningId: null,
        remainingBurstTimes: { ...remainingTime },
        completedIds: [...completedIds],
        unarrivedIds: processes.filter(p => !enteredQueue.has(p.id)).map(p => p.id)
      });
    } else {
      // Process did not complete, it has to be preempted and sent to the back of readyQueue.
      // In standard RR: new arrivals join the queue first, then the preempted process joins.
      readyQueue.push(currentId);
      lastActiveId = currentId;

      steps.push({
        time: currentTime,
        event: `Time slice expired. Process ${currentId} preempted; sent back to ready queue.`,
        readyQueue: [...readyQueue],
        runningId: null,
        remainingBurstTimes: { ...remainingTime },
        completedIds: [...completedIds],
        unarrivedIds: processes.filter(p => !enteredQueue.has(p.id)).map(p => p.id)
      });
    }
  }

  // Add final completed step at the end of simulation
  steps.push({
    time: currentTime,
    event: "All processes successfully completed. CPU is idle.",
    readyQueue: [],
    runningId: null,
    remainingBurstTimes: { ...remainingTime },
    completedIds: [...completedIds],
    unarrivedIds: []
  });

  // Calculate Turnaround Time and Waiting Time for each process
  const results: ProcessResult[] = processes.map(p => {
    const ct = completionTime[p.id];
    const tat = ct - p.arrivalTime;
    const wt = tat - p.burstTime;
    const rt = responseTime[p.id];
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      completionTime: ct,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
      color: p.color
    };
  });

  // Calculate stats
  const totalTurnaroundTime = results.reduce((acc, p) => acc + p.turnaroundTime, 0);
  const totalWaitingTime = results.reduce((acc, p) => acc + p.waitingTime, 0);
  const totalResponseTime = results.reduce((acc, p) => acc + p.responseTime, 0);

  const averageTurnaroundTime = n > 0 ? totalTurnaroundTime / n : 0;
  const averageWaitingTime = n > 0 ? totalWaitingTime / n : 0;
  const averageResponseTime = n > 0 ? totalResponseTime / n : 0;

  // CPU utilization: CPU busy execution vs total time span
  const totalExecTime = ganttChart
    .filter(b => b.processId !== "IDLE")
    .reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
  const cpuUtilization = currentTime > 0 ? (totalExecTime / currentTime) * 100 : 0;
  const throughput = currentTime > 0 ? n / currentTime : 0;

  return {
    processes: results,
    ganttChart,
    steps,
    averages: {
      averageTurnaroundTime,
      averageWaitingTime,
      averageResponseTime,
      cpuUtilization,
      throughput,
      totalTime: currentTime
    },
    quantum,
    contextSwitch
  };
}
