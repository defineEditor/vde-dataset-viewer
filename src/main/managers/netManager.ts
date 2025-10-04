import { net } from 'electron';
import { IpcMainInvokeEvent } from 'electron/main';
import { IFetchResponse } from 'interfaces/common';

class NetManager {
    async fetch(
        _event: IpcMainInvokeEvent,
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<IFetchResponse> {
        let result: IFetchResponse = {
            status: 0,
            response: {},
            errorMessage: null,
        };
        try {
            const response = await net.fetch(input as Request, init);

            if ([200, 204].includes(response.status)) {
                const data = await response.json();
                result = {
                    status: response.status,
                    response: data,
                    errorMessage: null,
                };
            } else {
                result = {
                    status: response.status,
                    response: {},
                    errorMessage: response.statusText || '',
                };
            }
        } catch (error) {
            if (error instanceof Error) {
                result = {
                    status: 0,
                    response: {},
                    errorMessage: error.message,
                };
            }
        }

        return result;
    }
}

export default NetManager;
