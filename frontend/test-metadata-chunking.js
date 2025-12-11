
// Mock TextEncoder for Node.js environment if not available globally
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
}

// Import the function to test
// Note: transforming ES module to CommonJS for simple node execution
const formatContent = (content) => {
    if (!content || typeof content !== 'string') {
        return []
    }

    const chunks = []
    const maxBytes = 64
    let currentChunk = ''

    for (const char of content) {
        const testChunk = currentChunk + char
        const byteLength = new TextEncoder().encode(testChunk).length

        if (byteLength > maxBytes) {
            if (currentChunk) {
                chunks.push(currentChunk)
            }
            currentChunk = char
        } else {
            currentChunk = testChunk
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk)
    }

    return chunks
};

// Test Runner
function runTest(name, input, expectedChunksCount) {
    console.log(`Running Test: ${name}`);
    const result = formatContent(input);
    const passed = result.length === expectedChunksCount;

    if (passed) {
        console.log(`✅ PASSED. Chunks: ${result.length}`);
        result.forEach((chunk, i) => {
            const bytes = new TextEncoder().encode(chunk).length;
            console.log(`   Chunk ${i + 1}: "${chunk.substring(0, 20)}..." (${bytes} bytes)`);
            if (bytes > 64) console.error(`   ❌ ERROR: Chunk ${i + 1} exceeds 64 bytes!`);
        });
    } else {
        console.error(`❌ FAILED. Expected ${expectedChunksCount} chunks, got ${result.length}`);
    }
    console.log('---');
}

// Tests
console.log('🧪 Testing Metadata Chunking Logic\n');

// 1. Short string (under 64 bytes)
runTest('Short String', 'Hello World', 1);

// 2. Exact 64 bytes
const exact64 = 'a'.repeat(64);
runTest('Exact 64 Bytes', exact64, 1);

// 3. 65 bytes (should be 2 chunks)
const boundary65 = 'a'.repeat(65);
runTest('Boundary 65 Bytes', boundary65, 2);

// 4. Unicode characters (multibyte)
// '🌟' is 4 bytes. 16 stars = 64 bytes. 17 stars = 68 bytes -> 2 chunks
const stars = '🌟'.repeat(17);
runTest('Unicode Characters', stars, 2);

// 5. Very long content
const lorem = "This is a very long note that exceeds the 64-byte limit. We are testing if the system correctly splits this into multiple smaller strings so that the Cardano transaction does not fail. This text should be broken down into several parts.";
// Length check: 236 chars ~ 236 bytes -> ~4 chunks
runTest('Long Text', lorem, 4);

console.log('Done.');
