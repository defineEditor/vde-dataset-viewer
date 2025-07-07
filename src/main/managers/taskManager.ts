import { UtilityProcess, utilityProcess, app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import {
    ConvertTask,
    ValidateTask,
    MainTask,
    MainProcessTask,
} from 'interfaces/common';
import { mainTaskTypes } from 'misc/constants';

class TaskManager {
    private processes: Map<string, UtilityProcess>;

    private taskQueue: MainProcessTask[];

    private running: number;

    private maxThreads: number;

    private mainWindow: BrowserWindow | null;

    private reportsDirectory: string;

    constructor({ reportsDirectory }: { reportsDirectory: string }) {
        this.reportsDirectory = reportsDirectory;
        if (!fs.existsSync(this.reportsDirectory)) {
            throw new Error(
                `Reports directory does not exist: ${this.reportsDirectory}`,
            );
        }
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
                this.startProcess(next);
            }
        }
    }

    private async startProcess(processTask: MainProcessTask): Promise<void> {
        const { type, id, options } = processTask;
        const process = this.createProcess(type);
        this.processes.set(id, process);
        // Add AppVersion as it is available only in main process
        if (type === mainTaskTypes.CONVERT) {
            process.postMessage({
                ...processTask,
                options: {
                    ...options,
                    appVersion: app.getVersion(),
                },
            });
        } else if (type === mainTaskTypes.VALIDATE) {
            process.postMessage({
                ...processTask,
                outputDir: this.reportsDirectory,
            });
        }

        return new Promise((resolve) => {
            process.on('message', (progressResult) => {
                if (this.mainWindow === null) {
                    return;
                }
                if (type === mainTaskTypes.VALIDATE) {
                    if (progressResult.progress === 100) {
                        this.mainWindow.webContents.send(
                            'renderer:taskProgress',
                            {
                                type: mainTaskTypes.VALIDATE,
                                id: progressResult.id,
                                progress: progressResult.progress,
                                result: progressResult.result,
                                error: progressResult.error,
                            },
                        );
                    } else {
                        this.mainWindow.webContents.send(
                            'renderer:taskProgress',
                            {
                                type: mainTaskTypes.VALIDATE,
                                id: progressResult.id,
                                progress: progressResult.progress,
                            },
                        );
                    }
                } else if (type === mainTaskTypes.CONVERT) {
                    this.mainWindow.webContents.send('renderer:taskProgress', {
                        type: mainTaskTypes.CONVERT,
                        id: progressResult.id,
                        progress: progressResult.progress,
                        fullPath: progressResult.fullPath,
                        fileName: progressResult.fileName,
                    });
                }
            });

            process.once('exit', (code) => {
                this.processes.delete(id);
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
        if (task.type === mainTaskTypes.CONVERT) {
            this.maxThreads = task.options?.threads || 1;
            const result = await this.handleConveterTask(task);
            return result;
        }
        if (task.type === mainTaskTypes.VALIDATE) {
            this.maxThreads = task.options?.poolSize || 1;
            const result = await this.handleValidateTask(task);
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
                return { error: 'Destination folder does not exist' };
            }
            task.files.forEach((file, index) => {
                this.taskQueue.push({
                    type: task.type,
                    id: `${task.id}-${index}`,
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

    public async handleValidateTask(
        task: ValidateTask,
    ): Promise<boolean | { error: string }> {
        try {
            // Check validator exists and is a executable
            if (
                !fs.existsSync(task.options.validatorPath) ||
                !fs.statSync(task.options.validatorPath).isFile()
            ) {
                return { error: 'Destination folder does not exist' };
            }
            this.taskQueue.push({
                type: task.type,
                id: task.id,
                options: task.options,
                configuration: task.configuration,
                validationDetails: task.validationDetails,
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

        // Generate debug arguments if in development or DEBUG_PROD is enabled
        const debugArgs: string[] = [];
        if (
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
        ) {
            // Generate a unique port based on the task type to avoid conflicts
            let portOffset = 0;
            switch (taskType) {
                case mainTaskTypes.CONVERT:
                    portOffset = 10;
                    break;
                case mainTaskTypes.VALIDATE:
                    portOffset = 20;
                    break;
                default:
                    portOffset = 30;
                    break;
            }
            const debugPort = 9229 + portOffset;
            debugArgs.push(`--inspect=${debugPort}`);
        }

        return utilityProcess.fork(processPath, debugArgs, {
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
