export const searchOReillyAutoProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/oreilly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search OReilly");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching OReilly:", error);
    return null;
  }
};
