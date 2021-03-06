const {
    parentPort,
    workerData,
    isMainThread
} = require('worker_threads');

function sortBigArray(bigArray) {
    return bigArray.sort((a, b) => a - b);
}

// check that the sorter was called as a worker thread
if (!isMainThread) {
    // make sure we got an array of data
    if (!Array.isArray(workerData)) {
        // we can throw an error to emit the "error" event from the worker
        throw new Error('wokerData must be an array of number');
    }
    // we post a message through the parent port, to emit the "message" event
    parentPort.postMessage(sortBigArray(workerData));
}