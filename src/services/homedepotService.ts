export const searchHomeDepotProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/homedepot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Home Depot");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Home Depot:", error);
    return null;
  }
};
