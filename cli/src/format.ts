export function formatCompletesAt(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return `${target.toLocaleString()} (ready!)`;

  const totalSec = Math.ceil(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (min > 0) parts.push(`${min}m`);
  if (hrs === 0 && sec > 0) parts.push(`${sec}s`);

  return `${target.toLocaleString()} (${parts.join(' ')} from now)`;
}
