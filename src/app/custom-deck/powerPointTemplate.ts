import type JSZip from "jszip";
import { waterfallPlot } from "./qbrBenchmark.mjs";

const presentationNamespace = "http://schemas.openxmlformats.org/presentationml/2006/main";
const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
const tableGraphicUri = "http://schemas.openxmlformats.org/drawingml/2006/table";
const officeRelationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageRelationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";
const contentTypeNamespace = "http://schemas.openxmlformats.org/package/2006/content-types";
const presentationPath = "ppt/presentation.xml";
const contentTypesPath = "[Content_Types].xml";
export const powerPointMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const slidePurposes = ["title", "divider", "content"] as const;
export type SlidePurpose = typeof slidePurposes[number];
export type SlideContent = {
  title: string;
  lines: string[];
  purpose: SlidePurpose;
  table?: { headers: string[]; widths: number[]; rows: string[][] };
  chart?: { label: string; value: number; display: string }[];
  waterfall?: {
    changes: { label: string; value: number; display: string; evidence: string }[];
    total: { label: string; value: number; display: string };
    caption: string;
  };
};
export type LayoutChoices = Record<SlidePurpose, string>;
type SlideDesign = {
  backgroundColor: string;
  textColor: string;
  headFontFace: string;
  bodyFontFace: string;
  accentColor?: string;
};
type Relationship = { id: string; kind: string; target: string; external: boolean };
type Box = [left: number, top: number, width: number, height: number];
type SourceSlide = { path: string; layout: string; links: Relationship[]; document: Document | null };
type TemplateLayout = { path: string; document: Document | null; master: Document | null };
type Candidate = { id: string; label: string; source?: SourceSlide; layout: TemplateLayout; scores: Record<SlidePurpose, number> };
export type LayoutPreview = {
  id: string;
  label: string;
  background?: string;
  title: Box;
  body?: Box;
};
export type LayoutReview = {
  options: Record<SlidePurpose, LayoutPreview[]>;
  choices: LayoutChoices;
  uncertain: SlidePurpose[];
  aspectRatio: number;
};

function relationshipPath(part: string) {
  const slash = part.lastIndexOf("/");
  return part.slice(0, slash + 1) + "_rels/" + part.slice(slash + 1) + ".rels";
}

function resolveTarget(part: string, target: string) {
  const segments = target.startsWith("/") ? [] : part.split("/").slice(0, -1);
  for (const segment of target.split("/")) {
    if (segment === "..") segments.pop();
    else if (segment && segment !== ".") segments.push(segment);
  }
  return segments.join("/");
}

async function readXml(zip: JSZip, path: string) {
  const text = await zip.file(path)?.async("string");
  if (!text) return null;
  const document = new DOMParser().parseFromString(text, "application/xml");
  if (document.getElementsByTagNameNS("*", "parsererror").length) {
    throw new Error("The template contains an unreadable PowerPoint part.");
  }
  return document;
}

function relationships(document: Document | null): Relationship[] {
  return Array.from(document?.documentElement.children ?? [], (element) => ({
    id: element.getAttribute("Id") ?? "",
    kind: element.getAttribute("Type") ?? "",
    target: element.getAttribute("Target") ?? "",
    external: element.getAttribute("TargetMode") === "External",
  }));
}

function isRelationship(relationship: Relationship, kind: string) {
  return relationship.kind === officeRelationshipNamespace + "/" + kind && !relationship.external;
}

function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeRelationships(zip: JSZip, part: string, links: Relationship[]) {
  const entries = links.map(({ id, kind, target, external }) =>
    `<Relationship Id="${xml(id)}" Type="${xml(kind)}" Target="${xml(target)}"${external ? ' TargetMode="External"' : ""}/>`,
  );
  zip.file(relationshipPath(part), `<Relationships xmlns="${packageRelationshipNamespace}">${entries.join("")}</Relationships>`);
}

