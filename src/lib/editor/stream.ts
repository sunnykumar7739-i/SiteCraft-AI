/** Reads a streaming text response, calling onChunk with the accumulated text (throttled). */
export async function readTextStream(
  res: Response,
  onUpdate: (accumulated: string) => void,
  throttleMs = 150,
): Promise<string> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    last = Date.now();
    onUpdate(acc);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    const now = Date.now();
    if (now - last >= throttleMs) {
      if (timer) clearTimeout(timer);
      timer = null;
      flush();
    } else if (!timer) {
      timer = setTimeout(flush, throttleMs);
    }
  }
  if (timer) clearTimeout(timer);
  flush();

  const errMatch = /<!-- SITECRAFT_ERROR: (.*?) -->/.exec(acc);
  if (errMatch) throw new Error(errMatch[1]);
  return acc;
}

export function cleanHtmlClient(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
  const idx = s.search(/<!doctype html/i);
  if (idx > 0) s = s.slice(idx);
  return s;
}

export function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
