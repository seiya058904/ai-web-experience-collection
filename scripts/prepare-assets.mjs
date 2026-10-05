import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = process.argv[2];
if (!sourceDirectory)
  throw new Error(
    "Provide the Image Gen output directory as the first argument.",
  );
const files = [
  ["hero", "exec-629b9f46-c538-4606-818e-efccd43259bc.png", [960, 1600, 2400]],
  [
    "car-side",
    "exec-8eff98ed-6174-4895-8755-ed4e5f6de7fa.png",
    [960, 1600, 2200],
  ],
  ["engine", "exec-6b483487-a682-4ba1-98a6-a5596bd92999.png", [800, 1400]],
  ["tyre", "exec-28cd7a0b-42c6-41a0-9280-ddfcc5674570.png", [800, 1400]],
  ["pit", "exec-b656dfc9-4100-4df5-bf30-dd1b63718e2d.png", [960, 1600, 2000]],
];
await fs.mkdir("provenance/f1/source", { recursive: true });
await fs.mkdir("public/f1/media", { recursive: true });
await fs.mkdir("provenance/f1/concepts", { recursive: true });
for (const [name, file, sizes] of files) {
  const input = path.join(sourceDirectory, file);
  await fs.copyFile(input, `provenance/f1/source/${name}.png`);
  const metadata = await sharp(input).metadata();
  for (const width of sizes) {
    await sharp(input)
      .resize({ width })
      .webp({ quality: name === "hero" ? 90 : 85, effort: 6 })
      .toFile(`public/f1/media/${name}-${width}.webp`);
  }
  console.log(name, metadata.width, metadata.height);
}
const concepts = {
  hero: "exec-951e7d55-b13a-4dbf-b204-627c36e819ed.png",
  aero: "exec-640933d3-85a2-4c21-8ad3-1789f7c850c3.png",
  energy: "exec-89e4e55e-4a9b-47d2-a61d-97f6237220c3.png",
  tyres: "exec-a0a3ffc7-d1f7-4380-8eb1-3b6b63de15ed.png",
  race: "exec-53465a35-40d2-4b9b-9c40-ed0229be10ce.png",
  finale: "exec-0ebe259e-32bf-4aed-b053-ee5400fb2e6b.png",
};
for (const [name, file] of Object.entries(concepts))
  await fs.copyFile(
    path.join(sourceDirectory, file),
    `provenance/f1/concepts/${name}.png`,
  );
