import {
    dialog,
    BrowserWindow,
    OpenDialogOptions,
    OpenDialogReturnValue,
} from 'electron';

// Show a dialog attached to the given window when possible. BrowserWindow
// can be null when the sender is not backed by a window, in which case the
// dialog is shown without a parent instead of passing null to Electron.
export const showOpenDialog = (
    window: BrowserWindow | null | undefined,
    options: OpenDialogOptions,
): Promise<OpenDialogReturnValue> =>
    window
        ? dialog.showOpenDialog(window, options)
        : dialog.showOpenDialog(options);

const openFile = async (
    window: BrowserWindow | null | undefined,
    folderPath?: string,
    filters?: { name: string; extensions: string[] }[],
): Promise<{ path: string } | undefined> => {
    const { canceled, filePaths } = await showOpenDialog(window, {
        title: 'Open Dataset-JSON file',
        defaultPath: folderPath,
        filters: filters || [
            {
                name: 'Datasets',
                extensions: [
                    'json',
                    'ndjson',
                    'xpt',
                    'dsjc',
                    'sas7bdat',
                    'sav',
                    'dta',
                    'zsav',
                    'por',
                ],
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
                name: 'SPSS',
                extensions: ['sav', 'zsav', 'por'],
            },
            {
                name: 'Stata',
                extensions: ['dta'],
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
