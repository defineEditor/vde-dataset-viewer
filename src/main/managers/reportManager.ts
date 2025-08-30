import { IpcMainInvokeEvent } from 'electron';
import fs from 'fs';
import {
    ParsedValidationReport,
    ValidationReportCompare,
} from 'interfaces/common';
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

            // Delete the XLSX file if present
            const xlsxFileName = path.join(
                this.reportsDirectory,
                fileName.replace('.json', '.xlsx'),
            );
            if (fs.existsSync(xlsxFileName)) {
                fs.unlinkSync(xlsxFileName);
            }

            return true;
        } catch (error) {
            // Error deleting report file
            return false;
        }
    };

    public getValidationReport = (
        _event: IpcMainInvokeEvent,
        fileName: string,
    ): ParsedValidationReport | null => {
        try {
            const filePath = path.join(this.reportsDirectory, fileName);

            if (!fs.existsSync(filePath)) {
                return null;
            }

            // Try to serialize
            const report = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return report;
        } catch (error) {
            // Error reading report file
            return null;
        }
    };

    // Compare reports
    public compareValidationReports = (
        _event: IpcMainInvokeEvent,
        fileNameBase: string,
        fileNameComp: string,
    ): ValidationReportCompare | null => {
        const reportBase = this.getValidationReport(_event, fileNameBase);
        const reportComp = this.getValidationReport(_event, fileNameComp);

        if (!reportBase || !reportComp) {
            return null;
        }

        // Compare summaries to find differences
        const oldIssues = reportBase.Issue_Summary;
        const newIssues = reportComp.Issue_Summary;

        // Create maps for easier comparison using core_id as unique identifier
        const oldIssueMap = new Map(
            oldIssues.map((issue) => [issue.core_id, issue]),
        );
        const newIssueMap = new Map(
            newIssues.map((issue) => [issue.core_id, issue]),
        );

        let newIssuesCount = 0;
        let changedIssuesCount = 0;
        let resolvedIssuesCount = 0;

        // Find new and changed issues
        for (const [key, newIssue] of newIssueMap) {
            const oldIssue = oldIssueMap.get(key);
            if (!oldIssue) {
                newIssuesCount++;
            } else if (oldIssue.issues !== newIssue.issues) {
                changedIssuesCount++;
            }
        }

        // Find resolved issues
        for (const [key] of oldIssueMap) {
            if (!newIssueMap.has(key)) {
                resolvedIssuesCount++;
            }
        }

        const result = {
            counts: {
                newIssues: newIssuesCount,
                changedIssues: changedIssuesCount,
                resolvedIssues: resolvedIssuesCount,
            },
        };

        return result;
    };
}

export default ReportManager;
