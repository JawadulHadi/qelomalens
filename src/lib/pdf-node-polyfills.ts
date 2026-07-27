/**
 * pdf-parse v2 pulls in pdfjs-dist's Node "legacy" build, which references
 * a few browser Canvas globals (DOMMatrix, ImageData, Path2D) at module
 * load time for its optional rendering code paths. Without them it throws
 * a ReferenceError before any code runs — even for plain text extraction,
 * which never touches these classes. Stubbing them with empty shims is
 * enough to get past module init; installing the real native canvas
 * package just for text extraction isn't worth the added bundle weight.
 *
 * Must be imported (for its side effect) before anything that imports
 * 'pdf-parse'.
 */
function definePolyfill(name: string, ctor: new (...args: any[]) => any) {
  if (typeof (globalThis as any)[name] === 'undefined') {
    (globalThis as any)[name] = ctor;
  }
}

definePolyfill('DOMMatrix', class DOMMatrix {});
definePolyfill('ImageData', class ImageData {});
definePolyfill('Path2D', class Path2D {});
