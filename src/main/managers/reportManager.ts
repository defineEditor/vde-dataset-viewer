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

        // Create maps for easier comparison using core_id as unique identifier
        // Each core_id can have multiple issues (one per dataset)
        const oldIssueMap = new Map<
            string,
            ParsedValidationReport['Issue_Summary']
        >();
        const newIssueMap = new Map<
            string,
            ParsedValidationReport['Issue_Summary']
        >();

        // Group old issues by core_id
        reportComp.Issue_Summary.forEach((issue) => {
            if (!oldIssueMap.has(issue.core_id)) {
                oldIssueMap.set(issue.core_id, []);
            }
            oldIssueMap.get(issue.core_id)!.push(issue);
        });

        // Group new issues by core_id
        reportBase.Issue_Summary.forEach((issue) => {
            if (!newIssueMap.has(issue.core_id)) {
                newIssueMap.set(issue.core_id, []);
            }
            newIssueMap.get(issue.core_id)!.push(issue);
        });

        // Get a list of all skipped issues in the new report
        const skippedIssues = reportBase.Rules_Report.filter(
            (issue) => issue.status === 'SKIPPED',
        ).map((issue) => issue.core_id);

        let newIssuesCount = 0;
        let changedIssuesCount = 0;
        let resolvedIssuesCount = 0;
        let skippedIssueCount = 0;

        // Find new and changed issues
        for (const [key, newIssueArray] of newIssueMap) {
            const oldIssueArray = oldIssueMap.get(key);
            if (!oldIssueArray) {
                // This is a completely new issue (rule didn't exist before)
                newIssuesCount++;
            } else {
                // Compare the total issue counts for this rule across all datasets
                const oldTotalIssues = oldIssueArray.reduce(
                    (sum, issue) => sum + issue.issues,
                    0,
                );
                const newTotalIssues = newIssueArray.reduce(
                    (sum, issue) => sum + issue.issues,
                    0,
                );

                if (oldTotalIssues !== newTotalIssues) {
                    changedIssuesCount++;
                }
            }
        }

        // Find resolved and skipped issues
        for (const [key] of oldIssueMap) {
            if (!newIssueMap.has(key)) {
                // Check if the rule was skipped in the new report
                if (skippedIssues.includes(key)) {
                    skippedIssueCount++;
                } else {
                    resolvedIssuesCount++;
                }
            }
        }

        const result = {
            counts: {
                newIssues: newIssuesCount,
                changedIssues: changedIssuesCount,
                resolvedIssues: resolvedIssuesCount,
                skippedIssues: skippedIssueCount,
            },
        };

        return result;
    };
}

export default ReportManager;
