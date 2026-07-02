import { networkInterfaces } from 'node:os';

const interfaces = networkInterfaces();

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name] ?? []) {
    if (iface.family !== 'IPv4' || iface.internal) continue;

    console.log(` → ${name}: ${iface.address}`);
  }
}
