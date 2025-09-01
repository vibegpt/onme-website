// api/generate-tryon.js

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Securely get your Hugging Face token and Endpoint URL
  const hfToken = process.env.HF_ACCESS_TOKEN;
  const endpointUrl = process.env.HF_VTON_ENDPOINT_URL;

  if (!hfToken || !endpointUrl) {
    return response.status(500).json({ error: 'API credentials not configured on the server.' });
  }

  try {
    const { personImage, clothingImage } = request.body;

    if (!personImage || !clothingImage) {
      return response.status(400).json({ error: 'Missing person or clothing image data.' });
    }

    // Gradio APIs expect the data to be in a "data" array.
    // We also need to format the images as data URIs.
    const payload = {
      data: [
        `data:image/jpeg;base64,${personImage}`,   // Human image
        `data:image/jpeg;base64,${clothingImage}`, // Garment image
        "both", // Mode
        true,   // Use auto-generated mask
        true    // Use auto-crop & resizing
      ]
    };

    const apiResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        console.error('Hugging Face API Error:', errorBody);
        return response.status(apiResponse.status).json({ error: 'The AI model failed to process the request.' });
    }
    
    const result = await apiResponse.json();
    
    // The Gradio API returns its result in a "data" array as well.
    // The generated image is usually the first item.
    const base64Uri = result.data[0];

    // Remove the "data:image/png;base64," prefix to get the raw Base64 data.
    const base64Image = base64Uri.split(',')[1];
    
    return response.status(200).json({ generatedImage: base64Image });

  } catch (error) {
    console.error('OnMe VTON API Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
