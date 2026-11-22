import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { decks } from "./presentation-template-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = path.join(root, "public", "templates");
const logoPath = path.join(root, "public", "images", "branding", "logo-full.png");
const theme = {
  ink: "14342D",
  dark: "123C34",
  accent: "196D5D",
  muted: "455F57",
  line: "D1E2DB",
  white: "FFFFFF",
  mint: "E6F3ED",
  paper: "F7FBF8",
};
const titleFont = "Arial";
const bodyFont = "Arial";

function addText(slide, value, options) {
  slide.addText(value, {
    fontFace: bodyFont,
    color: theme.ink,
    margin: 0,
    valign: "mid",
    ...options,
  });
}

function addCover(pptx, deck, example) {
  const slide = pptx.addSlide({ masterName: "APT" });
  slide.background = { color: theme.paper };
  addText(slide, example ? "Worked example" : "Editable PowerPoint starter", {
    x: 0.72, y: 1.55, w: 10.8, h: 0.34, fontSize: 17, color: theme.accent, bold: true,
  });
  addText(slide, example ? deck.exampleTitle : deck.title, {
    x: 0.7, y: 2.1, w: 11.65, h: 1.32, fontFace: titleFont, fontSize: 46, bold: true, fit: "shrink",
  });
  addText(slide, deck.summary, {
    x: 0.73, y: 3.65, w: 8.8, h: 0.9, fontSize: 23, color: theme.muted, valign: "top",
  });
  addText(slide, example ? `${deck.customer} · Fictional illustrative data` : "[Company or customer]   ·   [Reporting period]", {
    x: 0.73, y: 5.57, w: 10.8, h: 0.4, fontSize: 17, bold: true,
  });
}

function addNotes(slide, rows, example) {
  for (const [index, [label, detail]] of rows.entries()) {
    const y = 2.18 + index * 1.18;
    addText(slide, label, {
      x: 0.74, y, w: 2.9, h: 0.82, fontFace: titleFont, fontSize: 21, bold: true, valign: "top",
    });
    addText(slide, example ? detail : "[Add details]", {
      x: 3.88, y, w: 8.6, h: 0.84, fontSize: 20, color: example ? theme.ink : theme.muted, valign: "top",
    });
  }
}

function addTable(slide, content, example) {
  const { headers, rows, keepLabels } = content;
  const header = headers.map((text) => ({ text, options: { bold: true, color: theme.white, fill: { color: theme.dark } } }));
  const body = rows.map((row, rowIndex) => headers.map((label, columnIndex) => {
    const text = example ? row[columnIndex] : columnIndex === 0 && keepLabels ? row[0] : "[Enter " + label.toLowerCase() + "]";
    return {
      text,
      options: {
        bold: columnIndex === 0 && keepLabels,
        color: !example && !(columnIndex === 0 && keepLabels) ? theme.muted : theme.ink,
        fill: { color: rowIndex % 2 === 0 ? theme.mint : theme.white },
      },
    };
  }));
  slide.addTable([header, ...body], {
    x: 0.72, y: 2.05, w: 11.9, rowH: 0.66,
    autoPage: false, fontFace: bodyFont, fontSize: headers.length > 4 ? 15 : 16,
    margin: [0.10, 0.15, 0.10, 0.15], valign: "middle",
    border: { type: "solid", color: theme.line, pt: 0.65 },
  });
}

function addContentSlide(pptx, deck, content, example, index) {
  const slide = pptx.addSlide({ masterName: "APT" });
  addText(slide, content.title, {
    x: 0.7, y: 0.9, w: 11.9, h: 0.6, fontFace: titleFont, fontSize: 32, bold: true,
  });
  addText(slide, content.guidance, {
    x: 0.73, y: 1.57, w: 11.88, h: 0.33, fontSize: 16, color: theme.muted,
  });
  if (content.headers) addTable(slide, content, example);
  else addNotes(slide, content.rows, example);

  addText(slide, example ? `${deck.customer} · Fictional worked example` : deck.title, {
    x: 0.73, y: 7.03, w: 9.9, h: 0.22, fontSize: 11, color: theme.muted,
  });
  addText(slide, String(index + 2), {
    x: 11.9, y: 7.03, w: 0.69, h: 0.22, align: "right", fontSize: 11, color: theme.muted,
  });
}

async function writeTemplate(pptx, filename) {
  const zip = await JSZip.loadAsync(await pptx.write({ outputType: "nodebuffer" }));
  const manifestPath = "[Content_Types].xml";
  const manifest = await zip.file(manifestPath).async("string");
  // PptxGenJS 4.0.1 lists slide masters it did not write.
  zip.file(manifestPath, manifest.replace(/<Override\b[^>]*PartName="\/([^"]+)"[^>]*\/>/g, (entry, part) =>
    zip.file(part) ? entry : "",
  ));

  // Its tables and shapes also draw from separate ID sequences on the same slide.
  for (const part of zip.file(/^ppt\/slides\/slide\d+\.xml$/)) {
    const xml = await part.async("string");
    const shapeId = /(<p:cNvPr\s+id=")(\d+)"/g;
    let nextId = Math.max(0, ...Array.from(xml.matchAll(shapeId), (match) => Number(match[2])));
    const seen = new Set();
    zip.file(part.name, xml.replace(shapeId, (match, prefix, rawId) => {
      const id = Number(rawId);
      if (seen.has(id)) return `${prefix}${++nextId}"`;
      seen.add(id);
      return match;
    }));
  }

  const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await fs.promises.writeFile(path.join(outDir, filename), output);
}

async function generateDeck(deck, example = false) {
  const pptx = new PptxGenJS();
  const filename = example ? deck.file.replace("-template.pptx", "-example.pptx") : deck.file;
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Account Planning Tools";
  pptx.subject = deck.summary;
  pptx.title = example ? deck.exampleTitle : deck.title;
  pptx.lang = "en-GB";
  pptx.theme = { headFontFace: titleFont, bodyFontFace: bodyFont, lang: "en-GB" };
  pptx.defineSlideMaster({
    title: "APT",
    background: { color: theme.white },
    objects: [
      { rect: { x: 0, y: 0, w: 13.333, h: 0.11, line: { color: theme.accent }, fill: { color: theme.accent } } },
      { image: { path: logoPath, altText: "APT logo", x: 0.71, y: 0.32, w: 1.23, h: 0.38 } },
    ],
  });

  addCover(pptx, deck, example);
  deck.slides.forEach((content, index) => addContentSlide(pptx, deck, content, example, index));

  await writeTemplate(pptx, filename);
  console.log(`Generated ${filename}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const deck of decks) {
    await generateDeck(deck);
    if (deck.customer) await generateDeck(deck, true);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
