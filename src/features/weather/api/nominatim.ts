import type { City } from "@/features/weather/types";

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    state?: string;
  };
};

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<City | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { signal }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimResponse;
    const address = data.address;

    if (!address) {
      return null;
    }

    const name = address.city ?? address.town ?? address.village;

    if (!name) {
      return null;
    }

    return {
      id: `geo-${lat}-${lng}`,
      name,
      latitude: lat,
      longitude: lng,
      country: address.country ?? "",
      admin1: address.state,
    };
  } catch {
    return null;
  }
}
