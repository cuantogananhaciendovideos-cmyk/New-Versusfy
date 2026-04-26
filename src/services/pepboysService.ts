export const searchPepBoysProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/pepboys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search Pep Boys");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Pep Boys:", error);
    return null;
  }
};
