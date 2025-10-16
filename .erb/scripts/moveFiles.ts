import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const moveFiles = async () => {
    const releaseRoot = path.normalize('./release');
    const buildRoot = path.normalize('./release/build');
    // Read the version from the package.json
    const packageJson: { version?: string } = JSON.parse(
        await readFile('./release/app/package.json', 'utf-8'),
    );
    const appVersion = packageJson.version || '0.0.0';
    try {
        await mkdir(releaseRoot);
    } catch (err) {
        if (err instanceof Error) {
            const error = { code: '', ...err };
            if (error.code === 'EEXIST') {
                // Folder exists, which is fine
            } else {
                console.error(
                    `Failed creating a folder: ${releaseRoot}. Error: ${
                        error.message
                    }`,
                );
                return;
            }
        }
    }
    const destFolder = path.join(releaseRoot, `Release ${appVersion}`);
    try {
        await mkdir(destFolder);
    } catch (err) {
        if (err instanceof Error) {
            const error = { code: '', ...err };
            if (error.code === 'EEXIST') {
                // Folder exists, which is fine
            } else {
                console.error(
                    `Failed creating a folder: ${destFolder}. Error: ${
                        error.message
                    }`,
                );
                return;
            }
        }
    }

    let files: string[] = [];
    try {
        files = await readdir(buildRoot);
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `Failed reading files: ${buildRoot}. Error: ${error.message}`,
            );
        }
        return;
    }

    await Promise.all(
        files.map(async (fileName) => {
            if (/latest.*.yml/.test(fileName)) {
                await rename(
                    path.join(buildRoot, fileName),
                    path.join(destFolder, fileName),
                );
            }
            if (
                new RegExp(
                    `vde-dataset-viewer(\\.Setup)?[\\. ]${appVersion}.exe$`,
                ).test(fileName)
            ) {
                await rename(
                    path.join(buildRoot, fileName),
                    path.join(destFolder, fileName),
                );
            }
            if (
                new RegExp(
                    `vde-dataset-viewer(\\.Setup)?[\\. ]${appVersion}.exe.blockmap$`,
                ).test(fileName)
            ) {
                await rename(
                    path.join(buildRoot, fileName),
                    path.join(destFolder, fileName),
                );
            }
            if (
                new RegExp(`vde-dataset-viewer\\.${appVersion}.AppImage$`).test(
                    fileName,
                )
            ) {
                await rename(
                    path.join(buildRoot, fileName),
                    path.join(destFolder, fileName),
                );
            }
            if (
                new RegExp(`vde-dataset-viewer_${appVersion}_amd64.deb$`).test(
                    fileName,
                )
            ) {
                await rename(
                    path.join(buildRoot, fileName),
                    path.join(
                        destFolder,
                        `vde-dataset-viewer.${appVersion}.deb`,
                    ),
                );
                // Update latest-linux.yml file to point to the .deb file
                const latestLinuxYmlPath = path.join(
                    destFolder,
                    'latest-linux.yml',
                );

                try {
                    const latestLinuxYml = await readFile(
                        latestLinuxYmlPath,
                        'utf-8',
                    );
                    const updatedYml = latestLinuxYml.replace(
                        /vde-dataset-viewer_.*_amd64.deb/,
                        `vde-dataset-viewer.${appVersion}.deb`,
                    );
                    await fs.promises.writeFile(
                        latestLinuxYmlPath,
                        updatedYml,
                        'utf-8',
                    );
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(
                            `Failed updating file: ${latestLinuxYmlPath}. Error: ${error.message}`,
                        );
                    }
                    return;
                }
            }
        }),
    );
};

moveFiles();
