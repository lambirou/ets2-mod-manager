const cheerio = require("cheerio");
function sources(q) {
  return [
    {
      name: "Steam Workshop",
      url:
        "https://steamcommunity.com/workshop/browse/?appid=227300&searchtext=" +
        encodeURIComponent(q),
      mode: "integrated",
    },
    {
      name: "ETS2.lt",
      url: "https://ets2.lt/en/?s=" + encodeURIComponent(q),
      mode: "integrated",
    },
    { name: "TruckyMods", url: "https://truckymods.io/", mode: "website" },
    { name: "ProMods", url: "https://promods.net/", mode: "website" },
  ];
}
async function search(q) {
  return Promise.all(
    sources(q).map(async (s) => {
      if (s.mode !== "integrated")
        return {
          ...s,
          items: [],
          message: "Catalogue officiel : poursuivre la recherche sur le site.",
        };
      try {
        const r = await fetch(s.url, {
          signal: AbortSignal.timeout(12000),
          headers: { "User-Agent": "ETS2ModManager/0.1" },
        });
        if (!r.ok) throw Error("HTTP " + r.status);
        const $ = cheerio.load(await r.text());
        const items = [];
        if (s.name === "ETS2.lt")
          $("article")
            .slice(0, 20)
            .each((_, e) => {
              const a = $(e).find("h2 a,h1 a").first();
              if (a.attr("href"))
                items.push({
                  name: a.text().trim(),
                  url: a.attr("href"),
                  description: $(e)
                    .find(".entry-content")
                    .text()
                    .trim()
                    .slice(0, 1200),
                  announced: a.text().match(/1\.\d{2}(?:\.x|x)?/g) || [],
                });
            });
        else {
          const seen = new Set();
          $('a[href*="sharedfiles/filedetails"]').each((_, e) => {
            const a = $(e),
              name = a.text().trim(),
              url = a.attr("href");
            if (name && url && !seen.has(url) && items.length < 20) {
              seen.add(url);
              items.push({
                name,
                url,
                announced: name.match(/1\.\d{2}(?:\.x|x)?/g) || [],
              });
            }
          });
        }
        return {
          ...s,
          items,
          checkedAt: new Date().toISOString(),
          message: items.length
            ? ""
            : "Aucun résultat extrait. Recherche disponible sur le site.",
        };
      } catch (e) {
        return {
          ...s,
          items: [],
          message: "Recherche intégrée indisponible : " + e.message,
        };
      }
    }),
  );
}
module.exports = { search, sources };
