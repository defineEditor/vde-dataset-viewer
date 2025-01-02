import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { ICheckUpdateResult, UpdateCheckResult } from 'interfaces/main';

const appVersion = app.getVersion();

const checkForUpdates = async (): Promise<ICheckUpdateResult> => {
    let result: UpdateCheckResult | null = null;
    if (process.env.NODE_ENV !== 'development') {
        result = await autoUpdater.checkForUpdates();
    } else {
        const devResult = {
            tag: '0.1.0',
            version: '0.1.0',
            files: [
                {
                    url: 'vde-dataset-viewer.0.1.0.AppImage',
                    sha512: 'jeBmRP2PJY+iapJ2x31dJ4BjT7rArQNdMGFUH/Np4DR48Vzt+7DLxj4RXpbk+Tp3XDvoe+33h2RNhjNDSBYnMQ==',
                    size: 111446761,
                    blockMapSize: 117501,
                },
                {
                    url: 'vde-dataset-viewer_0.1.0_amd64.deb',
                    sha512: '+pGW+7SA0ooZMCyU911PZOTU6IfWCo5mcHE4RC3tvh2jJVDjLjHKV0rQuE5SOrlDSb4WXowWngh9jhpOZw98HA==',
                    size: 78175738,
                },
            ],
            path: 'vde-dataset-viewer.0.1.0.AppImage',
            sha512: 'jeBmRP2PJY+iapJ2x31dJ4BjT7rArQNdMGFUH/Np4DR48Vzt+7DLxj4RXpbk+Tp3XDvoe+33h2RNhjNDSBYnMQ==',
            releaseDate: '2024-12-31T18:48:59.556Z',
            releaseName:
                '0.1.0: Merge pull request #7 from DmitryMK/feature/shortcuts',
            releaseNotes:
                '<h3>Initial Release</h3>\n<p>Version: 0.1.0</p>\n<h3>Updates</h3>\n<ul>\n<li>New release</li>\n</ul>',
        };
        return { update: devResult, newUpdated: true };
    }

    if (result === null) {
        return { newUpdated: false, errorMessage: 'Could not get updates' };
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

const downloadUpdate = async (): Promise<boolean> => {
    try {
        await autoUpdater.checkForUpdates();
        const result = await autoUpdater.downloadUpdate();

        if (result) {
            return true;
        }
    } catch (error) {
        if (error instanceof Error) {
            dialog.showErrorBox('Update Error', error.message);
        } else {
            dialog.showErrorBox('Update Error', 'An unknown error occurred');
        }
    }
    return false;
};

export { checkForUpdates, downloadUpdate };
