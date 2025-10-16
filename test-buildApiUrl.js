// Test buildApiUrl logic to verify behavior

function buildApiUrl(endpoint, API_BASE_URL) {
  // Remove leading slash from endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Always use API_BASE_URL if it exists (even if it's a relative URL)
  if (!API_BASE_URL || API_BASE_URL === 'relative') {
    // For relative URLs, ensure endpoint starts with /api/
    return `/api/${cleanEndpoint}`;
  }

  // Check if API_BASE_URL already includes /api
  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  } else {
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  }
}

console.log('Testing buildApiUrl function:');
console.log('');

// LOCAL environment test
console.log('LOCAL (API_BASE_URL = "http://localhost:3001"):');
console.log('  buildApiUrl("ai/chat"):', buildApiUrl('ai/chat', 'http://localhost:3001'));
console.log('  buildApiUrl("/ai/chat"):', buildApiUrl('/ai/chat', 'http://localhost:3001'));
console.log('');

// GCP environment test
console.log('GCP (API_BASE_URL = "/api"):');
console.log('  buildApiUrl("ai/chat"):', buildApiUrl('ai/chat', '/api'));
console.log('  buildApiUrl("/ai/chat"):', buildApiUrl('/ai/chat', '/api'));
console.log('');

// Edge case - what if someone passes '/api/ai/chat'?
console.log('Edge case (endpoint already has /api):');
console.log('  LOCAL buildApiUrl("/api/ai/chat"):', buildApiUrl('/api/ai/chat', 'http://localhost:3001'));
console.log('  GCP buildApiUrl("/api/ai/chat"):', buildApiUrl('/api/ai/chat', '/api'));
