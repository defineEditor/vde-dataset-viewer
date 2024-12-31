import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { ICheckUpdateResult, UpdateCheckResult } from 'interfaces/main';

const appVersion = app.getVersion();

const checkForUpdates = async (): Promise<ICheckUpdateResult> => {
    let result: UpdateCheckResult | null = null;
    if (process.env.NODE_ENV !== 'development') {
        result = await autoUpdater.checkForUpdates();
    }

    if (result === null) {
        return { newUpdated: false, errorMessage: "Could not get updates" };
    }

    if (typeof result === 'object' && result.updateInfo) {
        const newVersion = result.updateInfo.version.replace(
            /\b(\d)\b/g,
            '0$1',
        );
        const currentVersion = appVersion.replace(/\b(\d)\b/g, '0$1');

        if (
            newVersion > currentVersion &&
            !(
                currentVersion.includes('current') &&
                !newVersion.includes('current')
            )
        ) {
            return { update: result.updateInfo, newUpdated: true };
        }
        return { update: result.updateInfo, newUpdated: false };
    }
    return { newUpdated: false };
};

const downloadUpdate = async (mainWindow) => {
    const sendToRender = (data) => {
        mainWindow.webContents.send('updateDownloadProgress', data);
    };

    autoUpdater.on('download-progress', (progressObj) => {
        sendToRender(progressObj);
    });

    autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall();
    });

    try {
        await autoUpdater.checkForUpdates();
        const result = await autoUpdater.downloadUpdate();

        if (result) {
            mainWindow.webContents.send('updateDownloaded', true, result);
        }
    } catch (error) {
        if (error instanceof Error) {
            dialog.showErrorBox('Update Error', error.message);
        } else {
            dialog.showErrorBox('Update Error', 'An unknown error occurred');
        }
    }
};

export { checkForUpdates, downloadUpdate };
