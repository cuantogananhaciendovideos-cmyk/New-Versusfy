export const searchAutoZoneProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/autozone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      throw new Error("Failed to search AutoZone");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching AutoZone:", error);
    return null;
  }
};
