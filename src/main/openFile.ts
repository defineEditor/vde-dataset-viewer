import { dialog } from 'electron';

const openFile = async (
    folderPath?: string,
    filters?: { name: string; extensions: string[] }[],
): Promise<{ path: string } | undefined> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Open Dataset-JSON file',
        defaultPath: folderPath,
        filters: filters || [
            {
                name: 'Datasets',
                extensions: ['json', 'ndjson', 'xpt', 'dsjc', 'sas7bdat'],
            },
            {
                name: 'JSON',
                extensions: ['json'],
            },
            {
                name: 'NDJSON',
                extensions: ['ndjson'],
            },
            {
                name: 'SAS XPORT',
                extensions: ['xpt'],
            },
            {
                name: 'SAS7BDAT',
                extensions: ['sas7bdat'],
            },
            {
                name: 'DSJC',
                extensions: ['dsjc'],
            },
            {
                name: 'All Files',
                extensions: ['*'],
            },
        ],
    });
    if (!canceled) {
        return { path: filePaths[0] };
    }
    return undefined;
};

export default openFile;
