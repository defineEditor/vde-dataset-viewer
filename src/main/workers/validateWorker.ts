import {
    ValidatorProcessTask,
    ValidateSubTask,
    ValidatorTaskProgress,
    ValidationRunReport,
    IssueSummaryItem,
} from 'interfaces/common';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import zlib from 'zlib';

const execAsync = promisify(exec);
const gzipPromise = promisify(zlib.gzip);
const unzipPromise = promisify(zlib.unzip);

/**
 * Checks if a file is executable
 * @param filePath Path to the file
 * @returns True if the file is executable, false otherwise
 */
const isExecutable = (filePath: string): boolean => {
    try {
        if (!fs.existsSync(filePath)) {
            return false;
        }

        const stats = fs.statSync(filePath);

        // Windows executables are typically .exe, .bat, .cmd files
        if (process.platform === 'win32') {
            const ext = path.extname(filePath).toLowerCase();
            return stats.isFile() && ['.exe', '.bat', '.cmd'].includes(ext);
        }

        // Unix systems (macOS, Linux) - check for executable permissions
        // eslint-disable-next-line no-bitwise
        return stats.isFile() && Boolean(stats.mode & 0o111);
    } catch (error) {
        return false;
    }
};

/**
 * Gets the version of the CDISC Core CLI
 * @param validatorPath Path to the Core CLI executable
 * @returns Promise that resolves to the version string
 */
const getVersion = async (validatorPath: string): Promise<string> => {
    try {
        // Run the Core CLI with the --version flag
        const { stdout, stderr } = await execAsync(
            `"${validatorPath}" version`,
        );

        if (stderr) {
            return '';
        }

        return stdout.trim();
    } catch (error) {
        return '';
    }
};

/**
 * Gets all available standards from the CDISC Core CLI
 * @param validatorPath Path to the Core CLI executable
 * @returns Promise that resolves to an array of standards
 */
const getStandards = async (validatorPath: string): Promise<string[]> => {
    // Run the Core CLI with the list-rule-sets command
    const { stdout, stderr } = await execAsync(
        `"${validatorPath}" list-rule-sets`,
    );

    if (stderr) {
        throw new Error(`Error getting standards: ${stderr}`);
    }

    // Parse the output to extract standards
    // Output format may vary, adjust parsing as needed based on actual output
    const standards: string[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
        if (line.trim() !== '') {
            standards.push(line.trim());
        }
    }

    return standards;
};

/**
 * Gets all available controlled terminology from the CDISC Core CLI
 * @param validatorPath Path to the Core CLI executable
 * @returns Promise that resolves to an array of controlled terminologies
 */
const getControlledTerminology = async (
    validatorPath: string,
): Promise<string[]> => {
    // Run the Core CLI with the list-ct command
    const { stdout, stderr } = await execAsync(`"${validatorPath}" list-ct`);

    if (stderr) {
        throw new Error(`Error getting controlled terminology: ${stderr}`);
    }

    // Parse the output to extract controlled terminology packages
    // Output format may vary, adjust parsing as needed based on actual output
    const terminologies: string[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
        if (line.trim() !== '') {
            terminologies.push(line.trim());
        }
    }

    return terminologies;
};

/**
 * Cleanup temporary folder after the validation
 * @param validationDetails Files and folders to validate
 */
const cleanTemporaryFiles = async (
    validationDetails: ValidatorProcessTask['validationDetails'],
): Promise<boolean> => {
    const filesToDelete: string[] = [];
    // Identify temporary files
    if (validationDetails?.files && validationDetails.files.length > 0) {
        validationDetails.files
            .filter((file: string) => file.startsWith('__TEMP__'))
            .forEach((file: string) => {
                filesToDelete.push(
                    file.replace(
                        '__TEMP__',
                        path.join(tmpdir(), 'vde-convert'),
                    ),
                );
            });
    }

    // Delete temporary files
    if (filesToDelete.length > 0) {
        let failedToDelete = false;
        for (const file of filesToDelete) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            } catch (error) {
                // Log error but continue
                console.error(
                    `Validate Worker: Error deleting temporary file ${file}: ${
                        (error as Error).message
                    }`,
                );
                failedToDelete = true;
            }
        }
        return !failedToDelete;
    } else {
        // No temporary files to delete
        return true;
    }
};

/**
 * Generates the command to run CDISC CORE validation
 * @param validatorPath Path to the Core CLI executable
 * @param configuration Validation configuration
 * @param options Validator options
 * @param validationDetails Files and folders to validate
 * @param outputPath Output path for the validation report
 * @returns The command string to execute
 */
