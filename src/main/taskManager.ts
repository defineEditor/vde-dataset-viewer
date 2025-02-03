import { UtilityProcess, utilityProcess, app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { ConvertedFileInfo, ConvertTask, MainTask } from 'interfaces/common';
import { MainTaskType, mainTaskTypes } from 'misc/constants';

class TaskManager {
    private processes: Map<string, UtilityProcess>;

    private taskQueue: {
        type: MainTaskType;
        index: number;
        file: ConvertedFileInfo;
        options: ConvertTask['options'];
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

    private hasPendingTasks(): boolean {
        return this.taskQueue.length > 0 || this.running > 0;
    }

    private async processQueue(): Promise<void> {
        while (this.taskQueue.length > 0 && this.running < this.maxThreads) {
            const next = this.taskQueue.shift();
            if (next) {
                this.running++;
                this.startProcess(
                    next.type,
                    next.index,
                    next.file,
                    next.options,
                );
            }
        }
    }

    private async startProcess(
        type: MainTaskType,
        index: number,
        file: ConvertedFileInfo,
        options: ConvertTask['options'],
    ): Promise<void> {
        const process = this.createProcess(type);
        const processId = `${type}-${index.toString()}`;
        this.processes.set(processId, process);
        // Version to the options object
        process.postMessage({
            processId,
            file,
            options: { ...options, appVersion: app.getVersion() },
        });

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
    ): Promise<boolean | { error: string }> {
        this.mainWindow = mainWindow;
        this.maxThreads = task.options?.threads || 1;
        if (task.type === mainTaskTypes.CONVERT) {
            const result = await this.handleConveterTask(task);
            return result;
        }
        return false;
    }

    public async handleConveterTask(
        task: ConvertTask,
    ): Promise<boolean | { error: string }> {
        try {
            // Check destination folder exists
            if (!fs.existsSync(task.options.destinationDir)) {
                throw new Error('Destination folder does not exist');
            }
            task.files.forEach((file, index) => {
                this.taskQueue.push({
                    type: task.type,
                    index,
                    file,
                    options: task.options,
                });
            });

            await this.processQueue();

            // Wait till all tasks are completed
            await new Promise<void>((resolve) => {
                const checkTasks = () => {
                    if (!this.hasPendingTasks()) {
                        resolve();
                    } else {
                        setTimeout(checkTasks, 500);
                    }
                };
                checkTasks();
            });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                return { error: error.message };
            }
            return false;
        }
    }

    private getWorkerPath(taskType: string): string {
        if (app.isPackaged) {
            // For production build
            return path.join(
                process.resourcesPath,
                'app.asar',
                'dist',
                'main',
                'workers',
                `${taskType}Worker.js`,
            );
        }
        // For development
        return path.join(
            app.getAppPath(),
            '.erb',
            'dll',
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
