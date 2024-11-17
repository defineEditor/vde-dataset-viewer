import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import JSONStream from 'JSONStream';

const getMetadata = async (path: string): Promise<string> => {
    const stream = fs.createReadStream(path, { encoding: 'utf8' });
    let result = '';
    stream
        .pipe(JSONStream.parse(['.*ItemGroupData.*', true, 'name']))
        .on('data', (data: string) => {
            result = data;
        });

    return result;
};

export default getMetadata;
