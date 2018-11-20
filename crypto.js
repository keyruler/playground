"use strict";

/**
 * Crypto stubs to be used in consumer/producer together with the KeyRuler service endpoint
 *
 * Based on the initial workshops the KeyRuler service will provide:
 * newKey(context) which returns a key ID (kid) and the key for the provided context
 * getKey(kid) returns the matching key
 * deleteKey(kid)
 * getHMAC(context) returns secret key to be used in the HMAC SHA-256 process for the provided context
 *
 * Below these are implemented as static functions just to be able to mock the design...
 * ...i.e. they use a fixed kid and key.
 *
 * For ease of debugging, all components are base64 (i.e. readable) encoded. In practice we need to fully
 * understand the avro "bytes" defintion and how that can be used for another, more space efficient storage
 * of the concatenated data that is put into kafka...
 *
 * Further down we have simulated _fromValue and _toValue functions that will be part of the kafka-avro extension
 * The solution chosen is AES-GCM since it is patent free and allows for AEAD/AAD.
 * It's proven secure as long as IV is never reused with the same key and suitable for blocks smaller than 64GB...
 * See NIST SP 800-38D for details.
 *
 * Overall, errorhandling is missing - it's a hack after all =)
 *
 * Common lingo based on dicsussions/emails:
 * AE - Authenticated Encryption
 * AD - Additional Data
 * AEAD - AE with AD
 * AAD - Additional Authenticated Data
 * GCM - Galois/Counter Mode
 * IV - Initialization Vector
 * HMAC - Hash-based Message Authentication Code
 */
const crypto = require('crypto');

const demoKid = crypto.randomBytes(5).toString('base64'); // 40bits
const demoKey = crypto.randomBytes(32).toString('base64'); // 256bits

function newKey(context) {
    return {kid: demoKid, key: demoKey};
}

function getKey(kid) {
    return demoKey;
}

function deleteKey(kid) {
}

function getHMAC(context) {
}

const demoContext = "acontext";

/**
 * Fake _toValue
 */
function _toValue(buf) {
    /*
     * Prepare, generate a unique IV and get a new key to use
     */
    let iv = crypto.randomBytes(16);
    let tmpKey = newKey(demoContext);

    let cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(tmpKey.key, 'base64'), iv);

    /*
     * We pass the kid as AAD here, note that it's NOT part of the resulting encrypted string - just part of hash
     */
    cipher.setAAD(Buffer.from(tmpKey.kid, 'base64'))

    /*
     * Add the actual data from buf and complete the encryption
     */
    let encrypted = cipher.update(buf, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    /*
     * As stated above, there is no standard way to concat. The following seems
     * to be "default": IV + ciphertext + authtag
     * In our case we want to pass the AAD as well in plaintext:
     * IV + ciphertext + aad + authtag
     */
    return iv.toString('base64') + ':' + encrypted + ':' + tmpKey.kid + ':' + cipher.getAuthTag().toString('base64');
}

/**
 * Fake _fromValue
 */
function _fromValue(buf) {
    /*
     * TODO error handling, invalid count etc
     */
    let parts = buf.split(':');

    let iv = Buffer.from(parts[0], 'base64');
    let tmpKey = getKey(parts[2]);

    let decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(tmpKey, 'base64'), iv);

    /*
     * Set the AAD and authtag
     */
    decipher.setAAD(Buffer.from(parts[2], 'base64'))
    decipher.setAuthTag(Buffer.from(parts[3], 'base64'));

    /*
     * Actual decryption back to utf8 string
     */
    let decrypted = decipher.update(parts[1], 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

const demoString = "Once upon a time...";
console.log("Original: " + demoString);

const demoEncrypted = _toValue(demoString);
console.log("Encrypted: " + demoEncrypted);

console.log("Decrypted: " + _fromValue(demoEncrypted));
