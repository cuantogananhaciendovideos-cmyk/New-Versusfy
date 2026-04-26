export async function searchToysRUsProducts(keywords: string) {
  try {
    const response = await fetch('/api/toysrus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });
    if (!response.ok) {
      throw new Error(`Toys R Us API returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Toys R Us Search Error:", error);
    throw error;
  }
}
