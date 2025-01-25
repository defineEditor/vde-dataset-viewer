// eslint-disable-next-line no-promise-executor-return
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('Worker started');

process.parentPort.once('message', async (messageData) => {
    const { data } = messageData;
    const { processId, file } = data;
    console.log('Task received in worker:', file);
    const totalDuration = (1000 * file.size) / (1024 * 1024);

    for (let i = 0; i < totalDuration; i += 1000) {
        console.log('Processing:', i);
        process.parentPort.postMessage({
            id: processId,
            progress: i / totalDuration,
        });
        // eslint-disable-next-line no-await-in-loop
        await sleep(1000);
    }

    process.parentPort.postMessage({
        id: processId,
        progress: 1,
    });
    process.send({ success: true, result: 'task completed' });
});
