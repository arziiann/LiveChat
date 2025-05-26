import crypto from "crypto";


const algorithm = "aes-128-cbc";
const iv = crypto.randomBytes(16);

export function encryptMessage(message) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(message, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

export function decryptMessage(encryptedMessage) {
  const parts = encryptedMessage.split(":");
  const iv = Buffer.from(parts.shift(), "base64");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
