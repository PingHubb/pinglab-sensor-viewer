// A single command owner. Only complete lines/frames may become measurements.
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const parseInts = line => line.trim().split(/\s+/).filter(s => /^[+-]?\d+$/.test(s)).map(Number).filter(Number.isSafeInteger);
// Accept the firmware's labelled reply, or an exact legacy numeric pair.
// Boot/debug lines containing incidental numbers are not channel responses.
export function parseChannelCheck(line) {
  const match = line.trim().match(/^channelDrive:\s*(\d+)\s+channelSensor:\s*(\d+)$/i)
    || line.trim().match(/^(\d+)\s+(\d+)$/);
  if (!match) return null;
  const values = match.slice(1).map(Number);
  return values.every(v => Number.isSafeInteger(v) && v > 0) ? values : null;
}
export function takePayload(values, expected = 0, allowUnframed = false) {
  let start = null, frames = [];
  for (let i = 0; i+1 < values.length; i++) {
    if (values[i] === 55555 && values[i+1] === 55555) { start = i; i++; }
    else if (values[i] === 44444 && values[i+1] === 44444 && start !== null) {
      const payload = values.slice(start+2,i);
      if (payload.length) frames.push({payload, end:i+2});
      start = null; i++;
    }
  }
  if (frames.length) {
    const chosen = frames.filter(f => !expected || f.payload.length === expected).at(-1);
    return chosen ? [chosen.payload, values.slice(chosen.end)] : [null, values.slice(frames.at(-1).end)];
  }
  if (allowUnframed && expected && values.length === expected+4) return [values.slice(2,-2),[]];
  return [null, values];
}
export function responseTimeout(count, baud) {
  return Math.max(500, (((count+4)*6+1)*10/baud*1.5+.25)*1000);
}
export class SerialClient {
  constructor(port, baud) {
    this.port = port; this.baud = baud; this.expected = 0; this.lines = []; this.partial = '';
    this.failure = null; this.closed = false; this.busy = false; this.lastData = 0;
  }
  async open() {
    await this.port.open({baudRate:this.baud, dataBits:8, stopBits:1, parity:'none', flowControl:'none', bufferSize:65536});
    if (this.closed) { await this.port.close(); throw new Error('Connection cancelled.'); }
    this.reader = this.port.readable.getReader(); this.writer = this.port.writable.getWriter();
    this.readTask = this.readLoop();
  }
  async readLoop() {
    const decoder = new TextDecoder();
    try {
      while (!this.closed) {
        const {value,done} = await this.reader.read();
        if (done) { if (!this.closed) this.failure = new Error('Sensor disconnected.'); break; }
        this.lastData = performance.now(); this.partial += decoder.decode(value,{stream:true});
        if (this.partial.length > 131072) throw new Error('Serial response exceeded buffer limit.');
        let end;
        while ((end = this.partial.indexOf('\n')) >= 0) {
          this.lines.push(this.partial.slice(0,end).replace(/\r$/, '')); this.partial = this.partial.slice(end+1);
        }
        if (this.lines.length > 256) throw new Error('Serial input overflow; reconnect the sensor.');
      }
    } catch (e) { if (!this.closed) this.failure = e; }
    finally { this.reader.releaseLock(); }
  }
  discard() { this.lines = []; this.partial = ''; }
  async command(command, {count=this.expected, timeout=responseTimeout(count || 1664,this.baud)} = {}) {
    if (this.busy) throw new Error('Concurrent serial commands are not allowed.');
    if (this.closed || this.failure) throw this.failure || new Error('Serial connection is closed.');
    this.busy = true;
    try {
      // Following a timeout, wait for trailing bytes to settle before a new request.
      if (this.timedOut) {
        const until = performance.now()+responseTimeout(count || 1664,this.baud);
        while (!this.closed && performance.now()<until && performance.now()-this.lastData<120) await delay(10);
        this.timedOut = false;
      }
      if (this.closed) throw new Error('Serial connection is closed.');
      this.discard();
      await this.writer.write(new TextEncoder().encode(command+'\n'));
      const deadline = performance.now()+timeout;
      let pending = [];
      while (performance.now()<deadline && !this.closed) {
        if (this.failure) throw this.failure;
        const line = this.lines.shift();
        if (line === undefined) { await delay(4); continue; }
        if (command === 'channelCheck') {
          const channels = parseChannelCheck(line);
          if (channels) return channels;
          continue;
        }
        const ints = parseInts(line);
        if (!ints.length) continue;
        const fresh = !pending.length;
        pending.push(...ints);
        const [payload, rest] = takePayload(pending,count,fresh);
        if (payload) return payload;
        pending = rest;
        const limit = Math.max((count || 1664)+4,32);
        if (pending.length>limit) pending = pending.slice(-limit);
      }
      this.timedOut = true; this.discard(); return null;
    } finally { this.busy = false; }
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    if (this.reader) { try { await this.reader.cancel(); } catch {} }
    if (this.readTask) await this.readTask;
    // Wait for an in-flight write/request to release ownership before closing.
    while (this.busy) await delay(4);
    if (this.writer) { try { this.writer.releaseLock(); } catch {} }
    try { await this.port.close(); } catch {}
    this.discard();
  }
}
