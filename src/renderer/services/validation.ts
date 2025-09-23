import {
    ISettings,
    TaskProgress,
    ValidatorConfig,
    ValidateTask,
    ConvertTask,
    ConvertedFileInfo,
    ValidationTaskFile,
    MainTask,
    ParsedValidationReport,
    ValidationReportCompare,
} from 'interfaces/common';
import store from 'renderer/redux/store';
import { mainTaskTypes } from 'misc/constants';
import {
    addValidationReport,
    setValidatorData,
} from 'renderer/redux/slices/data';
import { updateValidation, openSnackbar } from 'renderer/redux/slices/ui';

// Minimal interface for ApiService context
interface ApiServiceContext {
    startTask: (task: MainTask) => Promise<boolean | { error: string }>;
    subscribeToTaskProgress: (callback: (info: TaskProgress) => void) => void;
    cleanTaskProgressListeners: () => void;
}

// Validation functions

export const startValidation = async (
    context: ApiServiceContext,
    {
        files,
        configuration,
        settings,
        validationId,
    }: {
        files: ValidationTaskFile[];
        configuration: ValidatorConfig;
        settings: ISettings;
        validationId: string;
    },
): Promise<boolean | { error: string }> => {
    // Reset validation state
    store.dispatch(
        updateValidation({
            validationId,
            validation: {
                status: 'not started',
                validationProgress: 0,
                conversionProgress: null,
            },
        }),
    );

    // Clean previous listeners
    context.cleanTaskProgressListeners();

    // Select those files which need to be converted;
    const filesToConvert: ConvertedFileInfo[] = files
        .filter((file) => {
            return file.extension !== 'json' && file.extension !== 'xpt';
        })
        .map((file) => {
            return {
                fullPath: file.filePath,
                folder: '',
                filename: file.fileName,
                format: file.extension,
                size: 0, // Size will be set after conversion
                lastModified: Date.now(), // Last modified time can be set to current time
                datasetJsonVersion: '',
                outputName: `${file.fileName.replace(/\.[^/.]+$/, '')}.json`, // Replace extension with .json
            };
        });

    const conversionProgress: Record<string, number> = {};
    filesToConvert.forEach((file) => {
        conversionProgress[file.fullPath] = 0; // Initialize conversion progress for each file
    });

    let lastReportedConversionProgress = 0;
    let lastReportedValidationProgress = 0;
    let validationStartTime: number | null = null;
    let validationProgressThreshold = 1; // Start with 1% threshold

    // Set up progress subscription
    context.subscribeToTaskProgress(async (info: TaskProgress) => {
        if (
            info.type === mainTaskTypes.CONVERT &&
            info.id.replace(/-\d+$/, '') === validationId
        ) {
            // For the conversion task, we need to calculate the total progress based on the number of files which are converted
            if (info.fullPath) {
                // Update conversion progress for the specific file
                if (conversionProgress[info.fullPath] !== undefined) {
                    conversionProgress[info.fullPath] = info.progress;
                }
            }
            // Calculate overall conversion progress
            const totalProgress =
                Object.values(conversionProgress).reduce(
                    (acc, progress) => acc + progress,
                    0,
                ) / filesToConvert.length;

            // Report only every 5% of progress to avoid too frequent updates
            if (Math.abs(totalProgress - lastReportedConversionProgress) >= 5) {
                lastReportedConversionProgress =
                    Math.floor(totalProgress / 5) * 5;

                store.dispatch(
                    updateValidation({
                        validationId,
                        validation: {
                            validationProgress: 0,
                            conversionProgress: lastReportedConversionProgress,
                        },
                    }),
                );
            }
        } else if (
            info.type === mainTaskTypes.VALIDATE &&
            info.id === validationId
        ) {
            if (info.progress) {
                // Initialize validation start time on first progress update
                if (validationStartTime === null) {
                    validationStartTime = Date.now();
                }

                // Check if we should adjust the threshold after 5 seconds
                const elapsedTime = Date.now() - validationStartTime;
                if (elapsedTime <= 2000 && validationProgressThreshold === 1) {
                    // If we've made more than 5% progress in 2 seconds, switch to 5% reporting
                    if (info.progress > 5) {
                        validationProgressThreshold = 5;
                    }
                }

                if (
                    Math.abs(info.progress - lastReportedValidationProgress) >=
                    validationProgressThreshold
                ) {
                    lastReportedValidationProgress =
                        Math.floor(
                            info.progress / validationProgressThreshold,
                        ) * validationProgressThreshold;
                    store.dispatch(
                        updateValidation({
                            validationId,
                            validation: {
                                validationProgress:
                                    lastReportedValidationProgress,
                            },
                        }),
                    );
                }
            }
            if (info.progress === 100) {
                store.dispatch(
                    updateValidation({
                        validationId,
                        validation: {
                            status: 'completed',
                            dateCompleted: new Date().getTime(),
                        },
                    }),
                );
                if (info.error) {
                    store.dispatch(
                        openSnackbar({
                            message: info.error,
                            type: 'error',
                        }),
                    );
                } else if (info.result) {
                    // Only dispatch if result is a ValidationReport (has required properties)

                    if (
                        info.result &&
                        typeof info.result === 'object' &&
                        'date' in info.result
                    ) {
                        // First we need to compare with the previous reports
                        const allReports = Object.values(
                            store.getState().data.validator.reports,
                        );
                        const newReport = info.result;

                        // Find reports with exactly the same files
                        const sameFilesReports = allReports.filter((report) => {
                            if (
                                report.files.length !== newReport.files.length
                            ) {
                                return false;
                            }

                            // Check if all file paths match
                            return report.files.every((file) =>
                                newReport.files.some(
                                    (newFile) => newFile.file === file.file,
                                ),
                            );
                        });
                        if (sameFilesReports.length > 0) {
                            // Find the most recent report with same files
                            const mostRecentReport = sameFilesReports.reduce(
                                (latest, current) =>
                                    current.date > latest.date
                                        ? current
                                        : latest,
                            );
                            const reportCompare =
                                await compareValidationReports(
                                    newReport.output,
                                    mostRecentReport.output,
                                );
                            if (reportCompare) {
                                newReport.summary.changes =
                                    reportCompare.counts;
                            }
                        }
                        store.dispatch(addValidationReport(newReport));
                        // Open a snackbar to inform user
                        store.dispatch(
                            openSnackbar({
                                message: 'Validation completed',
                                type: 'success',
                            }),
                        );
                    }
                }
            }
        }
    });

    // Set status to validating
    store.dispatch(
        updateValidation({
            validationId,
            validation: { status: 'validating' },
        }),
    );

    // Save the configuration
    store.dispatch(
        setValidatorData({
            configuration,
        }),
    );

    let conversionTask: ConvertTask | null = null;

    if (filesToConvert.length > 0) {
        // Form a conversion task
        const outputFormat = 'DJ1.1';
        const destinationDir = '__TEMP__';

        conversionTask = {
            type: mainTaskTypes.CONVERT,
            files: filesToConvert,
            id: validationId,
            options: {
                prettyPrint: false,
                inEncoding: settings.other.inEncoding,
                outEncoding: settings.other.inEncoding,
                outputFormat,
                destinationDir,
                updateMetadata: false,
                metadata: {},
                ...settings.converter,
            },
        };
    }

    // For files which are converter, update the output name and path
    let filesToValidate: string[] = [];
    // Original file - used in the report of which files were validated
    const originalFiles: string[] = files.map((file) => file.filePath);
    if (conversionTask) {
        filesToValidate = files.map((file) => {
            const convertedFile = conversionTask.files.find((ctFile) => {
                return file.filePath === ctFile.fullPath;
            });
            if (convertedFile) {
                // Get OS delimiter for the path
                const pathDelimiter = window.electron.isWindows ? '\\' : '/';
                return `${conversionTask.options.destinationDir}${pathDelimiter}${
                    convertedFile.outputName
                }` as string;
            }
            return file.filePath;
        });
    } else {
        filesToValidate = files.map((file) => file.filePath);
    }

    // Form a validation task
    const validationTask: ValidateTask = {
        type: mainTaskTypes.VALIDATE,
        options: settings.validator,
        task: 'validate',
        id: validationId,
        configuration,
        validationDetails: {
            files: filesToValidate,
            originalFiles,
            folders: [],
        },
    };

    // If conversion task is present, execute it first and then validation
    if (conversionTask) {
        const conversionResult = await context.startTask(conversionTask);
        if (conversionResult === true) {
            const validationResult = await context.startTask(validationTask);
            return validationResult;
        }
        if (typeof conversionResult === 'object' && conversionResult.error) {
            store.dispatch(
                openSnackbar({
                    message: conversionResult.error,
                    type: 'error',
                }),
            );
        }

        return conversionResult;
    }
    const validationResult = await context.startTask(validationTask);
    return validationResult;
};

export const deleteValidationReport = async (
    fileName: string,
): Promise<boolean> => {
    const result = await window.electron.deleteValidationReport(fileName);
    return result;
};

export const getValidationReport = async (
    fileName: string,
): Promise<ParsedValidationReport | null> => {
    const result = await window.electron.getValidationReport(fileName);
    return result;
};

export const compareValidationReports = async (
    fileNameBase: string,
    fileNameComp: string,
): Promise<ValidationReportCompare | null> => {
    const result = await window.electron.compareValidationReports(
        fileNameBase,
        fileNameComp,
    );
    return result;
};

export const downloadValidationReport = async (
    fileName: string,
    initialFolder?: string,
): Promise<string | false> => {
    const result = await window.electron.downloadValidationReport(
        fileName,
        initialFolder,
    );
    return result;
};
