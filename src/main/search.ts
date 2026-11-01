import { load } from "cheerio";
import type { SearchItem, SearchSource } from "../shared/types";

export function sources(query: string): Array<
  Omit<SearchSource, "items"> & { items?: SearchItem[] }
> {
  return [
    {
      name: "Steam Workshop",
      url:
        "https://steamcommunity.com/workshop/browse/?appid=227300&searchtext=" +
        encodeURIComponent(query),
      mode: "integrated",
    },
    {
      name: "ETS2.lt",
      url: "https://ets2.lt/en/?s=" + encodeURIComponent(query),
      mode: "integrated",
    },
    { name: "TruckyMods", url: "https://truckymods.io/", mode: "website" },
    { name: "ProMods", url: "https://promods.net/", mode: "website" },
  ];
}

export async function search(query: string): Promise<SearchSource[]> {
  return Promise.all(
    sources(query).map(async (source): Promise<SearchSource> => {
      if (source.mode !== "integrated")
        return {
          ...source,
          items: [],
          message: "Catalogue officiel : poursuivre la recherche sur le site.",
        };
      try {
        const response = await fetch(source.url, {
          signal: AbortSignal.timeout(12_000),
          headers: { "User-Agent": "ETS2ModManager/0.2" },
        });
        if (!response.ok) throw Error("HTTP " + response.status);
        const $ = load(await response.text());
        const items: SearchItem[] = [];
        if (source.name === "ETS2.lt") {
          $("article")
            .slice(0, 20)
            .each((_, element) => {
              const link = $(element).find("h2 a,h1 a").first();
              const url = link.attr("href");
              if (url)
                items.push({
                  name: link.text().trim(),
                  url,
                  description: $(element)
                    .find(".entry-content")
                    .text()
                    .trim()
                    .slice(0, 1200),
                  announced: link.text().match(/1\.\d{2}(?:\.x|x)?/g) ?? [],
                });
            });
        } else {
          const seen = new Set<string>();
          $('a[href*="sharedfiles/filedetails"]').each((_, element) => {
            const link = $(element);
            const name = link.text().trim();
            const url = link.attr("href");
            if (name && url && !seen.has(url) && items.length < 20) {
              seen.add(url);
              items.push({
                name,
                url,
                announced: name.match(/1\.\d{2}(?:\.x|x)?/g) ?? [],
              });
            }
          });
        }
        return {
          ...source,
          items,
          checkedAt: new Date().toISOString(),
          message: items.length
            ? ""
            : "Aucun résultat extrait. Recherche disponible sur le site.",
        };
      } catch (error) {
        return {
          ...source,
          items: [],
          message:
            "Recherche intégrée indisponible : " +
            (error instanceof Error ? error.message : String(error)),
        };
      }
    }),
  );
}
