export const searchMusiciansFriendProducts = async (keywords: string) => {
  try {
    const response = await fetch("/api/musiciansfriend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error searching Musician's Friend:", error);
    return null;
  }
};
