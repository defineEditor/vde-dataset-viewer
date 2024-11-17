import DatasetJson from 'js-stream-dataset-json';
import openFile from './openFile';

class FileManager {
    private openedFiles: { [key: string]: DatasetJson } = {};

    constructor() {
        this.openedFiles = {};
    }

    getFileId(): string {
        const allIds = Object.keys(this.openedFiles);
        for (let i = 0; i <= allIds.length; i += 1) {
            const id = i.toString();
            if (allIds.includes(id) === false) {
                return id;
            }
        }
        return '';
    }

    handleFileOpen = async (
        _event: Electron.IpcMainInvokeEvent,
        mode: 'local' | 'remote'
    ): Promise<string | undefined> => {
        const newFile = await openFile();

        if (newFile === undefined) {
            return undefined;
        }

        if (mode === 'remote') {
            return newFile.path;
        }

        const fileId = this.getFileId();
        const data = new DatasetJson(newFile.path);
        this.openedFiles[fileId] = data;

        return fileId;
    };

    handleFileClose = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string,
        mode: 'local' | 'remote'
    ): Promise<boolean> => {
        if (mode === 'local') {
            if (this.openedFiles[fileId]) {
                delete this.openedFiles[fileId];
            }
            return true;
        }
        if (mode === 'remote') {
            if (this.openedFiles[fileId]) {
                delete this.openedFiles[fileId];
            }
            return true;
        }

        return false;
    };

    handleGetMetadata = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string
    ) => {
        if (this.openedFiles[fileId]) {
            const metadata = await this.openedFiles[fileId].getMetadata();
            return metadata;
        }
        return undefined;
    };

    handleGetObservations = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string,
        start: number,
        length: number
    ) => {
        if (this.openedFiles[fileId]) {
            const data = await this.openedFiles[fileId].getData({start, length});
            return data;
        }
        return undefined;
    };
}

export default FileManager;
