// api/generate-tryon.js

import { client } from "@gradio/client";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const hfToken = process.env.HF_ACCESS_TOKEN;
  // NOTE: We use the base URL here, not the /run/predict path
  const spaceUrl = "https://yisol-idm-vton.hf.space/"; 

  if (!hfToken) {
    return response.status(500).json({ error: 'API credentials not configured.' });
  }

  try {
    const { personImage, clothingImage } = request.body;
    if (!personImage || !clothingImage) {
      return response.status(400).json({ error: 'Missing image data.' });
    }
    
    // Connect to the Hugging Face Space using the Gradio client
    const app = await client(spaceUrl, { hf_token: hfToken });

    // The client makes it easier to call the right function and format data
    const result = await app.predict("/tryon", {
      dict: `data:image/jpeg;base64,${personImage}`,      // Human image
      garm_img: `data:image/jpeg;base64,${clothingImage}`,// Garment image
      garment_des: "wearing a leather jacket", // Description
    });
    
    // The result data contains the generated image URI
    const base64Uri = result.data[0];
    const base64Image = base64Uri.split(',')[1];
    
    return response.status(200).json({ generatedImage: base64Image });

  } catch (error) {
    console.error('OnMe Gradio Client Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred while running the AI model.' });
  }
}
