import { ValidatorProcessTask, ValidateSubTask } from 'interfaces/main';
import fs from 'fs';
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
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return false;
        }

        // Get file stats
        const stats = fs.statSync(filePath);

        // Check if it's a file and has executable permissions
        // 0o111 represents executable permissions (--x--x--x)
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
const getStandards = async (
    validatorPath: string,
): Promise<{ standard: string; version: string }[]> => {
    // Run the Core CLI with the list-rule-sets command
    const { stdout, stderr } = await execAsync(
        `"${validatorPath}" list-rule-sets`,
    );

    if (stderr) {
        throw new Error(`Error getting standards: ${stderr}`);
    }

    // Parse the output to extract standards
    // Output format may vary, adjust parsing as needed based on actual output
    const standards: { standard: string; version: string }[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Extract standard/version format (e.g., "sdtmig/3-4")
        standards.push({
            standard: trimmedLine.split(',')[0],
            version: trimmedLine.split(',')[1],
        });
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
        terminologies.push(line.trim());
    }

    return terminologies;
};

process.parentPort.once(
    'message',
    async (messageData: { data: ValidatorProcessTask }) => {
        const { data } = messageData;
        const { id, options } = data;
        // Use id as the task type since it aligns with ValidateSubTask values
        const task = id as ValidateSubTask;
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

        try {
            sendMessage(10);

            // Execute different commands based on the task
            let result:
                | string
                | { standard: string; version: string }[]
                | string[];
            switch (task) {
                case 'getVersion':
                    result = await getVersion(validatorPath);
                    process.parentPort.postMessage({
                        id: processId,
                        result,
                        progress: 100,
                    });
                    break;

                case 'getStandards':
                    result = await getStandards(validatorPath);
                    process.parentPort.postMessage({
                        id: processId,
                        result,
                        progress: 100,
                    });
                    break;

                case 'getTerminology':
                    result = await getControlledTerminology(validatorPath);
                    process.parentPort.postMessage({
                        id: processId,
                        result,
                        progress: 100,
                    });
                    break;

                case 'validate':
                    // Implementation for validation would go here
                    // This would need to process configuration and other options
                    process.parentPort.postMessage({
                        id: processId,
                        error: 'Validation not implemented yet',
                        progress: 100,
                    });
                    break;

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
