import { IpcMainInvokeEvent } from 'electron';
import fs from 'fs';
import path from 'path';

class ReportManager {
    private reportsDirectory: string;

    constructor(reportsDirectory: string) {
        this.reportsDirectory = reportsDirectory;
        // Check if the reports directory exists
        if (!fs.existsSync(this.reportsDirectory)) {
            // If not, create it
            fs.mkdirSync(this.reportsDirectory, { recursive: true });
        }
    }

    /**
     * Reads a validation report from the file system
     * @param fileName The name of the report file to read
     * @returns The report content as a string, or null if file doesn't exist
     */
    public readValidationReport = (
        _event: IpcMainInvokeEvent,
        fileName: string,
    ): string | null => {
        try {
            const filePath = path.join(this.reportsDirectory, fileName);

            if (!fs.existsSync(filePath)) {
                return null;
            }

            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            // Error reading report file
            return null;
        }
    };

    /**
     * Deletes a validation report from the file system
     * @param fileName The name of the report file to delete
     * @returns True if deletion was successful, false otherwise
     */
    public deleteValidationReport = (
        _event: IpcMainInvokeEvent,
        fileName: string,
    ): boolean => {
        try {
            const filePath = path.join(this.reportsDirectory, fileName);

            if (!fs.existsSync(filePath)) {
                return false;
            }

            fs.unlinkSync(filePath);
            return true;
        } catch (error) {
            // Error deleting report file
            return false;
        }
    };
}

export default ReportManager;
