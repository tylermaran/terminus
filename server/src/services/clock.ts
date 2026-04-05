// GAME_SPEED controls how fast game time passes relative to real time.
// 1 = real time, 10 = 10x faster (a 5-min build finishes in 30s), etc.
export const GAME_SPEED = parseFloat(process.env.GAME_SPEED || '1');

/**
 * Calculate when something completes given a duration in real seconds.
 * At GAME_SPEED=10, a 300s build takes 30 real seconds.
 */
export function completesAt(durationSeconds: number): Date {
  return new Date(Date.now() + (durationSeconds / GAME_SPEED) * 1000);
}

/**
 * Calculate how many game-hours have elapsed since a timestamp.
 * At GAME_SPEED=10, 1 real minute = 10 game minutes.
 */
export function elapsedGameHours(since: Date): number {
  const realMs = Date.now() - since.getTime();
  return (realMs * GAME_SPEED) / (1000 * 60 * 60);
}
