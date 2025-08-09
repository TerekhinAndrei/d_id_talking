export const uint8ToBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const cleanBase64 = (str) => (typeof str === 'string' && str.includes(',') ? str.split(',')[1] : str);

export const base64ToUint8 = (b64) => {
  const clean = cleanBase64(b64);
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};


