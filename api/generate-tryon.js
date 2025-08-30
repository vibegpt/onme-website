// This is a secure, server-side function that acts as a proxy to the Google AI API.
// It keeps your API key safe and hidden from the public.

export default async function handler(request, response) {
  // Only allow POST requests for security.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Securely get the API key from Vercel's Environment Variables.
  const geminiApiKey = process.env.VITE_GEMINI_API_KEY;

  if (!geminiApiKey) {
    return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${geminiApiKey}`;

  try {
    // Forward the user's request body to the Google AI API.
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });
    
    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
        // If Google's API returns an error, forward it to the user.
        return response.status(geminiResponse.status).json(data);
    }
    
    // Send the successful response from the AI back to the user.
    return response.status(200).json(data);

  } catch (error) {
    console.error('OnMe API Proxy Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
