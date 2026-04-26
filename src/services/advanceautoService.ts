export const searchAdvanceAutoProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/advanceauto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Advance Auto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Advance Auto:", error);
    return null;
  }
};
