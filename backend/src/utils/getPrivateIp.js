import os from 'node:os';

function isPrivateIPv4(address) {
  const [a, b] = address.split('.').map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export default function getPrivateIP() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        isPrivateIPv4(iface.address)
      ) {
        return iface.address;
      }
    }
  }
  return null;
}