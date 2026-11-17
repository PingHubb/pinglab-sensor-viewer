// Ported from the source bundled with PingLab Sensor Viewer Windows v0.2.2.
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export class Grid {
  constructor(rows, columns) {
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || rows > 64 || columns < 1 || columns > 64 || rows * columns > 1600)
      throw new Error('Choose 1–64 rows and columns, with at most 1,600 taxels.');
    this.rows = rows; this.columns = columns; this.size = rows * columns;
  }
  extract(values) {
    const lengths = [this.size, this.rows * (this.columns + 1)];
    if (this.rows === 10 && this.columns === 9) lengths.push(110);
    if (!values || !lengths.includes(values.length) || !values.every(Number.isFinite))
      throw new Error(`Frame does not match ${this.rows} × ${this.columns}. Choose the correct grid and reconnect.`);
    return Array.from(values).slice(0, this.size);
  }
  static fromChannels(values) {
    if (!values || values.length !== 2) throw new Error('Grid detection failed. Select a grid manually.');
    return new Grid(values[1], values[0] - 1);
  }
}
export function displayed(raw, baseline, mode) {
  return raw.map((v, i) => mode === 'raw' ? v : mode === 'baseline' ? baseline[i] : mode === 'percent' ? (baseline[i] === 0 ? NaN : 100 * (v - baseline[i]) / baseline[i]) : v - baseline[i]);
}
export function extent(values) {
  let lo = Infinity, hi = -Infinity;
  for (const v of values) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return lo === Infinity ? [0, 0] : [lo, hi];
}
export function normalise(v, mode, scale, limits) {
  if (!Number.isFinite(v)) return 0;
  if (mode === 'raw' || mode === 'baseline') return limits[1] > limits[0] ? (v - limits[0]) / (limits[1] - limits[0]) : 0;
  return clamp(v / scale, -1, 1);
}
export function colour(v, mode, scale, palette, limits) {
  if (!Number.isFinite(v)) return [28, 43, 64];
  const q = normalise(v, mode, scale, limits), relative = mode === 'raw' || mode === 'baseline';
  if (palette === 'classic') {
    const target = relative ? [39, 143, 153] : v < 0 ? [27, 104, 154] : [145, 77, 33];
    return [28, 43, 64].map((b, i) => b + (target[i] - b) * Math.abs(q));
  }
  const x = relative ? q : palette === 'jet_signed' ? q / 2 + .5 : Math.abs(q);
  return [3, 2, 1].map(k => 255 * clamp(1.5 - Math.abs(4 * x - k), 0, 1));
}
export function cubicWeights(t) {
  return [((-.5*t+1)*t-.5)*t, (1.5*t-2.5)*t*t+1, ((-1.5*t+2)*t+.5)*t, (.5*t-.5)*t*t];
}
export function interpolate(values, grid, row, col, fill = 0) {
  const r = Math.floor(row), c = Math.floor(col), rw = cubicWeights(row-r), cw = cubicWeights(col-c);
  let out = 0;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const v = values[clamp(c+i-1, 0, grid.columns-1)*grid.rows + clamp(r+j-1, 0, grid.rows-1)];
    out += (Number.isFinite(v) ? v : fill) * rw[j] * cw[i];
  }
  return out;
}
export function medianFrames(frames) {
  return frames[0].map((_, i) => {
    const a = frames.map(f => f[i]).sort((a,b) => a-b), m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
  });
}
export class Recording {
  constructor(grid, source, maxBytes = 32 * 1024 * 1024) {
    this.grid = grid; this.maxBytes = maxBytes; this.started = null; this.count = 0; this.closed = false;
    this.metadata = {format:'pinglab_sensor_viewer_v1', rows:grid.rows, columns:grid.columns,
      indexing:'index = column * rows + row; row 0 is the top row',
      signal:'signed difference = raw - baseline; raw sensor units, not force', source,
      started_at:new Date().toISOString(), baseline_history:[], frames:0, dropped_frames:0};
    this.lines = [['timestamp_utc','elapsed_s','sequence','baseline_version',
      ...Array.from({length:grid.size}, (_,i) => `taxel_${String(i).padStart(3,'0')}_raw`),
      ...Array.from({length:grid.size}, (_,i) => `taxel_${String(i).padStart(3,'0')}_difference`)].join(',')+'\r\n'];
    this.bytes = this.lines[0].length;
  }
  append(p) {
    if (this.closed) throw new Error('Recording is closed.');
    if (this.started === null) this.started = p.time;
    const line = [p.utc, ((p.time-this.started)/1000).toFixed(6), p.sequence, p.version,
      ...p.raw, ...p.raw.map((v,i) => v-p.baseline[i])].join(',')+'\r\n';
    if (this.bytes + line.length > this.maxBytes) return false;
    const history = this.metadata.baseline_history;
    if (!history.length || history.at(-1).version !== p.version)
      history.push({version:p.version, sequence:p.sequence, values:[...p.baseline]});
    this.lines.push(line); this.bytes += line.length; this.count++;
    return true;
  }
  close(reason='user stopped') {
    this.closed = true;
    Object.assign(this.metadata, {frames:this.count, ended_at:new Date().toISOString(), stop_reason:reason});
    return this;
  }
}
