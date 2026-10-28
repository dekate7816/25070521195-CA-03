import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
} from '../utils/crypto.js';

describe('Cryptography Utilities Tests', () => {
  it('hashes passwords using scrypt and verifies correctly', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    assert.ok(hash.includes(':'), 'Hash must contain salt separator');
    const [salt, key] = hash.split(':');
    assert.equal(salt.length, 32, 'Salt must be 16 bytes in hex (32 chars)');
    assert.equal(key.length, 128, 'Derived key must be 64 bytes in hex (128 chars)');

    const isValid = await verifyPassword(password, hash);
    assert.equal(isValid, true, 'Correct password must verify as true');

    const isWrong = await verifyPassword('WrongPassword!', hash);
    assert.equal(isWrong, false, 'Incorrect password must verify as false');
  });

  it('generates unique salts for identical passwords', async () => {
    const password = 'SamePassword456!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.notEqual(hash1, hash2, 'Hashes of identical passwords must have different salts');
    assert.equal(await verifyPassword(password, hash1), true);
    assert.equal(await verifyPassword(password, hash2), true);
  });

  it('safely handles empty or malformed hashes in verifyPassword', async () => {
    assert.equal(await verifyPassword('password', ''), false);
    assert.equal(await verifyPassword('password', null), false);
    assert.equal(await verifyPassword('password', 'not-a-valid-hash'), false);
  });

  it('generates random session tokens and deterministic SHA-256 hashes at rest', () => {
    const token1 = generateToken(32);
    const token2 = generateToken(32);

    assert.equal(token1.length, 64, '32 bytes hex should be 64 characters');
    assert.notEqual(token1, token2, 'Generated tokens must be unique');

    const hash1 = hashToken(token1);
    const hash1Again = hashToken(token1);
    const hash2 = hashToken(token2);

    assert.equal(hash1, hash1Again, 'Token hash must be deterministic');
    assert.notEqual(hash1, hash2, 'Different tokens must have different hashes');
    assert.equal(hash1.length, 64, 'SHA-256 hash must be 64 characters hex');
  });
});
