import getFolderName from 'renderer/utils/getFolderName';

describe('getFolderName', () => {
    it('should return the correct folder path for Windows', () => {
        const originalPlatform =
            typeof process !== 'undefined' ? process.platform : undefined;
        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: 'win32',
            });
        }

        const filePath = 'C:\\Users\\User\\Docu/ments\\file.txt';
        const expected = 'C:\\Users\\User\\Docu/ments';
        expect(getFolderName(filePath)).toBe(expected);

        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
        }
    });

    it('should return the correct folder path for Linux', () => {
        const originalPlatform =
            typeof process !== 'undefined' ? process.platform : undefined;
        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: 'linux',
            });
        }

        const filePath = '/home/user/docum\\ents/file.txt';
        const expected = '/home/user/docum\\ents';
        expect(getFolderName(filePath)).toBe(expected);

        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
        }
    });

    it('should return the correct folder path for macOS', () => {
        const originalPlatform =
            typeof process !== 'undefined' ? process.platform : undefined;
        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: 'darwin',
            });
        }

        const filePath = '/Users/user/documents/file.txt';
        const expected = '/Users/user/documents';
        expect(getFolderName(filePath)).toBe(expected);

        if (typeof process !== 'undefined') {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
        }
    });
});
