export const searchEbayProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/ebay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search eBay");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching eBay:", error);
    return null;
  }
};
