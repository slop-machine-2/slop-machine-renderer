import { cp, readdir, stat, rm, mkdir, readFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { exit, argv } from 'node:process';

async function copyAssets() {
  const outputBaseDir = '/output';
  const destinationPath = join('/app', 'public');
  const personaDest = join(destinationPath, 'persona');

  // Check if a specific path was provided as a CLI argument
  const manualPath = argv[2];
  let sourcePath;

  try {
    if (manualPath) {
      // Use the provided argument (handle relative or absolute)
      sourcePath = isAbsolute(manualPath) ? manualPath : join(process.cwd(), manualPath);
      console.log(`🎯 Using manually specified path: ${sourcePath}`);
    } else {
      // 1. Detect the latest folder (Original Logic)
      const entries = await readdir(outputBaseDir);
      const folders = [];

      for (const entry of entries) {
        const fullPath = join(outputBaseDir, entry);
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          folders.push(entry);
        }
      }

      folders.sort();
      const latestFolder = folders.at(-1);

      if (!latestFolder) {
        console.error(`❌ Error: No folders found in ${outputBaseDir}`);
        exit(1);
      }

      sourcePath = join(outputBaseDir, latestFolder);
      console.log(`📂 Latest folder detected: ${latestFolder}`);
    }

    // Verify the sourcePath exists before continuing
    await stat(sourcePath);

    const configPath = join(sourcePath, 'config.json');
    const configData = JSON.parse(await readFile(configPath, 'utf-8'));

    const { personaName, theme } = configData.persona;

    if (!personaName || !theme) {
      throw new Error("Missing 'personaName' or 'theme' inside config.json persona key.");
    }

    // 2. Clean and setup destination
    console.log(`🧹 Cleaning destination: ${destinationPath}...`);
    await rm(destinationPath, { recursive: true, force: true });
    await mkdir(destinationPath, { recursive: true });

    // 3. Perform the main copy
    console.log(`🚚 Copying assets from ${sourcePath} to ${destinationPath}...`);
    await cp(sourcePath, destinationPath, { recursive: true, force: true });

    // 4. Copy persona assets dynamically
    const personaSource = `/assets/personae/${personaName}`;
    console.log(`👤 Injecting persona [${personaName}] into ${personaDest}...`);
    await mkdir(personaDest, { recursive: true });
    await cp(personaSource, personaDest, { recursive: true, force: true });

    // 5. Copy a random satisfying video
    const videoFile = configData.satisfyingVideo;
    const videoDest = join(destinationPath, 'satisfying.webm');
    console.log(`🎥 Copying video: ${videoFile} -> satisfying.webm`);
    await cp(videoFile, videoDest, { force: true });

    // 6. Copy the theme audio
    const audioSource = `/assets/themes/${theme}.ogg`;
    const audioDest = join(destinationPath, 'theme.ogg');
    console.log(`🎵 Copying theme: ${theme}.ogg...`);
    await cp(audioSource, audioDest, { force: true });

    console.log('✅ Pipeline complete: Persona, Theme, and Background Video synced.');
  } catch (err) {
    console.error('❌ Failed to copy assets:', err instanceof Error ? err.message : err);
    exit(1);
  }
}

copyAssets();