const generateValidationCommand = (
    validatorPath: string,
    configuration: ValidatorProcessTask['configuration'],
    options: ValidatorProcessTask['options'],
    validationDetails: ValidatorProcessTask['validationDetails'],
    outputPath: string,
): string => {
    // Build command arguments
    const args: string[] = ['validate'];

    // Add files to validate
    if (validationDetails?.files && validationDetails.files.length > 0) {
        validationDetails.files.forEach((file: string) => {
            // Check if any paths contain __TEMP__ in the path name as a folder, replace it with the system temp directory
            if (file.startsWith('__TEMP__')) {
                args.push(
                    '--dataset-path',
                    file.replace(
                        '__TEMP__',
                        path.join(tmpdir(), 'vde-convert'),
                    ),
                );
            } else {
                args.push('--dataset-path', `"${file}"`);
            }
        });
    }

    // Add folders to validate
    if (validationDetails?.folders && validationDetails.folders.length > 0) {
        validationDetails.folders.forEach((folder: string) => {
            args.push('--data', `"${folder}"`);
        });
    }

    // Add standard and version if provided
    if (configuration?.standard && configuration?.version) {
        args.push('--standard', configuration.standard);
        args.push('--version', configuration.version);
    }

    // Add path to Define-XML if provided
    if (configuration?.defineXmlPath) {
        args.push('--define-xml-path', `"${configuration.defineXmlPath}"`);
    }

    // Add define version if provided
    if (configuration?.defineVersion) {
        args.push('--define-version', configuration.defineVersion);
    }

    // Validate XML flag
    if (configuration?.validateXml) {
        args.push('--validate-xml', 'y');
    }

    // Specify CT packages if provided
    if (configuration?.ctPackages && configuration.ctPackages.length > 0) {
        configuration.ctPackages.forEach((ct) => {
            args.push('-ct', ct);
        });
    }

    // Add dictionary paths if provided
    if (configuration?.whodrugPath) {
        args.push('--whodrug', `"${configuration.whodrugPath}"`);
    }
    if (configuration?.meddraPath) {
        args.push('--meddra', `"${configuration.meddraPath}"`);
    }
    if (configuration?.loincPath) {
        args.push('--loinc', `"${configuration.loincPath}"`);
    }
    if (configuration?.medrtPath) {
        args.push('--medrt', `"${configuration.medrtPath}"`);
    }
    if (configuration?.uniiPath) {
        args.push('--unii', `"${configuration.uniiPath}"`);
    }

    // Add SNOMED configuration if provided
    if (configuration?.snomedVersion) {
        args.push('--snomed-version', configuration.snomedVersion);
    }
    if (configuration?.snomedUrl) {
        args.push('--snomed-url', `"${configuration.snomedUrl}"`);
    }
    if (configuration?.snomedEdition) {
        args.push('--snomed-edition', configuration.snomedEdition);
    }

    // Cache
    if (options?.cachePath) {
        args.push('--cache', `"${options.cachePath}"`);
    }
    // Custom standard flag
    if (configuration?.customStandard) {
        args.push('--custom_standard');
    }

    // Local rules
    if (options?.localRulesPath) {
        args.push('--local_rules', `"${options.localRulesPath}"`);
    }

    // Specify pool size
    if (options?.poolSize && options.poolSize > 0) {
        args.push('--pool-size', options.poolSize.toString());
    }

    // Enable verbose progress output
    args.push('--progress', 'percents');

    // Add output parameter
    args.push('--output', `"${outputPath}"`);

    // Output in both JSON and XLSX formats (XLSX to it can be saved by a user)
    args.push('--output-format', 'JSON');
    args.push('--output-format', 'XLSX');

    // Build the full command
    return `"${validatorPath}" ${args.join(' ')}`;
};

/**
 * Validates datasets using CDISC CORE command line tool
 * @param command The command to execute
 * @param validatorPath Path to the Core CLI executable (for cwd)
 * @param outputPath Path to the output file (for logging)
 * @param sendMessage Progress callback function
 * @returns Promise that resolves to the validation report filename
 */
