import { spawn, ChildProcess } from 'node:child_process';

/**
 * Helper to spawn a process and pipe its output to the main terminal
 */
function runCommand(command: string, args: string[], name: string): ChildProcess {
  const child = spawn(command, args, {
    stdio: 'inherit', // Sends output directly to your current terminal
    shell: true,      // Allows running npx/npm commands across OS environments
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[${name}] Process exited with code ${code}`);
    }
  });

  return child;
}

console.log("== Starting Dev Environment ==");

// 1. Start Remotion Studio
const studio = runCommand('npx', ['remotion', 'studio'], 'Remotion');

// 2. Start your BullMQ listener
const listener = runCommand('npm', ['run', 'listen-messages'], 'Worker');

/**
 * Cleanup: Ensure child processes are killed when this script is stopped
 */
const cleanup = () => {
  console.log("\n== Shutting down processes ==");
  studio.kill();
  listener.kill();
  process.exit();
};

process.on('SIGINT', cleanup);  // Handles Ctrl+C
process.on('SIGTERM', cleanup); // Handles termination signals