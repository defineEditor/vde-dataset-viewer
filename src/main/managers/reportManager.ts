import { IpcMainInvokeEvent, BrowserWindow } from 'electron';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import {
    ParsedValidationReport,
    ValidationReportCompare,
} from 'interfaces/common';
import FileManager from 'main/managers/fileManager';

const gunzipPromise = promisify(zlib.gunzip);
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
                fileName.replace(/\.json\.gz$|\.json$/, '.xlsx'),
            );
            if (fs.existsSync(xlsxFileName)) {
                fs.unlinkSync(xlsxFileName);
            }

            // Delete the log file if present
            const logFileName = path.join(
                this.reportsDirectory,
                fileName.replace(/\.json\.gz$|\.json$/, '.log'),
            );
            if (fs.existsSync(logFileName)) {
                fs.unlinkSync(logFileName);
            }

            return true;
        } catch (error) {
            // Error deleting report file
            return false;
        }
    };

    public getValidationReport = async (
        _event: IpcMainInvokeEvent,
        fileName: string,
    ): Promise<ParsedValidationReport | null> => {
        try {
            const filePath = path.join(this.reportsDirectory, fileName);

            if (!fs.existsSync(filePath)) {
                return null;
            }

            // Report is gzipped
            if (fileName.endsWith('.gz')) {
                const compressedData = await fsPromises.readFile(filePath);
                const decompressedData = await gunzipPromise(compressedData);
                const report = JSON.parse(decompressedData.toString('utf-8'));
                return report;
            }

            const rawData = await fsPromises.readFile(filePath, 'utf-8');
            // Try to serialize
            const report = JSON.parse(rawData);
            return report;
        } catch (error) {
            // Error reading report file
            return null;
        }
    };

    // Compare reports
    public compareValidationReports = async (
        _event: IpcMainInvokeEvent,
        fileNameBase: string,
        fileNameComp: string,
    ): Promise<ValidationReportCompare | null> => {
        const reportBase = await this.getValidationReport(_event, fileNameBase);
        const reportComp = await this.getValidationReport(_event, fileNameComp);

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

    public downloadValidationReport = async (
        event: IpcMainInvokeEvent,
        fileName: string,
        initialFolder: string,
    ): Promise<string | boolean> => {
        try {
            // Get folder
            const fileManager = new FileManager();
            const destination = await fileManager.openFolder(event, {
                initialFolder,
            });
            if (destination) {
                // If user canceled folder selection, return empty string
                if (destination.length === 0) {
                    return '';
                }
                // Copy Excel file to the destination folder
                const xlsxFileName = fileName.replace(
                    /(.json|.json.gz)$/,
                    '.xlsx',
                );
                const xlsxFilePath = path.join(
                    this.reportsDirectory,
                    xlsxFileName,
                );
                if (fs.existsSync(xlsxFilePath)) {
                    const destXlsxPath = path.join(
                        destination[0],
                        xlsxFileName,
                    );
                    await fsPromises.copyFile(xlsxFilePath, destXlsxPath);
                    return destination[0];
                }
                return false;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    public showValidationLog = async (
        _event: IpcMainInvokeEvent,
        logFileName: string,
    ): Promise<string | null> => {
        try {
            const logFilePath = path.join(this.reportsDirectory, logFileName);

            if (fs.existsSync(logFilePath)) {
                // Read the log file content
                const logContent = await fsPromises.readFile(
                    logFilePath,
                    'utf-8',
                );

                // Create new window
                const logWindow = new BrowserWindow({
                    width: 800,
                    height: 600,
                    title: `Log File: ${logFileName}`,
                    autoHideMenuBar: true,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        sandbox: true,
                    },
                });

                // Create HTML content with the log
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Log File: ${logFileName}</title>
                        <style>
                            body {
                                font-family: 'Courier New', monospace;
                                margin: 20px;
                                background: #ffffffff;
                                color: #181818ff;
                            }
                            pre {
                                white-space: pre-wrap;
                                word-wrap: break-word;
                                font-size: 12px;
                                line-height: 1.4;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Log File: ${logFileName}</h2>
                        <pre>${logContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                    </body>
                    </html>
                `;

                // Load the HTML content
                logWindow.loadURL(
                    `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
                );

                return logFilePath;
            }
            return null;
        } catch (error) {
            return null;
        }
    };
}

export default ReportManager;
