import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import {Job, Worker} from 'bullmq';
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import {unlink} from "node:fs/promises";

type VideoRenderingJobData = {
  renderId: string;
  fake: boolean;
  showProgress: boolean;
}

const execPromise = promisify(exec);

const worker = new Worker('render-service-queue', async (job: Job<VideoRenderingJobData>) => {
  const renderId = job.data.renderId;
  const fake = job.data.fake;
  const showProgress = job.data.showProgress;
  // const outputName = job.data.outputName;
  // const config = job.data.config;

  console.log(`Starting asset sync for: ${renderId}`);

  try {
    // 0. Run the asset copy script before rendering
    const { stdout, stderr } = await execPromise(`bun run copy-assets "${renderId}"`);
    console.log('Sync Output:', stdout);
    if (stderr) console.warn('Sync Warning:', stderr);

    console.log(`Starting render for: ${renderId}`);

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

    if (fake) {
      console.log('Fake message.. aborting');
      return;
    }

    // 3. Render to the shared volume
    const tempPath = `/tmp/render-${Date.now()}.mp4`;
    if (showProgress) {
      const formatETA = (ms: number | null) => {
        if (ms === null) return "Calculating...";

        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(" ");
      };

      await renderMedia({
        composition,
        concurrency: +(process.env.REMOTION_CONCURRENCY ?? 4),
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: tempPath,
        onProgress({ progress, renderEstimatedTime, renderedFrames }) {
          const now = new Date();
          const prefix = `[${now.getMinutes()}:${now.getSeconds()}]`;
          console.log(`${prefix} | ${Math.round(progress * 100)}% | ETA: ${formatETA(renderEstimatedTime)} | Frame ${renderedFrames}`);
        }
      });
    }
    else {
      await renderMedia({
        composition,
        concurrency: +(process.env.REMOTION_CONCURRENCY ?? 4),
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: tempPath,
        // hardwareAcceleration: "required"
        // inputProps: config,
      });
    }

    try {
      const tempFile = Bun.file(tempPath);
      await Bun.s3.write(`output/${renderId}/render.mp4`, tempFile);
    } finally {
      await unlink(tempPath);
    }

    console.log("Render finished!");
    // return {}; // We could return data needed by post
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