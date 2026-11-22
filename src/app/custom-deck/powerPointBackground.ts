const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
const presentationNamespace = "http://schemas.openxmlformats.org/presentationml/2006/main";
const defaultColorMap: Record<string, string> = { bg1: "lt1", bg2: "lt2", tx1: "dk1", tx2: "dk2" };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const hexColor = (value?: string | null) => value && /^[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : undefined;
const rgb = (color: string) => [0, 2, 4].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255);
const hex = (channels: number[]) => channels.map((channel) => Math.round(clamp(channel) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

function relativeLuminance(color: string) {
  const [red, green, blue] = rgb(color).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return red * .2126 + green * .7152 + blue * .0722;
}

export function readableBackgroundText(backgrounds: string[], preferred: string) {
  const contrast = (first: number, second: number) => (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
  const luminances = backgrounds.map(relativeLuminance);
  const worst = (color: string) => Math.min(...luminances.map((background) => contrast(background, relativeLuminance(color))));
  if (worst(preferred) >= 4.5) return preferred;
  return worst("000000") >= worst("FFFFFF") ? "000000" : "FFFFFF";
}

function applyColorTransforms(base: string, elements: Element[]): string {
  let channels = rgb(base);
  for (const element of elements) {
    const raw = element.getAttribute("val");
    if (!raw) continue;
    const amount = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw) / 100000;
    if (!Number.isFinite(amount)) continue;
    if (element.localName === "tint") channels = channels.map((value) => value * amount + 1 - amount);
    if (element.localName === "shade") channels = channels.map((value) => value * amount);
    if (!["hueMod", "satMod", "lumMod", "lumOff"].includes(element.localName)) continue;
    const [red, green, blue] = channels;
    const max = Math.max(...channels);
    const min = Math.min(...channels);
    const delta = max - min;
    let light = (max + min) / 2;
    let saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
    let hue = !delta ? 0 : max === red ? (green - blue) / delta : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
    hue = (hue + 6) % 6;
    if (element.localName === "hueMod") hue = hue * amount % 6;
    if (element.localName === "satMod") saturation = clamp(saturation * amount);
    if (element.localName === "lumMod") light = clamp(light * amount);
    if (element.localName === "lumOff") light = clamp(light + amount);
    const amplitude = Math.min(light, 1 - light) * saturation;
    channels = [0, 8, 4].map((shift) => {
      const position = (hue * 2 + shift) % 12;
      return light - amplitude * Math.max(-1, Math.min(position - 3, 9 - position, 1));
    });
  }
  return hex(channels);
}

export function resolveBackgroundColors(background: Element | undefined, master: Document | null, theme: Document | null) {
  const scheme = theme?.getElementsByTagNameNS(drawingNamespace, "clrScheme")[0];
  const map = master?.getElementsByTagNameNS(presentationNamespace, "clrMap")[0];
  const color = (element?: Element, placeholder?: string): string | undefined => {
    const name = element?.getAttribute("val");
    let base = element?.localName === "srgbClr" ? hexColor(name) : hexColor(element?.getAttribute("lastClr"));
    if (element?.localName === "schemeClr" && name) {
      const entry = map?.getAttribute(name) || defaultColorMap[name] || name;
      base = name === "phClr" ? placeholder : color(Array.from(scheme?.children ?? []).find((item) => item.localName === entry)?.firstElementChild ?? undefined);
    }
    return base && element ? applyColorTransforms(base, Array.from(element.children)) : base;
  };

  const style = background?.firstElementChild;
  if (!style) return [];
  const index = Number(style.getAttribute("idx"));
  const ref = style.localName === "bgRef";
  const styleList = ref && index > 0 && index !== 1000
    ? theme?.getElementsByTagNameNS(drawingNamespace, index > 1000 ? "bgFillStyleLst" : "fillStyleLst")[0]
    : undefined;
  const fill = ref ? styleList?.children[index > 1000 ? index - 1001 : index - 1] : style.firstElementChild;
  const placeholder = ref ? color(style.firstElementChild ?? undefined) : undefined;
  let stops: (Element | null)[] = [];
  if (fill?.localName === "solidFill") stops = [fill.firstElementChild];
  if (fill?.localName === "gradFill") stops = Array.from(fill.getElementsByTagNameNS(drawingNamespace, "gs"), (stop) => stop.firstElementChild);
  if (fill?.localName === "blipFill") stops = Array.from(fill.getElementsByTagNameNS(drawingNamespace, "duotone")[0]?.children ?? []);
  const colors = stops.map((stop) => color(stop ?? undefined, placeholder));
  return colors.every((value) => value !== undefined) ? colors : [];
}
