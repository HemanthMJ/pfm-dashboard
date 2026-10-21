const crypto = require("crypto");

function getEncryptionKey() {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters"
    );
  }

  return Buffer.from(keyHex, "hex");
}

function encryptToken(token) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return {
    accessTokenEncrypted: encrypted.toString("hex"),
    accessTokenIv: iv.toString("hex"),
    accessTokenAuthTag: cipher.getAuthTag().toString("hex"),
  };
}

function decryptToken(encryptedToken, ivHex, authTagHex) {
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedToken, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = {
  encryptToken,
  decryptToken,
};
