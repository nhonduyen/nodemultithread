// https://medium.com/lazy-engineering/node-worker-threads-b57a32d84845
// node --max-old-space-size=8192 index.js
// node --experimental-worker index.js
const Pool = require('worker-threads-pool');

const {
    Worker
} = require('worker_threads');
const path = require('path');
const os = require('os');
const ora = require('ora');

// Get cpu count
const cpuCount = os.cpus().length;
const pool = new Pool({
    max: cpuCount
});
// Generate big array
const elements = 5000000;
console.log(`Generating ${elements} random number`);
const bigArray = Array(elements)
    .fill()
    .map(() => Math.random());

// get path of run file
const workerScript = path.join(__dirname, './sorter.js');

// turn worker activation into promise
const sortArrayWithWorker = arr => {
    try {
        return new Promise((resolve, reject) => {
            pool.acquire(workerScript, {
                workerData: arr
            }, (err, worker) => {
                if (err) {
                    return reject(err);
                }
                worker.on('message', resolve);
                worker.on('error', reject);
            });
        });
    } catch (err) {
        return reject(err);
    }
};
// Distribubte array across worker
async function distributeLoadAcrossWorkers(workers) {
    // how many elements each worker should sort
    const segmentsPerWorker = Math.round(bigArray.length / workers);
    const promises = Array(workers)
        .fill()
        .map((_, index) => {
            let arrayToSort;
            if (index === 0) {
                // the first segment
                arrayToSort = bigArray.slice(0, segmentsPerWorker);
            } else if (index === workers - 1) {
                // the last segment
                arrayToSort = bigArray.slice(segmentsPerWorker * index);
            } else {
                arrayToSort = bigArray.slice(segmentsPerWorker * index, segmentsPerWorker * (index + 1));
            }
            return sortArrayWithWorker(arrayToSort);
        });
    // merge all the segments of the array
    const segmentResult = await Promise.all(promises);
    return segmentResult.reduce((acc, arr) => acc.concat(arr), []);
}

// main function
async function run() {
    const spinner = ora('Loading unicorns').start();
    spinner.color = "yellow";
    spinner.text = "sorting...this may take awhile...";

    // sort with single worker
    const start1 = Date.now();
    const result1 = await distributeLoadAcrossWorkers(1);
    console.log(`sort ${result1.length} items, with 1 worker in ${Date.now() - start1} ms`);

    // sort no worker
    const start2 = Date.now();
    const result2 = bigArray.sort((a, b) => a - b);
    console.log(`sort ${result2.length} items, with no worker in ${Date.now() - start2} ms`);

    // sort with single worker
    const start3 = Date.now();
    const result3 = await distributeLoadAcrossWorkers(cpuCount);
    console.log(`sort ${result3.length} items, with ${cpuCount} worker in ${Date.now() - start3} ms`);

    spinner.stop();
    console.log('Done');
}

run();