function drawingBox(id: number, name: string, width: number, height: number, bounds: Box, fill: string, text: string) {
  const [left, top, boxWidth, boxHeight] = bounds;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="${Math.round(width * left)}" y="${Math.round(height * top)}"/>
    <a:ext cx="${Math.round(width * boxWidth)}" cy="${Math.round(height * boxHeight)}"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` : "<a:noFill/>"}</p:spPr>${text}</p:sp>`;
}

function textBody(lines: string[], font: string, color: string, size: number, bold = false, centered = false) {
  const paragraphs = lines.flatMap((line) => line.split(/\r?\n/)).map((line) =>
    `<a:p><a:pPr${centered ? ' algn="ctr"' : ""}><a:spcAft><a:spcPts val="${bold ? 0 : 450}"/></a:spcAft></a:pPr><a:r>
    <a:rPr lang="en-GB" sz="${size}"${bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${xml(font)}"/></a:rPr>
    <a:t xml:space="preserve">${xml(line)}</a:t></a:r></a:p>`,
  );
  return `<p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paragraphs.join("") || "<a:p/>"}</p:txBody>`;
}

function luminance(color: string) {
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function readableColor(background: string, preferred: string) {
  const bg = luminance(background);
  const fg = luminance(preferred);
  if ((Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05) >= 4.5) return preferred;
  return bg > 0.179 ? "000000" : "FFFFFF";
}

function slideVisual(content: SlideContent, bounds: Box, width: number, height: number, design: SlideDesign) {
  const [x, y, w, h] = bounds;
  const accent = design.accentColor ?? "0F766E";
  const scale = Math.max(.42, Math.min(1, height / 6858000, width / 9144000));
  const pt = (value: number) => Math.round(value * scale * 100);
  if (content.table) {
    const { headers, widths, rows } = content.table;
    const rowHeight = Math.round(height * h / (rows.length + 1));
    let allocatedWidth = 0;
    const grid = widths.map((fraction, index) => {
      const cellsWidth = index === 0 ? 1 - widths.slice(1).reduce((sum, value) => sum + value, 0) : fraction;
      const column = index === widths.length - 1 ? Math.round(width * w) - allocatedWidth : Math.round(width * w * cellsWidth);
      allocatedWidth += column;
      return `<a:gridCol w="${column}"/>`;
    }).join("");
    const tableRows = [headers, ...rows].map((row, rowIndex) => {
      const fill = rowIndex === 0 ? accent : rowIndex % 2 ? "E8F4F1" : "FFFFFF";
      const color = readableColor(fill, rowIndex === 0 ? "FFFFFF" : "152C2C");
      const cells = row.map((value) => {
        const text = textBody([value], design.bodyFontFace, color, pt(headers.length > 4 ? 14 : 15), rowIndex === 0)
          .replaceAll("p:txBody", "a:txBody");
        return `<a:tc>${text}<a:tcPr marL="85000" marR="85000" marT="20000" marB="20000" anchor="ctr"><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></a:tcPr></a:tc>`;
      }).join("");
      return `<a:tr h="${rowHeight}">${cells}</a:tr>`;
    }).join("");
    return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="10000" name="Editable table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>
      <p:xfrm><a:off x="${Math.round(width * x)}" y="${Math.round(height * y)}"/><a:ext cx="${Math.round(width * w)}" cy="${rowHeight * (rows.length + 1)}"/></p:xfrm>
      <a:graphic><a:graphicData uri="${tableGraphicUri}"><a:tbl><a:tblPr/><a:tblGrid>${grid}</a:tblGrid>${tableRows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  }
  if (content.waterfall) {
    const { changes, total, caption } = content.waterfall;
    const plot = waterfallPlot(changes, total);
    const plotTop = y + h * .13;
    const plotHeight = h * .87;
    const label = (id: number, text: string, box: Box, font: number, bold = false, centered = false) => drawingBox(
      id, "Waterfall label", width, height, box, "", textBody([text], design.bodyFontFace, design.textColor, pt(font), bold, centered),
    );
    const line = (id: number, left: number, top: number, span: number) => drawingBox(
      id, "Waterfall connector", width, height, [x + w * left, plotTop + plotHeight * top, w * span, .0012], "829891", "",
    );
    return label(10000, caption, [x, y, w, h * .11], 16, true) + line(10001, 0, plot.zero, 1)
      + plot.bars.map((bar, index) => {
        const id = 10002 + index * 4;
        const left = x + w * index * bar.slot;
        return drawingBox(id, "Editable waterfall bar", width, height, [
          x + w * bar.left, plotTop + plotHeight * bar.top, w * bar.width, plotHeight * bar.height,
        ], bar.total ? "1C4540" : bar.value < 0 ? "AC5235" : accent, "")
          + (bar.total ? "" : line(id + 1, bar.left + bar.width, bar.endLine, bar.slot - bar.width))
          + label(id + 2, bar.display, [left, plotTop + plotHeight * (bar.top - .11), w * bar.slot, plotHeight * .105], 17, true, true)
          + label(id + 3, bar.label, [left, plotTop + plotHeight * .83, w * bar.slot, plotHeight * .17], 15, false, true);
      }).join("");
  }
  if (!content.chart?.length) return "";
  const chart = content.chart;
  const magnitude = Math.max(...chart.map(({ value }) => Math.abs(value)));
  if (!Number.isFinite(magnitude) || magnitude <= 0) return "";
  const rowHeight = h / chart.length;
  const zero = x + w * .60;
  const baseline = drawingBox(10000, "Zero line", width, height, [zero - .0006, y, .0012, h], "93A7AB", "");
  return baseline + chart.map((point, index) => {
    const top = y + rowHeight * (index + .23);
    const barWidth = w * .23 * Math.abs(point.value) / magnitude;
    const id = 10001 + index * 3;
    const label = textBody([point.label], design.bodyFontFace, design.textColor, pt(15));
    const value = textBody([point.display], design.bodyFontFace, design.textColor, pt(15), true);
    return drawingBox(id, "Measure", width, height, [x, top, w * .34, rowHeight * .7], "", label)
      + drawingBox(id + 1, "Variance", width, height, [x + w * .85, top, w * .15, rowHeight * .7], "", value)
      + (barWidth ? drawingBox(id + 2, "Editable variance bar", width, height, [point.value < 0 ? zero - barWidth : zero, top, barWidth, rowHeight * .43], point.value < 0 ? "AC5235" : accent, "") : "");
  }).join("");
}

export async function addDeckVisuals(output: Blob, contents: SlideContent[], design: SlideDesign) {
  if (!contents.some(({ table, chart, waterfall }) => table || chart || waterfall)) return output;
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await output.arrayBuffer());
  for (const [index, content] of contents.entries()) {
    if (!content.table && !content.chart && !content.waterfall) continue;
    const path = `ppt/slides/slide${index + 1}.xml`;
    const slide = await zip.file(path)?.async("string");
    if (!slide) throw new Error("Could not add editable visuals to the deck.");
    const shapes = slideVisual(content, [.054, .22, .892, .63], 12192000, 6858000, design);
    zip.file(path, slide.replace("</p:spTree>", shapes + "</p:spTree>"));
  }
  return zip.generateAsync({ type: "blob", mimeType: powerPointMimeType, compression: "DEFLATE" });
}

function slideArtwork(document: Document | null) {
  const common = document?.getElementsByTagNameNS(presentationNamespace, "cSld")[0];
  const background = Array.from(common?.children ?? []).find((element) => element.localName === "bg");
  const tree = Array.from(common?.children ?? []).find((element) => element.localName === "spTree");
  const logos = Array.from(tree?.children ?? []).filter((element) => {
    if (element.localName !== "pic") return false;
    const properties = element.getElementsByTagNameNS(presentationNamespace, "cNvPr")[0];
    return ["name", "descr", "title"].some((attribute) => /\blogo\b/i.test(properties?.getAttribute(attribute) ?? ""));
  });
  return { background, logos };
}

function shapes(document?: Document | null) {
  return Array.from(document?.getElementsByTagNameNS(presentationNamespace, "sp") ?? []);
}

function placeholderType(shape: Element) {
  const placeholder = shape.getElementsByTagNameNS(presentationNamespace, "ph")[0];
  return placeholder ? placeholder.getAttribute("type") ?? "obj" : null;
}

function shapeBox(shape: Element, width: number, height: number): Box | undefined {
  const transform = shape.getElementsByTagNameNS(drawingNamespace, "xfrm")[0];
  const offset = transform?.getElementsByTagNameNS(drawingNamespace, "off")[0];
  const extent = transform?.getElementsByTagNameNS(drawingNamespace, "ext")[0];
  if (!offset || !extent) return;
  const left = Number(offset.getAttribute("x")) / width;
  const top = Number(offset.getAttribute("y")) / height;
  const boxWidth = Number(extent.getAttribute("cx")) / width;
  const boxHeight = Number(extent.getAttribute("cy")) / height;
  if (left >= 0 && top >= 0 && boxWidth >= .15 && boxHeight >= .035 && left + boxWidth <= 1 && top + boxHeight <= 1) {
    return [left, top, boxWidth, boxHeight];
  }
}

function placeholderBox(documents: (Document | null | undefined)[], types: string[], width: number, height: number) {
  for (const document of documents) {
    for (const type of types) {
      for (const shape of shapes(document)) {
        if (placeholderType(shape) !== type) continue;
        const box = shapeBox(shape, width, height);
        if (box) return box;
      }
    }
  }
}

function shapeText(shape: Element) {
  return Array.from(shape.getElementsByTagNameNS(drawingNamespace, "t"), (element) => element.textContent ?? "").join(" ").trim();
}

function commonSlideName(document?: Document | null) {
  return document?.getElementsByTagNameNS(presentationNamespace, "cSld")[0]?.getAttribute("name")?.trim() ?? "";
}

function namedPurpose(name: string): SlidePurpose | undefined {
  const words = name.toLowerCase().replace(/[_-]+/g, " ");
  if (/\b(?:(?:sub ?section|section|chapter) (?:header|heading|divider|break|title)|divider)\b/.test(words)) return "divider";
  if (/^(?:cover|title)$|\b(?:cover (?:page|slide|layout)|title slide)\b/.test(words)) return "title";
  if (/^(?:content|body)$|\b(?:title and content|content (?:slide|layout)|body (?:slide|layout))\b/.test(words)) return "content";
}

function scoreLayout(document: Document | null) {
  const scores = { title: 0, divider: 0, content: 0 };
  const purpose = namedPurpose(commonSlideName(document)) ?? namedPurpose(document?.documentElement.getAttribute("matchingName") ?? "");
  const type = document?.documentElement.getAttribute("type");
  const placeholders = new Set(shapes(document).map(placeholderType));
  if (type === "title" || (placeholders.has("ctrTitle") && placeholders.has("subTitle"))) scores.title = 90;
  if (type === "secHead") scores.divider = 90;
  if (type === "obj" || type === "tx") scores.content = 90;
  if (placeholders.has("title") && (placeholders.has("obj") || placeholders.has("body"))) scores.content ||= 62;
  if (type === "titleOnly" || placeholders.has("ctrTitle")) scores.divider ||= 30;
  if (purpose) scores[purpose] = 100;
  return scores;
}

function sourceTextShapes(document?: Document | null) {
  return shapes(document).filter((shape) => shapeText(shape) && !["dt", "ftr", "hdr", "sldNum"].includes(placeholderType(shape) ?? ""));
}

function solidBackground(...documents: (Document | null | undefined)[]) {
  const design = documents.map((document) => slideArtwork(document ?? null).background).find(Boolean);
  const color = design?.getElementsByTagNameNS(drawingNamespace, "solidFill")[0]
    ?.getElementsByTagNameNS(drawingNamespace, "srgbClr")[0]?.getAttribute("val");
  return color && /^[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

function slideBoxes(candidate: Candidate, purpose: SlidePurpose, width: number, height: number) {
  const { source, layout } = candidate;
  const documents = [source?.document, layout.document];
  const activePlaceholders = new Set(documents.flatMap(shapes).map(placeholderType));
  const boundsFor = (types: string[]) => placeholderBox(documents, types, width, height)
    ?? placeholderBox([layout.master], types.filter((type) => activePlaceholders.has(type)), width, height);
  const title = boundsFor(["title", "ctrTitle"]);
  const body = boundsFor(purpose === "title" ? ["subTitle", "body", "obj"] : ["body", "obj"]);
  const examples = sourceTextShapes(source?.document).flatMap((shape) => {
    const box = shapeBox(shape, width, height);
    return box && box[1] < .85 ? [box] : [];
  }).sort((a, b) => a[1] - b[1]);
  // Example text boxes supply geometry when a deck was built on a blank layout.
  const sampleTitle = examples.find((box) => box[2] >= .28 && box[3] >= .06);
  const titleBounds = title ?? sampleTitle;
  const minimumBodyHeight = purpose === "title" ? .10 : .23;
  const bodyBounds = body ?? examples.find((box) => titleBounds && box[1] >= titleBounds[1] + titleBounds[3] - .005 && box[3] >= minimumBodyHeight);
  if (purpose === "divider") {
    return { title: titleBounds ?? [.10, .37, .80, .22] as Box, panel: false };
  }
  if (titleBounds && bodyBounds && bodyBounds[3] >= minimumBodyHeight
    && titleBounds[1] + titleBounds[3] <= bodyBounds[1] + .005) {
    return { title: titleBounds, body: bodyBounds, panel: false };
  }
  if (purpose === "title" && titleBounds) {
    const below = titleBounds[1] + titleBounds[3] + .03;
    if (below <= .79) return { title: titleBounds, body: [titleBounds[0], below, titleBounds[2], .93 - below] as Box, panel: false };
  }
  return { title: [.07, .19, .86, .14] as Box, body: [.07, .36, .86, .52] as Box, panel: true };
}

async function keepReferencedParts(zip: JSZip) {
  const reachable = new Set([contentTypesPath]);
  const visited = new Set<string>();
  async function visit(part: string) {
    if (visited.has(part)) return;
    visited.add(part);
    if (part) {
      if (!zip.file(part)) throw new Error("The template is missing a required PowerPoint part.");
      reachable.add(part);
    }
    const linksPath = relationshipPath(part);
    const links = await readXml(zip, linksPath);
    if (!links) return;
    reachable.add(linksPath);
    await Promise.all(relationships(links).filter((link) => !link.external)
      .map((link) => visit(resolveTarget(part, link.target))));
  }
  await visit("");
  Object.values(zip.files).forEach((entry) => {
    if (!entry.dir && !reachable.has(entry.name)) zip.remove(entry.name);
  });
  return reachable;
}

async function readTemplate(file: File) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const [presentation, presentationRels, contentTypes] = await Promise.all([
    readXml(zip, presentationPath),
    readXml(zip, relationshipPath(presentationPath)),
    readXml(zip, contentTypesPath),
  ]);
  const root = presentation?.documentElement;
  const size = presentation?.getElementsByTagNameNS(presentationNamespace, "sldSz")[0];
  const width = Number(size?.getAttribute("cx"));
  const height = Number(size?.getAttribute("cy"));
  if (!presentation || !root || !size || !contentTypes || !presentationRels
    || !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error("The template has no supported PowerPoint slide size.");
  }
  const previousLinks = relationships(presentationRels);
  const designLinks = previousLinks.filter((link) => ["slideMaster", "theme", "font", "tableStyles"].some((kind) => isRelationship(link, kind)));
  const sourceList = presentation.getElementsByTagNameNS(presentationNamespace, "sldIdLst")[0];
  const sources = await Promise.all(Array.from(sourceList?.children ?? [], async (element) => {
    const link = previousLinks.find((item) => item.id === element.getAttributeNS(officeRelationshipNamespace, "id") && isRelationship(item, "slide"));
    if (!link) return null;
    const path = resolveTarget(presentationPath, link.target);
    const links = relationships(await readXml(zip, relationshipPath(path)));
    const layout = links.find((item) => isRelationship(item, "slideLayout"));
    return layout ? { path, layout: resolveTarget(path, layout.target), links, document: await readXml(zip, path) } : null;
  }));
  const masters = designLinks.filter((link) => isRelationship(link, "slideMaster"));
  const layouts = (await Promise.all(masters.map(async (master) => {
    const path = resolveTarget(presentationPath, master.target);
    const [document, rels] = await Promise.all([readXml(zip, path), readXml(zip, relationshipPath(path))]);
    return Promise.all(relationships(rels).filter((link) => isRelationship(link, "slideLayout")).map(async (link) => {
      const layout = resolveTarget(path, link.target);
      return { path: layout, document: await readXml(zip, layout), master: document };
    }));
  }))).flat();
  if (!layouts.length) throw new Error("The template does not have a usable PowerPoint layout.");

  const candidates = layouts.flatMap((layout, layoutIndex): Candidate[] => {
    const scores = scoreLayout(layout.document);
    const label = commonSlideName(layout.document) || layout.document?.documentElement.getAttribute("matchingName") || `Layout ${layoutIndex + 1}`;
    const examples = sources.flatMap((source, sourceIndex) => {
      if (!source || source.layout !== layout.path) return [];
      const textShapes = sourceTextShapes(source.document);
      const title = textShapes.find((shape) => ["title", "ctrTitle"].includes(placeholderType(shape) ?? "")) ?? textShapes[0];
      const slideName = commonSlideName(source.document);
      const name = slideName && !/^slide\s*\d*$/i.test(slideName) ? slideName : (title ? shapeText(title) : "");
      const purpose = namedPurpose(name);
      const sampleScores = { ...scores };
      if (purpose) sampleScores[purpose] = Math.max(sampleScores[purpose], 104);
      if (!Math.max(...Object.values(sampleScores))) {
        const largeText = textShapes.some((shape) => (shapeBox(shape, width, height)?.[3] ?? 0) >= .27 && shapeText(shape).length >= 32);
        if (textShapes.length >= 3 || largeText) sampleScores.content = 45;
        else if (textShapes.length === 2) sampleScores.title = 42;
        else if (textShapes.length === 1) sampleScores.divider = 40;
      }
      return [{
        id: source.path, label: `Slide ${sourceIndex + 1} · ${name.slice(0, 65) || label}`, source, layout, scores: sampleScores,
      }];
    });
    // A named master layout is one choice even when several slides use it. Retain a representative
    // example for slide-specific branding, and keep separately named examples when they imply another role.
    if (examples.length && Math.max(...Object.values(scores)) >= 60) {
      const namedExamples = examples.filter((example) => slidePurposes.some((purpose) => example.scores[purpose] > 100 && scores[purpose] < 60));
      const representative = examples.find((example) => !namedExamples.includes(example) && (
        slideArtwork(example.source.document).background || slideArtwork(example.source.document).logos.length
      )) ?? examples.find((example) => !namedExamples.includes(example));
      return [{ id: layout.path, label, layout, source: representative?.source, scores: Object.fromEntries(
        slidePurposes.map((purpose) => [purpose, scores[purpose] && scores[purpose] + (representative ? 5 : 0)]),
      ) as Candidate["scores"] }, ...namedExamples];
    }
    return examples.length ? examples : [{ id: layout.path, label, scores, layout }];
  });
  return { zip, presentation, root, sourceList, contentTypes, size, width, height, designLinks, candidates };
}

export async function inspectPowerPointTemplate(file: File): Promise<LayoutReview> {
  const { candidates, width, height } = await readTemplate(file);
  const options = {} as LayoutReview["options"];
  const choices = {} as LayoutChoices;
  const uncertain: SlidePurpose[] = [];
  for (const purpose of slidePurposes) {
    const ranked = [...candidates].sort((a, b) => b.scores[purpose] - a.scores[purpose]);
    const [best, second] = ranked;
    const score = best.scores[purpose];
    choices[purpose] = purpose === "divider" && score < 35 ? "" : best.id;
    if (score < 85 || score - (second?.scores[purpose] ?? 0) < 10) uncertain.push(purpose);
    options[purpose] = ranked.map((candidate) => {
      const boxes = slideBoxes(candidate, purpose, width, height);
      return {
        id: candidate.id,
        label: candidate.label,
        background: solidBackground(candidate.source?.document, candidate.layout.document, candidate.layout.master),
        title: boxes.title,
        body: boxes.body,
      };
    });
  }
  return { options, choices, uncertain, aspectRatio: width / height };
}

export async function applyPowerPointTemplate(file: File, contents: SlideContent[], design: SlideDesign, choices: LayoutChoices) {
  const { zip, presentation, root, sourceList, contentTypes, size, width, height, designLinks, candidates } = await readTemplate(file);
  const serializer = new XMLSerializer();
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  // Export a new set of slides. Keep the original design parts reachable through their relationships.
  const slideList = presentation.createElementNS(presentationNamespace, "p:sldIdLst");
  if (sourceList) sourceList.replaceWith(slideList);
  else root.insertBefore(slideList, size);
  for (const element of Array.from(root.children)) {
    if (["notesMasterIdLst", "handoutMasterIdLst", "custShowLst", "extLst"].includes(element.localName)) element.remove();
  }

  const slidePaths = contents.map((_, index) => `ppt/slides/aptGenerated${index + 1}.xml`);
  for (const [index, part] of slidePaths.entries()) {
    const content = contents[index];
    const candidate = byId.get(choices[content.purpose]);
    if (!candidate) throw new Error("Choose a valid template layout for each slide purpose.");
    const { source, layout } = candidate;
    // Artwork references are rewritten per generated slide, so use a fresh copy each time.
    const document = source?.document?.cloneNode(true) as Document | undefined;
    const { background, logos } = slideArtwork(document ?? null);
    const links: Relationship[] = [{
      id: "rId1", kind: officeRelationshipNamespace + "/slideLayout", target: "/" + layout.path, external: false,
    }];
    // Only carry over slide-level artwork identified as a logo, plus the original background.
    const copyArtwork = (element: Element | undefined) => {
      if (!element) return "";
      for (const node of [element, ...Array.from(element.getElementsByTagName("*"))]) {
        for (const attribute of Array.from(node.attributes)) {
          if (attribute.namespaceURI !== officeRelationshipNamespace) continue;
          const image = source?.links.find((link) => link.id === attribute.value && isRelationship(link, "image"));
          if (!source || !image) {
            if (attribute.localName === "embed" || attribute.localName === "link") return "";
            node.removeAttributeNode(attribute);
            continue;
          }
          const target = "/" + resolveTarget(source.path, image.target);
          let link = links.find((item) => item.target === target);
          if (!link) {
            link = { ...image, target, id: `rId${links.length + 1}` };
            links.push(link);
          }
          attribute.value = link.id;
        }
      }
      return serializer.serializeToString(element);
    };
    const retainedBackground = copyArtwork(background);
    const retainedLogos = logos.map((logo, logoIndex) => {
      logo.getElementsByTagNameNS(presentationNamespace, "cNvPr")[0]?.setAttribute("id", String(logoIndex + 10));
      return copyArtwork(logo);
    }).join("");
    const backgroundColor = solidBackground(document, layout.document, layout.master) ?? design.backgroundColor;
    const textColor = readableColor(backgroundColor, design.textColor);
    const textScale = Math.max(.4, Math.min(1, height / 6858000, width / 9144000));
    const title = textBody([content.title], design.headFontFace, textColor, Math.round(2900 * textScale), true);
    const body = textBody(content.lines, design.bodyFontFace, textColor, Math.round(1800 * textScale));
    const naturalBoxes = slideBoxes(candidate, content.purpose, width, height);
    const hasVisual = Boolean(content.table || content.chart || content.waterfall);
    const boxes = hasVisual && (!naturalBoxes.body || naturalBoxes.body[3] < .40)
      ? { title: [.07, .13, .86, .13] as Box, body: [.07, .32, .86, .55] as Box, panel: false }
      : naturalBoxes;
    const panel = boxes.panel ? drawingBox(2, "Content background", width, height, [.04, .15, .92, .77], backgroundColor, "") : "";
    const titleBox = drawingBox(3, "Title", width, height, boxes.title, "", title);
    const bodyBox = boxes.body ? hasVisual
      ? slideVisual(content, boxes.body, width, height, { ...design, textColor })
      : drawingBox(4, "Content", width, height, boxes.body, "", body) : "";
    const showMasterShapes = document?.documentElement.getAttribute("showMasterSp") === "0" ? ' showMasterSp="0"' : "";
    const roleName = { title: "Title slide", divider: "Section divider", content: "Content slide" }[content.purpose];
    zip.file(part, `<p:sld xmlns:p="${presentationNamespace}" xmlns:a="${drawingNamespace}"${showMasterShapes}><p:cSld name="${roleName}">${retainedBackground}
      <p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
      ${retainedLogos}${panel}${titleBox}${bodyBox}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
    writeRelationships(zip, part, links);
    let id = `aptSlide${index + 1}`;
    while (designLinks.some((link) => link.id === id)) id += "_";
    designLinks.push({ id, kind: officeRelationshipNamespace + "/slide", target: "/" + part, external: false });
    const slideId = presentation.createElementNS(presentationNamespace, "p:sldId");
    slideId.setAttribute("id", String(256 + index));
    slideId.setAttributeNS(officeRelationshipNamespace, "r:id", id);
    slideList.append(slideId);
  }

  zip.file(presentationPath, serializer.serializeToString(presentation));
  writeRelationships(zip, presentationPath, designLinks);
  writeRelationships(zip, "", [{ id: "rId1", kind: officeRelationshipNamespace + "/officeDocument", target: presentationPath, external: false }]);
  const reachable = await keepReferencedParts(zip);
  for (const entry of Array.from(contentTypes.documentElement.children)) {
    const name = entry.getAttribute("PartName")?.slice(1);
    if (name && (!reachable.has(name) || slidePaths.includes(name))) entry.remove();
    if (name === presentationPath) entry.setAttribute("ContentType", powerPointMimeType + ".main+xml");
  }
  for (const part of slidePaths) {
    const override = contentTypes.createElementNS(contentTypeNamespace, "Override");
    override.setAttribute("PartName", "/" + part);
    override.setAttribute("ContentType", "application/vnd.openxmlformats-officedocument.presentationml.slide+xml");
    contentTypes.documentElement.append(override);
  }
  zip.file(contentTypesPath, serializer.serializeToString(contentTypes));
  return zip.generateAsync({ type: "blob", mimeType: powerPointMimeType, compression: "DEFLATE" });
}
