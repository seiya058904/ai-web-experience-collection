import fs from "node:fs/promises";

async function get(url) {
  console.log(
    "Fetching",
    new URL(url).hostname,
    new URL(url).pathname.slice(0, 100),
  );
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}
const dataUrl =
  "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson";
let selected;
try {
  selected = JSON.parse(await fs.readFile("experiences/f1/src/circuits.json", "utf8"));
} catch {
  const data = await (await get(dataUrl)).json();
  selected = {};
  for (const name of ["Monza", "Suzuka", "Monaco"]) {
    const feature = data.features.find(
      (feature) => feature.properties.Location === name,
    );
    if (!feature || feature.geometry.type !== "LineString")
      throw new Error(`Missing circuit ${name}`);
    selected[name.toLowerCase()] = feature.geometry.coordinates.map(
      (coordinate) => coordinate.slice(0, 2),
    );
  }
}
await fs.writeFile("experiences/f1/src/circuits.json", JSON.stringify(selected));
await fs.mkdir("public/f1/fonts", { recursive: true });
const sourceTexts = await Promise.all(
  ["pages/f1/index.html", "experiences/f1/src/interactions.ts"].map((file) =>
    fs.readFile(file, "utf8"),
  ),
);
const allText =
  sourceTexts.join("") +
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz−×↗↘。！，、：；（）·";
const chars = [...new Set(allText.match(/[\u3000-\u9fff\uff00-\uffef]/g))]
  .sort()
  .join("");
const fontUrl = new URL("https://fonts.googleapis.com/css2");
fontUrl.searchParams.set("family", "Noto Sans SC:wght@100..900");
fontUrl.searchParams.set("text", chars);
fontUrl.searchParams.set("display", "swap");
const css = await (await get(fontUrl)).text();
await fs.writeFile("provenance/f1/font-source.css", css);
if (!css.includes("font-weight: 100 900"))
  throw new Error(
    "Expected a variable font response, not a single static weight.",
  );
const fontFile = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!fontFile) throw new Error("Font stylesheet had no downloadable file.");
await fs.writeFile(
  "public/f1/fonts/noto-sans-sc.woff2",
  Buffer.from(await (await get(fontFile)).arrayBuffer()),
);
const notices = [];
for (const [label, url] of [
  [
    "Circuit geometry — Copyright Tomislav Bacinger; MIT",
    "https://raw.githubusercontent.com/bacinger/f1-circuits/master/LICENSE.md",
  ],
  [
    "Noto Sans SC — SIL Open Font License",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt",
  ],
])
  notices.push(`${label}\nSource: ${url}\n\n${await (await get(url)).text()}`);
for (const [label, file] of [
  ["Lenis", "node_modules/lenis/LICENSE"],
  ["Barlow Condensed", "node_modules/@fontsource/barlow-condensed/LICENSE"],
]) {
  try {
    notices.push(`${label}\n\n${await fs.readFile(file, "utf8")}`);
  } catch {
    throw new Error(`Required license missing: ${file}`);
  }
}
notices.push(
  "GSAP 3.15.0 / ScrollTrigger\nCopyright (c) 2008-2026, GreenSock. All rights reserved.\nDistributed under the GSAP Standard No-Charge License.\nAuthoritative full terms: https://gsap.com/standard-license\nThe installed package contains a license URL rather than a LICENSE file; the original package headers are retained in the bundle.",
);
await fs.writeFile(
  "public/licenses.txt",
  notices.join("\n\n==================================================\n\n"),
);
await fs.writeFile(
  "provenance/f1/provenance.json",
  JSON.stringify(
    {
      checked: "2026-10-04",
      circuits: {
        source: dataUrl,
        license: "MIT",
        copyright: "2019-2025 Tomislav Bacinger",
        transform:
          "Selected Monza, Suzuka, Monaco; runtime latitude-corrected projection and uniform scaling.",
      },
      fonts: {
        noto: {
          source: fontFile,
          css: fontUrl.toString(),
          license: "SIL OFL 1.1",
          subset: chars.length,
        },
        barlow: {
          source: "@fontsource/barlow-condensed 5.3.0",
          license: "SIL OFL 1.1",
        },
      },
      images: {
        source: "OpenAI built-in Image Gen, created for this project",
        nature:
          "Generated unbranded concept illustrations; not official photographs, exact engineering diagrams or real event records",
        originals: "provenance/f1/source",
        references: "provenance/f1/concepts",
        production: "public/f1/media",
        prompts: "provenance/f1/image-prompts.json",
      },
    },
    null,
    2,
  ),
);
console.log(
  "Prepared circuit points:",
  Object.fromEntries(
    Object.entries(selected).map(([key, value]) => [key, value.length]),
  ),
  "; Chinese glyph subset:",
  chars.length,
);
