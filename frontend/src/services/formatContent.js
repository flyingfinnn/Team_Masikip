/**
 * Format content for Cardano transaction metadata
 * 
 * Cardano has a strict 64-byte limit per string in metadata.
 * This function chunks long strings into an array of strings,
 * each respecting the 64-byte UTF-8 encoding limit.
 * 
 * @param {string} content - The content to format (note text)
 * @returns {string[]} Array of strings, each ≤64 bytes when UTF-8 encoded
 * 
 * @example
 * // Short content (< 64 bytes)
 * formatContent("Hello World")
 * // Returns: ["Hello World"]
 * 
 * @example
 * // Long content (> 64 bytes)
 * formatContent("This is a very long note that exceeds the 64-byte limit...")
 * // Returns: ["This is a very long note that exceeds the 64-byte l", "imit..."]
 */
export function formatContent(content) {
  // Handle null, undefined, or empty content
  if (!content || typeof content !== 'string') {
    return []
  }

  const chunks = []
  const maxBytes = 64
  let currentChunk = ''

  // Iterate through each character
  for (const char of content) {
    const testChunk = currentChunk + char
    
    // Check if adding this character would exceed 64 bytes
    // Use TextEncoder to get accurate UTF-8 byte length
    const byteLength = new TextEncoder().encode(testChunk).length
    
    if (byteLength > maxBytes) {
      // Current chunk is full, save it and start a new one
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      currentChunk = char
    } else {
      // Still room in current chunk
      currentChunk = testChunk
    }
  }

  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Reconstruct original content from chunked array
 * Useful for testing and verification
 * 
 * @param {string[]} chunks - Array of content chunks
 * @returns {string} Reconstructed original content
 */
export function reconstructContent(chunks) {
  if (!Array.isArray(chunks)) {
    return ''
  }
  return chunks.join('')
}

export default formatContent
