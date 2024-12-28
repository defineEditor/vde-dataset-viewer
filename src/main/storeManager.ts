import { app, IpcMainInvokeEvent } from 'electron';
import { ILocalStore } from 'interfaces/common';
import path from 'path';
import fs from 'fs';

class StoreManager {
    private storePath: string = '';

    constructor() {
        this.storePath = path.join(app.getPath('userData'), 'store.json');

        // Check if the store file exists
        if (!fs.existsSync(this.storePath)) {
            // Create the store file
            fs.writeFileSync(this.storePath, JSON.stringify({}));
        }
    }

    save = async (_event: IpcMainInvokeEvent, store: ILocalStore) => {
        // Save the store to the store file
        fs.writeFileSync(this.storePath, JSON.stringify(store));
    };

    load = async () => {
        // Load the store from the store file
        return JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
    };
}

export default StoreManager;
