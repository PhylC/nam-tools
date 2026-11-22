import { describe, expect, it } from "vitest";
import { readableBackgroundText, resolveBackgroundColors } from "./powerPointBackground";

function element(localName: string, attributes: Record<string, string> = {}, children: Element[] = []): Element {
  return {
    localName, children, firstElementChild: children[0] ?? null,
    getAttribute: (name: string) => attributes[name] ?? null,
    getElementsByTagNameNS: (_namespace: string, name: string) => children.flatMap(
      (child) => [...(child.localName === name ? [child] : []), ...Array.from(child.getElementsByTagNameNS("", name))],
    ),
  } as unknown as Element;
}

const asDocument = (children: Element[]) => element("document", {}, children) as unknown as Document;
const scheme = (val: string, transforms: Element[] = []) => element("schemeClr", { val }, transforms);
const rgb = (val: string) => element("srgbClr", { val });
const transform = (name: string, val: number) => element(name, { val: String(val) });
const bg = (fill: Element) => element("bg", {}, [element("bgPr", {}, [fill])]);
const dark = [
  transform("shade", 69000), transform("hueMod", 108000), transform("satMod", 164000), transform("lumMod", 74000),
];
const light = [
  transform("tint", 96000), transform("hueMod", 88000), transform("satMod", 140000), transform("lumMod", 132000),
];
const duotone = (base: string) => element("blipFill", {}, [
  element("blip", {}, [element("duotone", {}, [scheme(base, dark), scheme(base, light)])]),
]);
const master = asDocument([element("clrMap", { bg2: "dk2" })]);
const theme = asDocument([
  element("clrScheme", {}, [element("dk2", {}, [rgb("1E5155")]), element("lt2", {}, [rgb("EBEBEB")])]),
  element("bgFillStyleLst", {}, [element("solidFill"), element("gradFill"), duotone("phClr")]),
]);

describe("PowerPoint template backgrounds", () => {
  it("selects white over both tones of the saved template cover", () => {
    const colors = resolveBackgroundColors(bg(duotone("bg2")), master, theme);
    expect(colors).toHaveLength(2);
    expect(readableBackgroundText(colors, "16202A")).toBe("FFFFFF");
  });

  it("uses the referenced theme fill and master color map for section dividers", () => {
    const divider = element("bg", {}, [element("bgRef", { idx: "1003" }, [scheme("bg2")])]);
    const colors = resolveBackgroundColors(divider, master, theme);
    expect(colors).toEqual(resolveBackgroundColors(bg(duotone("bg2")), master, theme));
    expect(readableBackgroundText(colors, "16202A")).toBe("FFFFFF");
  });

  it("keeps dark heading text over light fills", () => {
    const colors = resolveBackgroundColors(bg(element("gradFill", {}, [
      element("gsLst", {}, [element("gs", {}, [rgb("F1F4F3")]), element("gs", {}, [rgb("CAD4D2")])]),
    ])), master, theme);
    expect(readableBackgroundText(colors, "16202A")).toBe("16202A");
  });
});
