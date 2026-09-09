/** Read ZIP files written with STORE (method 0), as this kit's exporter does. */

function u16(buf: Uint8Array, o: number): number {
  return buf[o]! | (buf[o + 1]! << 8);
}

function u32(buf: Uint8Array, o: number): number {
  return (
    buf[o]! |
    (buf[o + 1]! << 8) |
    (buf[o + 2]! << 16) |
    (buf[o + 3]! << 24)
  ) >>> 0;
}

export function unzipStore(buf: Uint8Array): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  let i = 0;
  while (i + 30 <= buf.length) {
    const sig = u32(buf, i);
    if (sig === 0x02014b50 || sig === 0x06054b50) break;
    if (sig !== 0x04034b50) {
      throw new Error("Not a ZIP (STORE) archive, or unsupported extra data.");
    }
    const method = u16(buf, i + 8);
    const comp = u32(buf, i + 18);
    const uncomp = u32(buf, i + 22);
    const nameLen = u16(buf, i + 26);
    const extraLen = u16(buf, i + 28);
    const nameStart = i + 30;
    const name = new TextDecoder().decode(buf.slice(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if (method !== 0) {
      throw new Error(`ZIP entry "${name}" is compressed (method ${method}). This reader supports STORE only.`);
    }
    const size = comp || uncomp;
    out.set(name.replace(/\\/g, "/"), buf.slice(dataStart, dataStart + size));
    i = dataStart + size;
  }
  return out;
}

export function readPackJsonFromZip(buf: Uint8Array): string {
  const files = unzipStore(buf);
  const raw = files.get("pack.json");
  if (!raw) throw new Error("ZIP is missing pack.json.");
  return new TextDecoder().decode(raw);
}
