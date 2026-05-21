const JIBBLE_API_BASE = process.env.JIBBLE_API_URL || 'https://api.jibble.io/v1';
const JIBBLE_API_KEY = process.env.JIBBLE_API_KEY || '';

class JibbleAPIError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'JibbleAPIError';
    this.status = status;
  }
}

async function jibbleRequest(endpoint, options = {}) {
  if (!JIBBLE_API_KEY) {
    throw new Error('Jibble API key not configured. Set JIBBLE_API_KEY environment variable.');
  }

  const url = `${JIBBLE_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${JIBBLE_API_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new JibbleAPIError(response.status, errorBody.message || response.statusText || 'Jibble API request failed');
  }

  return await response.json();
}

async function getJibbleAttendance(startDate, endDate) {
  const response = await jibbleRequest(`/attendance?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
  return response.data || [];
}

module.exports = {
  getJibbleAttendance,
};
