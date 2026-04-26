export const searchWalmartProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/walmart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Walmart");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Walmart:", error);
    return null;
  }
};
