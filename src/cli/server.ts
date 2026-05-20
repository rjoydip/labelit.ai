import { spawn, exec } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { ServerConfig } from "./types";

export interface StartOptions {
  port?: number;
  apiKey?: string;
}

export interface ServerStatus {
  running: boolean;
  pid?: number;
  url?: string;
  startedAt?: number;
}

export class ServerManager {
  private static readonly DIR_NAME = ".labelit";
  private static readonly PID_FILE = "server.pid";
  private static readonly STATUS_FILE = "server.status";

  private static getDirPath(): string {
    return join(process.cwd(), this.DIR_NAME);
  }

  private static getFilePath(filename: string): string {
    return join(this.getDirPath(), filename);
  }

  private static ensureDir(): void {
    const dir = this.getDirPath();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  static async start(options: StartOptions = {}): Promise<void> {
    const port = options.port || 8787;
    const apiKey = options.apiKey || process.env.LABELIT_API_KEY || "";

    this.ensureDir();

    const pidFile = this.getFilePath(this.PID_FILE);
    const statusFile = this.getFilePath(this.STATUS_FILE);
    const isWindows = process.platform === "win32";

    if (existsSync(pidFile)) {
      const pidText = readFileSync(pidFile, "utf-8").trim();
      const existingPid = parseInt(pidText, 10);
      if (!isNaN(existingPid)) {
        try {
          if (isWindows) {
            await new Promise<void>((resolve) => {
              exec(`tasklist /FI "PID eq ${existingPid}" /NH`, (err, stdout) => {
                if (!err && stdout.includes(pidText)) {
                  console.log("Server already running on PID", existingPid);
                  process.exit(0);
                }
                resolve();
              });
            });
          } else {
            process.kill(existingPid, 0);
            console.log("Server already running on PID", existingPid);
            return;
          }
        } catch {
          unlinkSync(pidFile);
        }
      }
    }

    console.log(`Starting labelit.ai server on port ${port}...`);

    const env = { ...process.env, LABELIT_API_KEY: apiKey };

    if (process.platform === "win32") {
      spawn("start", ["/b", "bun", "run", "src/cli/server-standalone.ts"], {
        cwd: process.cwd(),
        shell: true,
        env,
      });

      writeFileSync(
        statusFile,
        JSON.stringify({
          url: `http://localhost:${port}`,
          startedAt: Date.now(),
        }),
        "utf-8",
      );
    } else {
      const server = spawn("bun", ["run", "src/cli/server-standalone.ts"], {
        cwd: process.cwd(),
        stdio: "ignore",
        detached: true,
        env,
      });

      writeFileSync(pidFile, String(server.pid ?? ""), "utf-8");
      writeFileSync(
        statusFile,
        JSON.stringify({
          pid: server.pid,
          url: `http://localhost:${port}`,
          startedAt: Date.now(),
        }),
        "utf-8",
      );

      server.unref();
    }

    console.log(`Server started`);
    console.log(`API URL: http://localhost:${port}`);
    console.log("Server is running in background");
  }

  static async stop(): Promise<void> {
    const statusFile = this.getFilePath(this.STATUS_FILE);

    if (!existsSync(statusFile)) {
      console.log("No server running");
      return;
    }

    if (process.platform === "win32") {
      exec(`netstat -ano | findstr :8787 | findstr LISTENING`, (err, stdout) => {
        if (stdout) {
          const match = stdout.match(/\d+$/);
          if (match) {
            exec(`taskkill /PID ${match[0]} /F`, () => {});
          }
        }
      });
      console.log("Server stopped");
    } else {
      const pidFile = this.getFilePath(this.PID_FILE);
      if (existsSync(pidFile)) {
        const pidText = readFileSync(pidFile, "utf-8").trim();
        const pid = parseInt(pidText, 10);
        if (!isNaN(pid)) {
          try {
            process.kill(pid);
            console.log(`Server (PID ${pid}) stopped`);
          } catch {
            console.log("Server process not found");
          }
        }
      }
    }

    try {
      unlinkSync(statusFile);
    } catch {
      /* ignore */
    }
    const pidFile = this.getFilePath(this.PID_FILE);
    try {
      unlinkSync(pidFile);
    } catch {
      /* ignore */
    }
  }

  static async status(): Promise<ServerStatus> {
    const statusFile = this.getFilePath(this.STATUS_FILE);

    if (!existsSync(statusFile)) {
      return { running: false };
    }

    if (process.platform === "win32") {
      const isRunning = await new Promise<boolean>((resolve) => {
        exec(`netstat -ano | findstr :8787`, (_, stdout) => {
          resolve(stdout.includes("LISTENING"));
        });
      });

      if (!isRunning) {
        try {
          unlinkSync(statusFile);
        } catch {
          /* ignore */
        }
        return { running: false };
      }
    }

    try {
      const status = JSON.parse(readFileSync(statusFile, "utf-8"));
      return {
        running: true,
        pid: status.pid,
        url: status.url,
        startedAt: status.startedAt,
      };
    } catch {
      return { running: true };
    }
  }

  static async isRunning(config?: ServerConfig): Promise<boolean> {
    if (!config) {
      const status = await this.status();
      return status.running;
    }

    try {
      const response = await fetch(`${config.url}/api/status`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async waitForServer(config: ServerConfig, timeout = 10000): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await this.isRunning(config)) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    return false;
  }
}
