export const searchWalgreensProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/walgreens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Walgreens");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Walgreens:", error);
    return null;
  }
};
