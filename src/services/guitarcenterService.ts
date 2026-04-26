export const searchGuitarCenterProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/guitarcenter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error searching Guitar Center:", error);
    return null;
  }
};
