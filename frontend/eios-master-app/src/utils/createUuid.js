export function createUuid() {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(
      bytes,
      (byte) => byte.toString(16).padStart(2, "0")
    );

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  const timestamp = Date.now().toString(16).padStart(12, "0");
  const randomPart = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    .toString(16)
    .padStart(14, "0")
    .slice(-14);

  return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-4${randomPart.slice(0, 3)}-8${randomPart.slice(3, 6)}-${randomPart.slice(6, 18).padEnd(12, "0")}`;
}
