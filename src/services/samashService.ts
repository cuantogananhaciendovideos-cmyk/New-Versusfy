export const searchSamAshProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/samash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error searching Sam Ash:", error);
    return null;
  }
};
