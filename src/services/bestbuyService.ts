export const searchBestBuyProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/bestbuy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Best Buy");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Best Buy:", error);
    return null;
  }
};
