import scheduler from "@/lib/scheduler";

export class SchedulerService {
  register(id: string, name: string, intervalHours: number, fn: () => Promise<void>): void {
    scheduler.register(id, name, intervalHours, fn);
  }

  runNow(id: string): Promise<void> {
    return scheduler.runTaskNow(id);
  }

  getTaskCount(): number {
    // Scheduler exposes tasks via its internal Map; count registered tasks
    const keys = Object.keys(scheduler).filter((k) => k !== "isRunning" && k !== "checkInterval");
    return keys.length;
  }
}
