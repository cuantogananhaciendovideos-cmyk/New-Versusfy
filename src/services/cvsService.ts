export const searchCVSProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/cvs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search CVS");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching CVS:", error);
    return null;
  }
};
