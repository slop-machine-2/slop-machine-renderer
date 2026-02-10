import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import {Job, Worker} from 'bullmq';
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

type VideoRenderingJobData = {
  folderPath: string;
  outputName: string;
  config: Record<string, any>;
}

const execPromise = promisify(exec);

const worker = new Worker('video-rendering', async (job: Job<VideoRenderingJobData>) => {
  const folderPath = job.data.folderPath;
  const outputName = job.data.outputName;
  // const config = job.data.config;

  console.log(`Starting asset sync for: ${folderPath}`);

  try {
    // 0. Run the asset copy script before rendering
    const { stdout, stderr } = await execPromise(`npm run copy-assets "${folderPath}"`);
    console.log('Sync Output:', stdout);
    if (stderr) console.warn('Sync Warning:', stderr);

    console.log(`Starting render for: ${folderPath}`);

    const compositionId = "DynamicShortVideo";
    const entry = "./src/index.ts";

    // 1. Bundle the project
    const bundleLocation = await bundle(path.resolve(entry));

    // 2. Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      // inputProps: config,
    });

    // 3. Render to the shared volume
    await renderMedia({
      composition,
      concurrency: 1,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: `/out/${outputName}.mp4`,
      // inputProps: config,
    });

    console.log("Render finished!");
  } catch (error) {
    console.error("Failed during asset sync or render:", error);
    throw error; // Ensure the job is marked as failed in Valkey/BullMQ
  }
}, {
  connection: { host: 'valkey', port: 6379 },
  concurrency: 1
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

worker.on('error', err => {
  console.error('Worker connection error:', err);
});