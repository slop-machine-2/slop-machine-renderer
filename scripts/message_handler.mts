import {Job, Worker} from 'bullmq';
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import path from "path";
import {unlink} from "node:fs/promises";
import {OutputConfig} from "../src/types/configManifest";

type VideoRenderingJobData = {
  renderId: string;
  fake: boolean;
  showProgress: boolean;
}

async function startWorker() {
  const s3Endpoint = process.env.S3_HTTP_HOST;
  if (!s3Endpoint) {
    throw new Error('No S3 HTTP Gateway set');
  }

  const entry = "./src/index.ts";
  let bundleLocation = await bundle(path.resolve(entry));
  const worker = new Worker('render-pipeline', async (job: Job<VideoRenderingJobData>) => {
    if (job.name !== 'render-video') {
      throw new Error('Unknown job name: ' + job.name);
    }

    const childrenValues = await job.getChildrenValues();
    const values: VideoRenderingJobData = Object.values(childrenValues)[0];
    console.log('values', values);

    const renderId = values.renderId;
    const fake = values.fake;
    const showProgress = values.showProgress;

    if (fake) {
      console.log('Fake message.. aborting');
      return;
    }

    console.log(`Starting processing for: ${renderId}`);

    try {
      const s3config = Bun.s3.file(`output/${renderId}/config.json`);
      const config: OutputConfig = await s3config.json();
      const inputProps = {
        config,
        renderId,
        s3Endpoint,
      }

      console.log(`Starting render for: ${renderId}`);

      const compositionId = "DynamicShortVideo";
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps,
      });

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

      const tempPath = `/tmp/render-${renderId}-${Date.now()}.mp4`;
      let lastReportedPercentage = 0;
      await renderMedia({
        composition,
        concurrency: +(process.env.REMOTION_CONCURRENCY ?? 4),
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: tempPath,
        // hardwareAcceleration: "required"
        inputProps,
        onProgress: async ({progress, renderEstimatedTime, renderedFrames}) => {
          if (showProgress) {
            const now = new Date();
            const prefix = `[${now.getMinutes()}:${now.getSeconds()}]`;
            console.log(`${prefix} | ${Math.round(progress * 100)}% | ETA: ${formatETA(renderEstimatedTime)} | Frame ${renderedFrames}`);
          }

          const percentage = Math.round(progress * 100);
          if (percentage > lastReportedPercentage) {
            await job.updateProgress(percentage);
            lastReportedPercentage = percentage;
          }
        }
      });

      try {
        const tempFile = Bun.file(tempPath);
        await Bun.s3.write(`output/${renderId}/render.mp4`, tempFile);
      } finally {
        await unlink(tempPath);
      }

      console.log("Render finished!");
    } catch (error) {
      console.error("Failed during asset sync or render:", error);
      throw error; // Ensure the job is marked as failed in Valkey/BullMQ
    }


    return {renderId};
  }, {
    connection: {host: process.env.QUEUE_HOST || 'valkey', port: 6379},
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
}

// @ts-ignore
await startWorker();