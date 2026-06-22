import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { simulateRoundRobin } from "./src/utils/scheduler.ts";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Run Round Robin simulation
  app.post("/api/scheduler/simulate", (req, res) => {
    try {
      const { processes, quantum, contextSwitch } = req.body;
      
      if (!Array.isArray(processes)) {
        return res.status(400).json({ error: "Input field 'processes' must be an array." });
      }
      if (processes.length === 0) {
        return res.status(400).json({ error: "The list of processes cannot be empty." });
      }

      // Sanitize processes inputs
      const sanitized = processes.map((p: any, i: number) => {
        const arrivalTime = Math.max(0, parseInt(p.arrivalTime, 10) || 0);
        const burstTime = Math.max(1, parseInt(p.burstTime, 10) || 1);
        const id = p.id ? String(p.id).trim() : `P${i + 1}`;
        const color = p.color || `#${Math.floor(Math.random()*16777215).toString(16)}`;
        return { id, arrivalTime, burstTime, color };
      });

      const q = Math.max(1, parseInt(quantum, 10) || 2);
      const cs = Math.max(0, parseFloat(contextSwitch) || 0);

      const simulation = simulateRoundRobin(sanitized, q, cs);
      return res.json(simulation);
    } catch (error: any) {
      console.error("Simulation error:", error);
      return res.status(500).json({ error: error.message || "An error occurred during CPU simulation calculation." });
    }
  });

  // API 2: Explain simulation outcomes using Gemini
  app.post("/api/scheduler/explain", async (req, res) => {
    try {
      const { results, query } = req.body;

      if (!results) {
        return res.status(400).json({ error: "Simulation results context is required for explanation." });
      }

      // Check if API key is provided before calling Gemini. Lazy setup throws if empty.
      const ai = getAiClient();

      const processesContext = results.processes.map((p: any) => {
        return `* ${p.id}: Arrival Time = ${p.arrivalTime}, Burst Time = ${p.burstTime}, Completion Time = ${p.completionTime}, Turnaround Time = ${p.turnaroundTime}, Waiting Time = ${p.waitingTime}, Response Time = ${p.responseTime}`;
      }).join("\n");

      const promptText = `
User is studying CPU Scheduling and has conducted a Round Robin (RR) execution with these settings:
- Time Quantum: ${results.quantum}
- Context Switch Switch Overhead: ${results.contextSwitch}

Process scheduling details:
${processesContext}

Averages & Performance:
- Average Turnaround Time: ${results.averages.averageTurnaroundTime.toFixed(2)}
- Average Waiting Time: ${results.averages.averageWaitingTime.toFixed(2)}
- Average Response Time: ${results.averages.averageResponseTime.toFixed(2)}
- CPU Utilization: ${results.averages.cpuUtilization.toFixed(1)}%
- Throughput: ${results.averages.throughput.toFixed(4)} processes per unit time
- Total execution span: ${results.averages.totalTime} units

User's study question:
"${query || "Explain this simulation and what happens when you adjust the time quantum length."}"

As an expert OS Classroom Professor, output a structured, insightful, and motivating commentary explaining the question. Ensure you discuss how this specific process distribution is influenced by the Quantum length (e.g. FCFS boundary if quantum is massive, context-switch thrashing if quantum is too low). Use elegant markdown highlights.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: "You are an elite, helpful operating systems professor. Write elegant responses using clear headings, bulletin lists, and code/metric style accents to make information highly consumable for a college-level student.",
        }
      });

      return res.json({ response: response.text });
    } catch (error: any) {
      console.error("Gemini tutoring error:", error);
      // Give a friendly informative warning instead of crashing
      return res.status(500).json({ 
        error: error.message || "Failed to contact Gemini tutoring. Check your GEMINI_API_KEY environment variable settings."
      });
    }
  });

  // Serve static assets or mount Vite dev handler
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Round Robin scheduling server loaded on http://0.0.0.0:${PORT}`);
  });
}

startServer();
