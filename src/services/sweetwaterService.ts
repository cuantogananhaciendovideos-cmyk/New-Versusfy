export const searchSweetwaterProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/sweetwater", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error searching Sweetwater:", error);
    return null;
  }
};
