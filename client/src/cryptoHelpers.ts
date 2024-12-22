const encoder = new TextEncoder();

export async function hashData(data: string) {
  const encodedData = encoder.encode(data);
  const hash = await window.crypto.subtle.digest("SHA-256", encodedData);
  var enc = new TextDecoder("utf-8");
  return enc.decode(hash);
}

export async function signData(hash: string, privateKey: CryptoKey) {
  const signature = await window.crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    privateKey,
    encoder.encode(hash)
  );
  return signature;
}

export async function verifySignature(signature: string, hash: string, publicKey: CryptoKey) {
  const isVerified = await crypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    publicKey,
    base64ToArrayBuffer(signature),
    encode(hash)
  );
  return isVerified;
}
export async function generateKeys() {
  const keys = await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: "SHA-256" },
    },
    true,
    ["sign", "verify"]
  );
  return keys;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
}

export function encode(data: string) {
  return encoder.encode(data);
}
