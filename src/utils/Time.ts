export function parseDurationToSeconds(duration: string): number {
  // Accept values like '24h', '48h', '2d', '72' (hours), '3600s', '30m'
  const s = duration.trim().toLowerCase();

  if (s.endsWith("d")) {
    const n = parseFloat(s.slice(0, -1));
    return Math.round(n * 24 * 3600);
  }
  if (s.endsWith("h")) {
    const n = parseFloat(s.slice(0, -1));
    return Math.round(n * 3600);
  }
  if (s.endsWith("m")) {
    const n = parseFloat(s.slice(0, -1));
    return Math.round(n * 60);
  }
  if (s.endsWith("s")) {
    return Math.round(parseFloat(s.slice(0, -1)));
  }

  // plain number: treat as hours
  const n = parseFloat(s);
  if (!isNaN(n)) return Math.round(n * 3600);

  throw new Error("Invalid duration");
}

export function getCountdownFromNow(endTime: Date) {
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();
  const remaining = Math.max(0, Math.floor(diffMs / 1000)); // secs
  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;
  return { hrs, mins, secs, totalSeconds: remaining };
}

export function timeAgoString(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
