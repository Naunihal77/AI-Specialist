export async function* analyzeImage(imageBuffer: string, mimeType: string, prompt: string) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBuffer, mimeType, prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analyze API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data?.text) {
    throw new Error("No analysis text returned from API.");
  }

  // Fall back to the same generator interface (only one chunk currently)
  yield data.text;
}
