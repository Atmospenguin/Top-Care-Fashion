const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchListings() {
  try {
    const response = await fetch(`${API_URL}/api/listings`);
    if (!response.ok) {
      throw new Error("Failed to fetch listings");
    }
    const data = await response.json();
    return data.items ?? [];
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
}
