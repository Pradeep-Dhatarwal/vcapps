const crypto = require("crypto");
const key = "234454qwjx8ehs8a02m3usva7tsbeo28";
const iv = "sufj3s9sdn3hs232";
const encrypt_decrypt = {
    "encrypt": function (text){
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key , "ascii" ), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return { iv: iv, encryptedData: encrypted.toString('base64') };
    },
    "decrypt":function(text) {
        let encryptedText = Buffer.from(text, 'base64');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key , 'ascii'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted += Buffer.concat([decipher.final()]);
        return decrypted;
        }
};
module.exports = encrypt_decrypt;
