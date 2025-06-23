import {
    ValidatorProcessTask,
    ValidateSubTask,
    ValidatorTaskProgress,
} from 'interfaces/common';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
 * Validates datasets using CDISC CORE command line tool
 * @param validatorPath Path to the Core CLI executable
 * @param configuration Validation configuration
 * @param validationDetails Files and folders to validate
 * @param sendMessage Progress callback function
 * @returns Promise that resolves to the validation report filename
 */
const runValidation = async (
    validatorPath: string,
    configuration: ValidatorProcessTask['configuration'],
    validationDetails: ValidatorProcessTask['validationDetails'],
    outputDir: string,
    sendMessage: (progress: number) => void,
): Promise<string> => {
    // Build command arguments
    const args: string[] = ['validate'];

    // Add files to validate
    if (validationDetails?.files && validationDetails.files.length > 0) {
        validationDetails.files.forEach((file: string) => {
            args.push('--dataset-path', `"${file}"`);
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

    // Add define version if provided
    if (configuration?.defineVersion) {
        args.push('--define-version', configuration.defineVersion);
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

    // Enable verbose progress output
    args.push('--progress', 'percents');

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
    if (validationDetails?.files && validationDetails.files.length > 0) {
        const firstFile = validationDetails.files[0];
        baseFileName = path.parse(firstFile).name;
    }

    const outputFileName = `${baseFileName}-${timestamp}-core-validation.json`;

    // Use system temporary directory
    const outputPath = path.join(outputDir, outputFileName);

    // Add output parameter
    args.push('--output', `"${outputPath}"`);

    // Output in JSON format
    args.push('--output-format', 'JSON');

    // Build the full command
    const command = `"${validatorPath}" ${args.join(' ')}`;

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
                progressMatch = output.match(/(\d+)/);
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
        }

        // Handle process completion
        childProcess.on('close', (code) => {
            if (code === 0) {
                // Validation completed successfully
                resolve(outputFileName);
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

process.parentPort.once(
    'message',
    async (messageData: {
        data: ValidatorProcessTask;
    }): Promise<ValidatorTaskProgress> => {
        const { data } = messageData;
        const { id, options } = data;
        // Use id as the task type since it aligns with ValidateSubTask values
        let task = '';
        if (id.startsWith('validator-')) {
            // Remove 'validator-' prefix to get the actual task type
            task = id.replace('validator-', '');
        }
        // Check if the task is valid
        const validTasks: ValidateSubTask[] = ['validate', 'getInfo'];
        if (!validTasks.includes(task as ValidateSubTask)) {
            process.parentPort.postMessage({
                id: `${data.type}-${id}`,
                error: `Invalid task type: ${task}. Valid tasks are: ${validTasks.join(
                    ', ',
                )}`,
                progress: 100,
            });
            process.exit(1);
        }
        const { validatorPath } = options;
        const processId = `${data.type}-${id}`;

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
                        const result = await runValidation(
                            validatorPath,
                            data.configuration,
                            data.validationDetails,
                            data.outputDir || '',
                            sendMessage,
                        );
                        process.parentPort.postMessage({
                            id: processId,
                            result,
                            progress: 100,
                        });
                    } catch (error) {
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
