import { exec } from 'child_process';

/**
 * Enable the Cloudflare Warp VPN.
 * @returns A promise that resolves when the VPN is successfully enabled or rejects with an error message.
 */
export function enableWarpVPN(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('warp-cli connect', (error, stdout, stderr) => {
      if (error) {
        reject(`Error enabling VPN: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`CLI stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Disable the Cloudflare Warp VPN.
 * @returns A promise that resolves when the VPN is successfully disabled or rejects with an error message.
 */
export function disableWarpVPN(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('warp-cli disconnect', (error, stdout, stderr) => {
      if (error) {
        reject(`Error disabling VPN: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`CLI stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Check the status of the Cloudflare Warp VPN.
 * @returns A promise that resolves with the current VPN status or rejects with an error message.
 */
export function getWarpVPNStatus(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('warp-cli status', (error, stdout, stderr) => {
      if (error) {
        reject(`Error checking VPN status: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`CLI stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}
