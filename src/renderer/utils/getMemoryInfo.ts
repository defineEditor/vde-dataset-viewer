import getHumanReadableSize from 'renderer/utils/getHumanReadableSize';

const getMemoryInfo = async (id: string) => {
    // Get main process memory usage info
    const heapInfo = process.getHeapStatistics();
    // Get renderer process memory usage info for each opened window
    const memInfo = await process.getProcessMemoryInfo();
    // Convert heap sizes to human-readable format
    const developerInfo: Record<string, string> = {};
    Object.keys(heapInfo).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(heapInfo, key)) {
            developerInfo[`${id}-${key}`] = getHumanReadableSize(
                heapInfo[key] * 1024,
            );
        }
    });
    Object.keys(memInfo).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(memInfo, key)) {
            if (typeof memInfo[key] === 'number') {
                developerInfo[`${id}-${key}`] = getHumanReadableSize(
                    memInfo[key] * 1024,
                );
            }
        }
    });
    return developerInfo;
};

export default getMemoryInfo;
