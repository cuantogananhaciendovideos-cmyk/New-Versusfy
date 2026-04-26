export const searchAmazonProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/amazon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Amazon");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Amazon:", error);
    return null;
  }
};
