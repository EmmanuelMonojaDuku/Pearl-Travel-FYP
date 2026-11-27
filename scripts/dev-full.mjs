// Starts the API (port 4000) and the web app (port 3000, demo mode) together. Works on Windows, macOS and Linux.
import { spawn } from 'node:child_process';
const run = (cmd, args, opts = {}) => spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
const api = run('npm', ['run', 'dev'], { cwd: 'api' });
const web = run('npx', ['vite', '--port=3000', '--host=0.0.0.0', '--mode', 'demo']);
const stop = () => { api.kill(); web.kill(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
api.on('exit', (c) => { if (c) { console.error('API stopped. Check api/.env (see api/.env.example).'); stop(); } });
