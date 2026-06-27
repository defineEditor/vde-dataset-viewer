import fs from 'fs';
import { WebContents } from 'electron';
import { FileWatcherEvent } from 'interfaces/common';

interface WatchedFile {
    fileId: string;
    filePath: string;
    watcher: fs.FSWatcher | null;
    lastMtime: number;
    sender: WebContents;
    debounceTimer: ReturnType<typeof setTimeout> | null;
}

class FileWatcher {
    private watchedFiles: Map<string, WatchedFile> = new Map();

    private watcherErrors: Map<string, { count: number; time: string[] }> =
        new Map();

    // Start watching a file for changes
    public watchFile(
        fileId: string,
        filePath: string,
        currentMtime: number,
        sender: WebContents,
    ): void {
        // If already watching this file, stop it first
        if (this.watchedFiles.has(fileId)) {
            this.stopWatching(fileId);
        }

        const watchedFile: WatchedFile = {
            fileId,
            filePath,
            watcher: null,
            lastMtime: currentMtime,
            sender,
            debounceTimer: null,
        };

        try {
            watchedFile.watcher = fs.watch(filePath, () => {
                this.handleFileChange(watchedFile);
            });

            // Handle watcher errors (file deleted, permission denied, etc.)
            watchedFile.watcher.on('error', (_error: NodeJS.ErrnoException) => {
                // Update error tracking
                const now = new Date().toISOString();
                const errorInfo = this.watcherErrors.get(fileId) || {
                    count: 0,
                    time: [],
                };
                errorInfo.count += 1;
                errorInfo.time.push(now);
                this.watcherErrors.set(fileId, errorInfo);

                // Hard limit to prevent infinite restart loops
                if (errorInfo.count <= 100) {
                    this.restartWatching(fileId);
                } else {
                    this.stopWatching(fileId);
                }
            });

            this.watchedFiles.set(fileId, watchedFile);
        } catch (error) {
            if (!sender || sender.isDestroyed()) {
                return;
            }
            sender.send('renderer:snackbarMessage', {
                type: 'error',
                message: `Failed to watch file ${filePath}: ${(error as Error).message}`,
            });
        }
    }

    // Stop watching a file
    public stopWatching(fileId: string): void {
        const watchedFile = this.watchedFiles.get(fileId);
        if (!watchedFile) {
            return;
        }

        // Clear debounce timer if pending
        if (watchedFile.debounceTimer) {
            clearTimeout(watchedFile.debounceTimer);
            watchedFile.debounceTimer = null;
        }

        // Close watcher
        if (watchedFile.watcher) {
            watchedFile.watcher.close();
            watchedFile.watcher = null;
        }

        this.watchedFiles.delete(fileId);
    }

    public async restartWatching(
        fileId: string,
        delay?: number,
    ): Promise<void> {
        const watchedFile = this.watchedFiles.get(fileId);
        if (!watchedFile) {
            return;
        }

        // Stop current watcher
        this.stopWatching(fileId);

        // Restart watching after a delay (default 1 second)
        await new Promise((resolve) => {
            setTimeout(resolve, delay ?? 1000);
        });

        // Get current mtime
        let currentMtime = watchedFile.lastMtime;
        try {
            const stats = fs.statSync(watchedFile.filePath);
            currentMtime = stats.mtime.getTime();
        } catch (error) {
            // If file doesn't exist, emit deleted event and return
            // Check if file exists
            if (!fs.existsSync(watchedFile.filePath)) {
                const now = new Date().toISOString();
                const errorInfo = this.watcherErrors.get(fileId) || {
                    count: 0,
                    time: [],
                };
                errorInfo.count += 1;
                errorInfo.time.push(`${now} (file not found)`);
                this.watcherErrors.set(fileId, errorInfo);
                this.emitChange(
                    {
                        fileId: watchedFile.fileId,
                        filePath: watchedFile.filePath,
                        changeType: 'deleted',
                    },
                    watchedFile.sender,
                );
                return;
            }
        }

        // Start watching again
        this.watchFile(
            watchedFile.fileId,
            watchedFile.filePath,
            currentMtime,
            watchedFile.sender,
        );
    }

    // Stop all watchers
    public stopAllWatchers(): void {
        for (const fileId of Array.from(this.watchedFiles.keys())) {
            this.stopWatching(fileId);
        }
    }

    // Handle file change event with debouncing
    private handleFileChange(watchedFile: WatchedFile): void {
        // Clear existing debounce timer
        if (watchedFile.debounceTimer) {
            clearTimeout(watchedFile.debounceTimer);
        }

        // Set new debounce timer (500ms)
        watchedFile.debounceTimer = setTimeout(() => {
            this.checkFileStatus(watchedFile);
            watchedFile.debounceTimer = null;
        }, 500);
    }

    // Check if file still exists and has changed
    private checkFileStatus(watchedFile: WatchedFile): void {
        try {
            // Check if file exists
            if (!fs.existsSync(watchedFile.filePath)) {
                // File was deleted
                this.emitChange(
                    {
                        fileId: watchedFile.fileId,
                        filePath: watchedFile.filePath,
                        changeType: 'deleted',
                    },
                    watchedFile.sender,
                );
                // Remove from watched files
                this.stopWatching(watchedFile.fileId);
                return;
            }

            // Get current file stats
            const stats = fs.statSync(watchedFile.filePath);
            const currentMtime = stats.mtime.getTime();

            // Check if mtime changed
            if (currentMtime !== watchedFile.lastMtime) {
                watchedFile.lastMtime = currentMtime;
                this.emitChange(
                    {
                        fileId: watchedFile.fileId,
                        filePath: watchedFile.filePath,
                        changeType: 'updated',
                    },
                    watchedFile.sender,
                );
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
                `Error checking file status for ${watchedFile.filePath}:`,
                error,
            );
            this.stopWatching(watchedFile.fileId);
        }
    }

    // Emit file change event to renderer
    private emitChange(event: FileWatcherEvent, sender: WebContents): void {
        if (!sender || sender.isDestroyed()) {
            return;
        }
        sender.send('renderer:fileChanged', event);
    }

    // Get list of watched file IDs
    public getWatchedFileIds(): string[] {
        return Array.from(this.watchedFiles.keys());
    }

    // Get list of watched file paths
    public getWatchedFilePaths(): string[] {
        return Array.from(this.watchedFiles.values()).map(
            (watchedFile) => watchedFile.filePath,
        );
    }

    // Get watcher error info for all files
    public getWatcherErrors(): Map<string, { count: number; time: string[] }> {
        return new Map(this.watcherErrors);
    }
}

export default FileWatcher;
