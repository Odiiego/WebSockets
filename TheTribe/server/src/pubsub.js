import { createClient } from 'redis';

const pub = createClient();
const sub = createClient();

await pub.connect();
await sub.connect();

export function publishMove(roomId, gameState) {
  return pub.publish('game-moves', JSON.stringify({ id: roomId, gameState }));
}
export function onMove(callback) {
  sub.subscribe('game-moves', (msg) => callback(JSON.parse(msg)));
}
