// Minimal crypto shim that exposes pbkdf2Sync and randomBytes for libraries expecting Node's crypto
import { randomBytes as _randomBytes } from 'crypto-browserify'
import { pbkdf2Sync as _pbkdf2Sync } from 'pbkdf2'

export function randomBytes(size) {
  return _randomBytes(size)
}

export function pbkdf2Sync(password, salt, iterations, keylen, digest) {
  // pbkdf2 from 'pbkdf2' accepts Buffer/string inputs similar to Node
  return _pbkdf2Sync(password, salt, iterations, keylen, digest)
}

export default {
  randomBytes,
  pbkdf2Sync
}
