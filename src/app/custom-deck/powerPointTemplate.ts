import type JSZip from "jszip";

const presentationNamespace = "http://schemas.openxmlformats.org/presentationml/2006/main";
const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
const officeRelationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageRelationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";
const contentTypeNamespace = "http://schemas.openxmlformats.org/package/2006/content-types";
const presentationPath = "ppt/presentation.xml";
const contentTypesPath = "[Content_Types].xml";
export const powerPointMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

type SlideContent = { title: string; lines: string[] };
type SlideDesign = {
  backgroundColor: string;
  textColor: string;
  headFontFace: string;
  bodyFontFace: string;
};
type Relationship = { id: string; kind: string; target: string; external: boolean };
type Box = [left: number, top: number, width: number, height: number];

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

function textBody(lines: string[], font: string, color: string, size: number, bold = false) {
  const paragraphs = lines.flatMap((line) => line.split(/\r?\n/)).map((line) =>
    `<a:p><a:pPr><a:spcAft><a:spcPts val="${bold ? 0 : 450}"/></a:spcAft></a:pPr><a:r>
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

function placeholderBox(documents: (Document | null)[], types: string[], width: number, height: number): Box | null {
  for (const document of documents) {
    for (const shape of Array.from(document?.getElementsByTagNameNS(presentationNamespace, "sp") ?? [])) {
      const placeholder = shape.getElementsByTagNameNS(presentationNamespace, "ph")[0];
      if (!placeholder || !types.includes(placeholder.getAttribute("type") ?? "obj")) continue;
      const transform = shape.getElementsByTagNameNS(drawingNamespace, "xfrm")[0];
      const offset = transform?.getElementsByTagNameNS(drawingNamespace, "off")[0];
      const extent = transform?.getElementsByTagNameNS(drawingNamespace, "ext")[0];
      if (!offset || !extent) continue;
      const left = Number(offset.getAttribute("x")) / width;
      const top = Number(offset.getAttribute("y")) / height;
      const boxWidth = Number(extent.getAttribute("cx")) / width;
      const boxHeight = Number(extent.getAttribute("cy")) / height;
      if (left >= 0 && top >= 0 && boxWidth >= .35 && boxHeight >= .08 && left + boxWidth <= 1 && top + boxHeight <= 1) {
        return [left, top, boxWidth, boxHeight];
      }
    }
  }
  return null;
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

export async function applyPowerPointTemplate(file: File, contents: SlideContent[], design: SlideDesign) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const serializer = new XMLSerializer();
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
    return layout ? { path, layout: resolveTarget(path, layout.target), links } : null;
  }));
  const masters = designLinks.filter((link) => isRelationship(link, "slideMaster"));
  const masterDocuments = new Map<string, Document | null>();
  const layouts = (await Promise.all(masters.map(async (master) => {
    const path = resolveTarget(presentationPath, master.target);
    const [document, rels] = await Promise.all([readXml(zip, path), readXml(zip, relationshipPath(path))]);
    return Promise.all(relationships(rels).filter((link) => isRelationship(link, "slideLayout")).map(async (link) => {
      const layout = resolveTarget(path, link.target);
      masterDocuments.set(layout, document);
      return { path: layout, document: await readXml(zip, layout) };
    }));
  }))).flat();
  const layoutDocuments = new Map(layouts.map(({ path, document }) => [path, document]));
  const brandedLayout = layouts.find(({ document }) => document?.getElementsByTagNameNS(presentationNamespace, "pic").length)
    ?? layouts.find(({ document }) => slideArtwork(document).background);
  const coverLayout = layouts.find(({ document }) => document?.documentElement.getAttribute("type") === "title") ?? brandedLayout ?? layouts[0];
  const bodyLayout = layouts.find(({ document }) => ["obj", "tx"].includes(document?.documentElement.getAttribute("type") ?? "")) ?? brandedLayout ?? coverLayout;
  if (!coverLayout || !bodyLayout) throw new Error("The template does not have a usable PowerPoint layout.");

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
    const source = sources[index] ?? (index ? sources[1] ?? sources[0] : sources[0]);
    const document = source ? await readXml(zip, source.path) : null;
    const layout = source?.layout ?? (index ? bodyLayout.path : coverLayout.path);
    const { background, logos } = slideArtwork(document);
    const links: Relationship[] = [{
      id: "rId1", kind: officeRelationshipNamespace + "/slideLayout", target: "/" + layout, external: false,
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
    const layoutDocument = layoutDocuments.get(layout) ?? null;
    const masterDocument = masterDocuments.get(layout) ?? null;
    const designBackground = background ?? slideArtwork(layoutDocument).background ?? slideArtwork(masterDocument).background;
    const solidFill = designBackground?.getElementsByTagNameNS(drawingNamespace, "solidFill")[0];
    const sourceColor = solidFill?.getElementsByTagNameNS(drawingNamespace, "srgbClr")[0]?.getAttribute("val");
    const backgroundColor = sourceColor && /^[0-9a-f]{6}$/i.test(sourceColor) ? sourceColor : design.backgroundColor;
    const textColor = readableColor(backgroundColor, design.textColor);
    const textScale = Math.max(.4, Math.min(1, height / 6858000, width / 9144000));
    const title = textBody([content.title], design.headFontFace, textColor, Math.round(2900 * textScale), true);
    const body = textBody(content.lines, design.bodyFontFace, textColor, Math.round(1800 * textScale));
    const layoutSources = [document, layoutDocument, masterDocument];
    const titleBounds = placeholderBox(layoutSources, ["title", "ctrTitle"], width, height);
    const bodyBounds = placeholderBox(layoutSources, index ? ["body", "obj"] : ["subTitle", "body", "obj"], width, height);
    const usePlaceholders = titleBounds && bodyBounds && bodyBounds[3] >= (index ? .30 : .14)
      && titleBounds[1] + titleBounds[3] <= bodyBounds[1];
    const panel = usePlaceholders ? "" : drawingBox(2, "Content background", width, height, [.04, .15, .92, .77], backgroundColor, "");
    const textFill = usePlaceholders ? backgroundColor : "";
    const titleBox = drawingBox(3, "Title", width, height, usePlaceholders ? titleBounds : [.07, .19, .86, .14], textFill, title);
    const bodyBox = drawingBox(4, "Content", width, height, usePlaceholders ? bodyBounds : [.07, .36, .86, .52], textFill, body);
    const showMasterShapes = document?.documentElement.getAttribute("showMasterSp") === "0" ? ' showMasterSp="0"' : "";
    zip.file(part, `<p:sld xmlns:p="${presentationNamespace}" xmlns:a="${drawingNamespace}"${showMasterShapes}><p:cSld>${retainedBackground}
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
