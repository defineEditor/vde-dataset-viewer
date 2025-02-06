import { dialog } from 'electron';

const openFile = async (
    folderPath?: string,
): Promise<{ path: string } | undefined> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Open Dataset-JSON file',
        defaultPath: folderPath,
        filters: [
            {
                name: 'JSON Files',
                extensions: ['json', 'ndjson', 'xpt', 'dsjc'],
            },
        ],
    });
    if (!canceled) {
        return { path: filePaths[0] };
    }
    return undefined;
};

export default openFile;
