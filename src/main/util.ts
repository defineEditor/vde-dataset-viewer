/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import { clipboard } from 'electron';
import path from 'path';

const resolveHtmlPath = (htmlFileName: string) => {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

const writeToClipboard = (_event: Electron.IpcMainInvokeEvent, text: string) => {
    clipboard.writeText(text);
    return true;
}

export { writeToClipboard, resolveHtmlPath };
