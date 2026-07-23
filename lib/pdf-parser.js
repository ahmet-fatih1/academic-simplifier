const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CHARS = 50000;

export async function extractTextFromPdf(file) {
  if (!file || file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDF file is too large. Maximum size is 10 MB.");
  }

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  pdf.destroy();

  const trimmed = fullText.trim();

  if (!trimmed) {
    throw new Error(
      "No text found in this PDF. It may be a scanned image-only document."
    );
  }

  if (trimmed.length > MAX_CHARS) {
    throw new Error(
      `PDF text is too long (${trimmed.length} characters). Maximum is ${MAX_CHARS} characters. Please upload a shorter document.`
    );
  }

  return trimmed;
}