const runValidation = async (
    command: string,
    validatorPath: string,
    outputPath: string,
    sendMessage: (progress: number) => void,
): Promise<{ fileName: string; date: number; logFileName: string | null }> => {
    const now = new Date();

    return new Promise((resolve, reject) => {
        const childProcess = exec(command, {
            cwd: path.dirname(validatorPath),
        });

        let progressMatch: RegExpMatchArray | null;

        // Handle stdout for progress tracking
        if (childProcess.stdout) {
            childProcess.stdout.on('data', (data: string) => {
                const output = data.toString();

                // Parse progress from verbose output
                // Look for progress indicators in the CDISC Core output
                progressMatch = output.trim().match(/^(\d+)$/);
                if (output.startsWith('Output:')) {
                    // Validation finished, send final progress
                    sendMessage(99);
                } else if (progressMatch) {
                    const progress = parseInt(progressMatch[1], 10);
                    if (progress >= 99) {
                        // We do not want to report 100 here
                        sendMessage(99);
                    } else if (progress > 0) {
                        sendMessage(progress);
                    }
                }
            });
            if (childProcess.stderr) {
                childProcess.stderr.on('data', (data: string) => {
                    const output = data.toString();

                    // Log command if file is not yet created
                    if (!fs.existsSync(`${outputPath}.log`)) {
                        fs.writeFileSync(
                            path.join(`${outputPath}.log`),
                            `Log file for validation run on ${now.toISOString()}\n\n`,
                        );
                        fs.appendFileSync(
                            path.join(`${outputPath}.log`),
                            `CLI command:\n${command}\nError Messages:\n`,
                        );
                    }
                    // Log stdout errors to file
                    fs.appendFileSync(
                        path.join(`${outputPath}.log`),
                        `${output}\n`,
                    );
                });
            }
        }

        // Handle process completion
        childProcess.on('close', async (code) => {
            if (code === 0) {
                // Validation completed successfully
                const outputFileName = path.basename(outputPath);
                // Gzip the JSON report to save space
                try {
                    if (fs.existsSync(`${outputPath}.json`)) {
                        const fileContents = await fsPromises.readFile(
                            `${outputPath}.json`,
                        );
                        const gzipped = await gzipPromise(fileContents);
                        await fsPromises.writeFile(
                            `${outputPath}.json.gz`,
                            gzipped,
                        );
                        // Remove the original JSON file
                        fs.unlinkSync(`${outputPath}.json`);
                        // Check if log file exists
                        let logFileName: string | null = null;
                        if (fs.existsSync(`${outputPath}.log`)) {
                            logFileName = `${outputFileName}.log`;
                        }
                        resolve({
                            fileName: `${outputFileName}.json.gz`,
                            date: now.getTime(),
                            logFileName,
                        });
                    }
                    reject(new Error('Report file not created'));
                } catch (error) {}
            } else {
                reject(
                    new Error(
                        `CDISC Core validation failed with exit code ${code}`,
                    ),
                );
            }
        });

        // Handle process errors
        childProcess.on('error', (error) => {
            reject(
                new Error(
                    `Failed to start CDISC Core validation: ${error.message}`,
                ),
            );
        });
    });
};

const getLastModified = (
    files: string[],
): { file: string; lastModified: number }[] => {
    const lastModified: { file: string; lastModified: number }[] = [];
    for (const file of files) {
        try {
            const stats = fs.statSync(file);
            lastModified.push({
                file,
                lastModified: stats.mtime.getTime(),
            });
        } catch (error) {
            throw new Error(
                `Error getting last modified for ${file}: ${(error as Error).message}`,
            );
        }
    }
    return lastModified;
};

/**
 * Reads a validation report JSON file and returns the count of unique issues
 * and the total number of issues (sum of "issues" attribute for each unique issue).
 * @param filePath Path to the validation report JSON file
 */
export async function getIssueSummary(filePath: string): Promise<{
    uniqueIssues: number;
    totalIssues: number;
}> {
    const rawCompressed = await fsPromises.readFile(filePath);
    const raw = await unzipPromise(rawCompressed);
    const report = JSON.parse(raw.toString('utf-8'));
    const summary: IssueSummaryItem[] = report.Issue_Summary || [];
    const uniqueIssues = summary.length;
    const totalIssues = summary.reduce(
        (acc, item) =>
            acc + (typeof item.issues === 'number' ? item.issues : 0),
        0,
    );

    return {
        uniqueIssues,
        totalIssues,
    };
}

