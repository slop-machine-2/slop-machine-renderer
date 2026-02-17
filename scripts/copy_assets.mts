import { rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { exit, argv } from 'node:process';
import {OutputConfig} from "../src/types/configManifest";

async function copyS3FolderToLocal(sourcePath: string, destinationPath: string) {
  console.log(`🚚 Copying assets from ${sourcePath} to ${destinationPath}...`);
  const s3Objects = await Bun.s3.list({ prefix: sourcePath });
  if (!s3Objects.contents) {
    throw new Error('Source path not found or empty: ' + sourcePath)
  }

  for await (const object of s3Objects.contents) {
    const relativePath = object.key.slice(sourcePath.length);
    if (!relativePath) continue;
    const localFilePath = join(destinationPath, relativePath);
    await mkdir(dirname(localFilePath), { recursive: true });
    const s3File = Bun.s3.file(object.key);
    await Bun.write(localFilePath, s3File);
    console.log(`  ✓ Copied: ${relativePath}`);
  }
}

async function copyAssets() {
  const destinationPath = join('/app', 'public');
  const personaDest = join(destinationPath, 'persona');

  // Check if a specific path was provided as a CLI argument
  const manualPath = argv[2];

  if (!manualPath) {
    throw new Error('No path given');
  }

  console.log(`🎯 Using manually specified path: ${manualPath}`);

  try {
    const configPath = join(manualPath, 'config.json');
    const configData: OutputConfig = await Bun.s3.file(configPath).json();

    const { personaName, theme } = configData.persona;

    if (!personaName || !theme) {
      throw new Error("Missing 'personaName' or 'theme' inside config.json persona key.");
    }

    // 2. Clean and setup destination
    console.log(`🧹 Cleaning destination: ${destinationPath}...`);
    await rm(destinationPath, { recursive: true, force: true });
    await mkdir(destinationPath, { recursive: true });

    // 3. Perform the main copy
    await copyS3FolderToLocal(manualPath, destinationPath);

    // 4. Copy persona assets dynamically
    const personaSourcePrefix = `personae/${personaName}/`;
    await copyS3FolderToLocal(personaSourcePrefix, personaDest);

    // 6. Copy the theme audio
    const audioSource = `audio/themes/${theme}.ogg`;
    const audioDest = join(destinationPath, 'theme.ogg');
    console.log(`🎵 Copying theme: ${theme}.ogg...`);
    const s3file = Bun.s3.file(audioSource);
    if (! await s3file.exists()) {
      throw new Error('Theme does not exist: ' + audioSource);
    }

    await Bun.write(audioDest, s3file)

    console.log('✅ Pipeline complete: Persona, Theme, and Background Video synced.');
  } catch (err) {
    console.error('❌ Failed to copy assets:', err instanceof Error ? err.message : err);
    exit(1);
  }
}

copyAssets();