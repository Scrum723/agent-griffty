import { describe, expect, it } from "vitest";
import { assertPublicWatchAddress, detectChain } from "./wallets.js";

describe("watch-only public addresses", () => {
  it("accepts Solana, EVM, Bitcoin bech32, and XRPL classic", () => {
    expect(detectChain("FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z")).toBe("solana");
    expect(detectChain("0x4d2cf207fdb93a183f959533ce1081f696a5f191")).toBe("ethereum");
    expect(detectChain("bc1q457dstu7ehk2k6eku6t3f7x8kkm2yur6wanydl")).toBe("bitcoin");
    expect(detectChain("rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4")).toBe("xrpl");
  });

  it("rejects seed-like and key-like material", () => {
    expect(() =>
      assertPublicWatchAddress(
        "abandon ability able about above absent absorb abstract absurd abuse access accident",
      ),
    ).toThrow(/recovery phrase/);
  });
});
