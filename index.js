const mc = require('minecraft-protocol');
const wol = require('wakeonlan');

const BACKEND_HOST = process.env.BACKEND_HOST || '192.168.1.50';
const BACKEND_PORT = +process.env.BACKEND_PORT || 25565;
const BACKEND_MAC  = process.env.BACKEND_MAC; // e.g. "AA:BB:CC:DD:EE:FF"
const WOL_BROADCAST = process.env.WOL_BROADCAST || '192.168.1.255';

let wokeAt = 0;
const WOL_COOLDOWN = 60e3;

const server = mc.createServer({
  'online-mode': false,
  motd: 'Starting server... please wait.',
  version: process.env.MC_VERSION || '1.16.5',
  port: +process.env.PROXY_PORT || 25565,
  host: '0.0.0.0'
});

server.on('listening', () => {
  console.log(`Proxy listening on ${server.server.address().port}`);
});

server.on('connection', client => {
  client.on('packet', data => {
    if (data.state === mc.states.STATUS && Date.now() - wokeAt > WOL_COOLDOWN) {
      console.log('Status ping → sending WOL');
      wol(BACKEND_MAC, { address: WOL_BROADCAST })
        .then(() => { wokeAt = Date.now(); })
        .catch(console.error);
    }
  });
});

server.on('login', client => {
  setTimeout(() => {
    console.log(`Proxying ${client.username}`);
    const upstream = mc.createClient({
      host: BACKEND_HOST,
      port: BACKEND_PORT,
      username: client.username,
      version: client.protocolVersion
    });
    client.pipe(upstream).pipe(client);
    upstream.on('error', () => client.end());
  }, 10_000);
});
