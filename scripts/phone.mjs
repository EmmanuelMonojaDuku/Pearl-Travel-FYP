// Starts the API and the Expo dev server and prints a QR code to scan with Expo Go on your phone.
// Usage: npm run phone      (phone and computer must be on the same Wi-Fi)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';

function lanIp() {
  const all = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal);
  const pick = (re) => all.find((i) => re.test(i.address));
  return (pick(/^192\.168\./) ?? pick(/^10\./) ?? pick(/^172\.(1[6-9]|2\d|3[01])\./) ?? all[0])?.address;
}
const ip = process.env.PHONE_API_HOST || lanIp();
if (!ip) { console.error('No network connection found. Connect this computer to Wi-Fi and try again.'); process.exit(1); }
const apiUrl = `http://${ip}:4000`;

if (!existsSync('mobile/node_modules')) {
  console.log('Installing the mobile app packages (first run only, a few minutes)...');
  const r = spawnSync('npm', ['install'], { cwd: 'mobile', stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`\nPhone will reach the API at ${apiUrl}`);
console.log('If the phone cannot sign in, allow Node.js through Windows Firewall (Private networks) and keep both on the same Wi-Fi.\n');

const api = spawn('npm', ['run', 'dev'], { cwd: 'api', stdio: 'ignore', shell: true, env: { ...process.env, HOST: '0.0.0.0', LOG_LEVEL: 'warn' } });
const expo = spawn('npx', ['expo', 'start', '--lan'], { cwd: 'mobile', stdio: 'inherit', shell: true, env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl, EXPO_NO_TYPESCRIPT_SETUP: '1' } });
const stop = () => { api.kill(); expo.kill(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
expo.on('exit', stop);