process.parentPort.once(
    'message',
    async (messageData: {
        data: ValidatorProcessTask;
    }): Promise<ValidatorTaskProgress> => {
        const { data } = messageData;
        const { id, options } = data;
        // Use id as the task type since it aligns with ValidateSubTask values
        let task = '';
        if (id.startsWith('get-validator-info')) {
            task = 'getInfo';
        } else {
            task = 'validate';
        }
        // Check if the task is valid
        const validTasks: ValidateSubTask[] = ['validate', 'getInfo'];
        if (!validTasks.includes(task as ValidateSubTask)) {
            process.parentPort.postMessage({
                id: `${id}`,
                error: `Invalid task type: ${task}. Valid tasks are: ${validTasks.join(
                    ', ',
                )}`,
                progress: 100,
            });
            process.exit(1);
        }
        const { validatorPath } = options;
        const processId = `${id}`;

        const sendMessage = (progress: number) => {
            process.parentPort.postMessage({
                id: processId,
                progress,
            });
        };

        // Check if the validator executable exists and is executable
        if (!fs.existsSync(validatorPath)) {
            process.parentPort.postMessage({
                id: processId,
                error: `Validator executable not found at path: ${validatorPath}`,
                progress: 100,
            });
            process.exit(1);
        }

        if (!isExecutable(validatorPath)) {
            process.parentPort.postMessage({
                id: processId,
                error: `File at ${validatorPath} is not executable. Please check permissions.`,
                progress: 100,
            });
            process.exit(1);
        }

        // Get folder of the validator executable
        const validatorFolder = path.dirname(validatorPath);

        // Change current working directory to the validator folder
        process.chdir(validatorFolder);

        try {
            // Execute different commands based on the task
            switch (task) {
                case 'getInfo': {
                    const version = await getVersion(validatorPath);
                    const standards = await getStandards(validatorPath);
                    const terminology =
                        await getControlledTerminology(validatorPath);
                    process.parentPort.postMessage({
                        id: processId,
                        result: {
                            version,
                            standards,
                            terminology,
                        },
                        progress: 100,
                    });
                    break;
                }
                case 'validate': {
                    try {
                        if (!data.configuration) {
                            throw new Error(
                                'Validation configuration is required.',
                            );
                        }

                        // Generate output filename and path
                        const outputDir = data.outputDir || '';

                        // If the output directory does not exist, create it
                        if (!fs.existsSync(outputDir)) {
                            fs.mkdirSync(outputDir, { recursive: true });
                        }

                        // Generate output filename with current datetime
                        const now = new Date();
                        const timestamp = now
                            .toISOString()
                            .replace(/[:.]/g, '-')
                            .replace('T', '_')
                            .substring(0, 19);

                        // Get filename from the first file in validation details or use 'validation'
                        let baseFileName = 'validation';
                        if (
                            data.validationDetails?.files &&
                            data.validationDetails.files.length > 0
                        ) {
                            // Take the first file's name as base
                            // If there are more than 5 files, use the first 5 file names
                            const fileNames = data.validationDetails.files
                                .slice(0, 5)
                                .map(
                                    (file) => path.basename(file).split('.')[0],
                                );
                            const totalCount =
                                data.validationDetails.files.length;
                            baseFileName = path.parse(
                                fileNames.join('_') +
                                    (totalCount > 5
                                        ? `+${totalCount - 5}_datasets`
                                        : ''),
                            ).name;
                        }

                        const outputFileName = `${baseFileName}-${timestamp}-core-validation`;
                        const outputPath = path.join(outputDir, outputFileName);

                        // Generate the validation command
                        const command = generateValidationCommand(
                            validatorPath,
                            data.configuration,
                            data.options,
                            data.validationDetails,
                            outputPath,
                        );

                        const result = await runValidation(
                            command,
                            validatorPath,
                            outputPath,
                            sendMessage,
                        );

                        // Delete temporary files (files coverted for validation)
                        cleanTemporaryFiles(data.validationDetails);

                        const summary = await getIssueSummary(
                            path.join(outputDir, result.fileName),
                        );

                        // Form validate report record
                        const runReport: ValidationRunReport = {
                            id: result.fileName,
                            date: result.date,
                            command,
                            files: getLastModified(
                                data.validationDetails?.originalFiles || [],
                            ),
                            output: result.fileName,
                            logFileName: result.logFileName,
                            config: data.configuration,
                            summary,
                        };
                        process.parentPort.postMessage({
                            id: processId,
                            result: runReport,
                            progress: 100,
                        });
                    } catch (error) {
                        // Delete temporary files (files coverted for validation)
                        cleanTemporaryFiles(data.validationDetails);
                        if (error instanceof Error) {
                            process.parentPort.postMessage({
                                id: processId,
                                error: `Validation failed: ${error.message}`,
                                progress: 100,
                            });
                        }
                    }
                    break;
                }
                default:
                    process.parentPort.postMessage({
                        id: processId,
                        error: `Unknown task: ${task}`,
                        progress: 100,
                    });
            }
        } catch (error) {
            if (error instanceof Error) {
                process.parentPort.postMessage({
                    id: processId,
                    error: `Error executing task: ${error.message || error}`,
                    progress: 100,
                });
            }
            process.exit(1);
        }

        process.exit(0);
    },
);
