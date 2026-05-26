import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";

import { reverseGeocode } from "./nominatim";

describe("reverseGeocode", () => {
  const originalFetch = globalThis.fetch;

  before(() => {
    // fetch remplacé par mock dans chaque test
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(payload: unknown, ok = true) {
    globalThis.fetch = mock.fn(async () => ({
      ok,
      json: async () => payload,
    })) as unknown as typeof fetch;
  }

  it("réponse valide avec address.city → City correctement construit", async () => {
    mockFetch({
      address: {
        city: "Paris",
        country: "France",
        state: "Île-de-France",
      },
    });

    const city = await reverseGeocode(48.8566, 2.3522);

    assert.ok(city);
    assert.equal(city.name, "Paris");
    assert.equal(city.id, "geo-48.8566-2.3522");
    assert.equal(city.latitude, 48.8566);
    assert.equal(city.longitude, 2.3522);
    assert.equal(city.country, "France");
    assert.equal(city.admin1, "Île-de-France");
  });

  it("réponse avec address.town (pas de city) → City avec name = address.town", async () => {
    mockFetch({
      address: {
        town: "Versailles",
        country: "France",
      },
    });

    const city = await reverseGeocode(48.8, 2.1);

    assert.ok(city);
    assert.equal(city.name, "Versailles");
  });

  it("réponse sans city/town/village → null", async () => {
    mockFetch({
      address: {
        country: "France",
        state: "Bretagne",
      },
    });

    const city = await reverseGeocode(48.0, 2.0);

    assert.equal(city, null);
  });

  it("erreur réseau → null", async () => {
    globalThis.fetch = mock.fn(async () => {
      throw new Error("Network error");
    }) as unknown as typeof fetch;

    const city = await reverseGeocode(48.0, 2.0);

    assert.equal(city, null);
  });
});
