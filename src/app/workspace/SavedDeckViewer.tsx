import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { downloadGeneratedDeck } from "../../lib/storageUploads";

type DeckFile = { storagePath: string; filename: string };
type SlideImage = { url: string; description: string };
type Preview = { count: number; render: (index: number) => SlideImage };

async function loadPreview({ storagePath, filename }: DeckFile): Promise<Preview> {
  const [result, pptx, renderer] = await Promise.all([
    downloadGeneratedDeck(storagePath, filename),
    import("@office-kit/pptx"),
    import("@office-kit/pptx-preview"),
  ]);
  if (!result.file) throw new Error(result.error ?? "Could not retrieve the saved presentation.");
  const presentation = await pptx.loadPresentation(new Uint8Array(await result.file.arrayBuffer()));
  const slides = pptx.getSlides(presentation);
  if (!slides.length) throw new Error("This PowerPoint file has no slides to display.");

  return {
    count: slides.length,
    render(index) {
      const slide = slides[index];
      const description = (pptx.getSlideTitle(slide) || pptx.getSlideText(slide)).split("\n")[0].trim();
      const svg = renderer.renderSlideToSvg(presentation, slide, {
        textLayout: "svg",
        resolveFamily(family) {
          const substitute = renderer.substituteFamily(family);
          if (substitute === renderer.MONO) return "Courier New";
          if (substitute === renderer.TIMES || substitute === renderer.SERIF) return "Times New Roman";
          return "Arial";
        },
      });
      // An SVG image displays the slide without adding its markup to the Workspace document.
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      return { url, description };
    },
  };
}

export function SavedDeckViewer({ title, file, draftHref, isDownloading, onDownload, onClose }: {
  title: string;
  file: DeckFile | null;
  draftHref: string;
  isDownloading: boolean;
  onDownload: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const stageId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [page, setPage] = useState<SlideImage | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const storagePath = file?.storagePath;
  const filename = file?.filename;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    if (!storagePath || !filename) return;
    let closed = false;
    loadPreview({ storagePath, filename }).then((loaded) => {
      if (closed) return;
      setPreview(loaded);
      setPage(loaded.render(0));
    }).catch((failure: unknown) => {
      if (closed) return;
      setError(failure instanceof Error ? failure.message : "Could not render the saved presentation.");
    });
    return () => { closed = true; };
  }, [storagePath, filename]);

  const imageUrl = page?.url;
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  function move(offset: number) {
    if (!preview) return;
    const index = slideIndex + offset;
    if (index < 0 || index >= preview.count) return;
    setSlideIndex(index);
    stage.current?.scrollTo(0, 0);
    try {
      setPage(preview.render(index));
      setError("");
    } catch {
      setPage(null);
      setError("This slide could not be displayed. You can download the original PowerPoint.");
    }
  }

  const zoomed = Boolean(page && zoom > 1);

  return (
    <dialog ref={dialog} className="workspace-deck-viewer" aria-labelledby={headingId} onClose={onClose}>
      <div className="workspace-deck-viewer-inner">
        <header className="workspace-deck-viewer-header">
          <h2 id={headingId}>{title}</h2>
          <button className="button button-secondary button-small" type="button" onClick={() => dialog.current?.close()}>Close</button>
        </header>
        {file ? (
          <>
            {page ? (
              <div className="workspace-deck-viewer-zoom" role="group" aria-label="Slide zoom">
                <button className="button button-secondary button-small" type="button" aria-label="Zoom out" aria-controls={stageId}
                  disabled={zoom === 1} onClick={() => setZoom(zoom - 1)}>−</button>
                <button className="button button-secondary button-small" type="button" aria-label="Fit slide to window" aria-controls={stageId}
                  aria-pressed={!zoomed} onClick={() => setZoom(1)}>Fit</button>
                <button className="button button-secondary button-small" type="button" aria-label="Zoom in" aria-controls={stageId}
                  disabled={zoom === 3} onClick={() => setZoom(zoom + 1)}>+</button>
                <span role="status">{zoomed ? `${zoom}× · Scroll to pan` : "Fit to window"}</span>
              </div>
            ) : null}
            <div ref={stage} id={stageId} role={zoomed ? "region" : undefined} aria-label={zoomed ? "Zoomed slide preview" : undefined}
              tabIndex={zoomed ? 0 : undefined} aria-busy={!page && !error}
              className={`workspace-deck-viewer-stage${page ? " workspace-deck-viewer-stage-ready" : ""}${zoomed ? " workspace-deck-viewer-stage-zoomed" : ""}`}>
              {page ? (
                /* eslint-disable-next-line @next/next/no-img-element -- The slide is a temporary browser-generated image. */
                <img
                  src={page.url}
                  style={zoomed ? { width: `${zoom * 100}%` } : undefined}
                  alt={page.description ? `Slide ${slideIndex + 1}. ${page.description}` : `Slide ${slideIndex + 1}`}
                  onError={() => setError("This slide could not be displayed. You can download the original PowerPoint.")}
                />
              ) : !error ? <p role="status">Loading saved presentation…</p> : null}
              {error ? <p role="alert">{error}</p> : null}
            </div>
          </>
        ) : <p>Only the brief is saved. Use “Create new from this” to generate a PowerPoint file.</p>}
        <footer className="workspace-deck-viewer-footer">
          {preview ? (
            <nav className="workspace-deck-viewer-controls" aria-label="Slide navigation">
              <button className="button button-secondary button-small" disabled={slideIndex === 0} onClick={() => move(-1)} type="button">Previous</button>
              <span role="status">Slide {slideIndex + 1} of {preview.count}</span>
              <button className="button button-secondary button-small" disabled={slideIndex === preview.count - 1} onClick={() => move(1)} type="button">Next</button>
            </nav>
          ) : null}
          <div className="workspace-deck-viewer-actions">
            {file ? (
              <button className="button button-secondary button-small" disabled={isDownloading} onClick={onDownload} type="button">
                {isDownloading ? "Downloading…" : "Download PowerPoint"}
              </button>
            ) : null}
            <Link className="button button-secondary button-small" href={draftHref}>Create new from this</Link>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
