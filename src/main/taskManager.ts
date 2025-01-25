import { UtilityProcess, utilityProcess, app, BrowserWindow } from 'electron';
import path from 'path';
import { ConvertedFileInfo, MainTask } from 'interfaces/common';
import { MainTaskType } from 'misc/constants';

class TaskManager {
    private processes: Map<string, UtilityProcess>;

    private taskQueue: {
        type: MainTaskType;
        index: number;
        file: ConvertedFileInfo;
    }[];

    private running: number;

    private maxThreads: number;

    private mainWindow: BrowserWindow | null;

    constructor() {
        this.processes = new Map();
        this.taskQueue = [];
        this.running = 0;
        this.maxThreads = 1;
        this.mainWindow = null;
    }

    private async processQueue(): Promise<void> {
        while (this.taskQueue.length > 0 && this.running < this.maxThreads) {
            const next = this.taskQueue.shift();
            if (next) {
                // We need to wait for the process to increate the counter before starting the next one
                // eslint-disable-next-line no-await-in-loop
                await this.startProcess(next.type, next.index, next.file);
            }
        }
    }

    private async startProcess(
        type: MainTaskType,
        index: number,
        file: ConvertedFileInfo,
    ): Promise<void> {
        this.running++;
        const process = this.createProcess(type);
        const processId = `${type}-${index.toString()}`;
        this.processes.set(processId, process);
        process.postMessage({ processId, file });

        return new Promise((resolve) => {
            process.on('message', (progressResult) => {
                const { id, progress } = progressResult;
                if (this.mainWindow === null) {
                    return;
                }
                this.mainWindow.webContents.send('renderer:taskProgress', {
                    id,
                    progress,
                });
            });

            process.once('exit', (code) => {
                this.processes.delete(processId);
                this.running--;
                if (code !== 0) {
                    // Handle error
                }
                this.processQueue();
                resolve();
            });
        });
    }

    public async handleTask(
        task: MainTask,
        mainWindow: BrowserWindow,
    ): Promise<boolean> {
        try {
            this.mainWindow = mainWindow;
            this.maxThreads = task.options?.threads || 1;

            task.files.forEach((file, index) => {
                this.taskQueue.push({ type: task.type, index, file });
            });

            await this.processQueue();
            return true;
        } catch (error) {
            return false;
        }
    }

    private getWorkerPath(taskType: string): string {
        if (app.isPackaged) {
            // For production build
            return path.join(
                process.resourcesPath,
                'app.asar',
                'src',
                'main',
                'workers',
                `${taskType}Worker.js`,
            );
        }
        // For development
        return path.join(
            app.getAppPath(),
            'src',
            'main',
            'workers',
            `${taskType}Worker.js`,
        );
    }

    private createProcess(taskType: string): UtilityProcess {
        const processPath = this.getWorkerPath(taskType);
        return utilityProcess.fork(processPath, [], {
            env: process.env,
            stdio: 'inherit',
        });
    }

    public cleanup(): void {
        this.taskQueue = [];
        Array.from(this.processes.values()).forEach((process) => {
            process.kill();
        });
        this.processes.clear();
        this.running = 0;
    }
}

export default TaskManager;
