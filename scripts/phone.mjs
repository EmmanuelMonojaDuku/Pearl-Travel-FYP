// Starts the API and the Expo dev server and prints a QR code to scan with Expo Go on your phone.
// Usage: npm run phone      (phone and computer must be on the same Wi-Fi)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';

function lanIp() {
  const BAD = /virtual|vbox|vmware|vethernet|hyper-v|wsl|docker|loopback|bluetooth|tailscale|zerotier|vpn|tap|tun/i;
  const found = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family !== 'IPv4' || i.internal) continue;
      if (i.address.startsWith('169.254.') || i.address.startsWith('192.168.56.') || i.address.startsWith('192.168.99.')) continue; // link-local, VirtualBox host-only
      found.push({ name, address: i.address, bad: BAD.test(name), wifi: /wi-?fi|wlan|wireless/i.test(name), eth: /ethernet/i.test(name) });
    }
  }
  const best = found.find((f) => !f.bad && f.wifi) ?? found.find((f) => !f.bad && f.eth) ?? found.find((f) => !f.bad) ?? found[0];
  if (best) console.log(`Using network adapter "${best.name}" (${best.address})`);
  return best?.address;
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
const expo = spawn('npx', ['expo', 'start', '--lan'], { cwd: 'mobile', stdio: 'inherit', shell: true, env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl, EXPO_NO_TYPESCRIPT_SETUP: '1', REACT_NATIVE_PACKAGER_HOSTNAME: ip } });
const stop = () => { api.kill(); expo.kill(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
expo.on('exit', stop);
