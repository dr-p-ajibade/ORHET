import jsPDF from 'jspdf';
import { SearchResult } from '../types';

/**
 * Format standard APA Citation for a research article
 */
export function formatAPACitation(article: SearchResult): string {
  const authorStr = article.authors && article.authors.length > 0
    ? article.authors.join(', ')
    : 'Unknown Author';
  const yearStr = article.year ? `(${article.year})` : '(n.d.)';
  const titleStr = article.title.endsWith('.') ? article.title : `${article.title}.`;
  const journalStr = article.journal ? `${article.journal}.` : '';
  const doiStr = article.doi ? ` https://doi.org/${article.doi.replace('https://doi.org/', '')}` : '';

  return `${authorStr} ${yearStr}. ${titleStr} ${journalStr}${doiStr}`.trim();
}

/**
 * Cleanly split and wrap text across PDF page boundaries
 */
function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxY = 275
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;

  for (let i = 0; i < lines.length; i++) {
    if (currentY > maxY) {
      doc.addPage();
      currentY = 22;
      // Header for new page
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('ARHET Repository — Scholarly Research Archive', x, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
    }
    doc.text(lines[i], x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Export a single research article as an academic brief PDF
 */
export function exportArticleToPDF(article: SearchResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  // Header Banner
  doc.setFillColor(249, 115, 22); // Orange primary
  doc.rect(margin, y, 4, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text('ARHET SCHOLARLY ARCHIVE', margin + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text('Higher Education Transformation & Open Science Document Brief', margin + 8, y + 12);
  doc.text(`Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 8, y + 17);

  y += 28;

  // Horizontal divider
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Article Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  y = addWrappedText(doc, article.title, margin, y, contentWidth, 6.5);
  y += 4;

  // Authors
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(194, 65, 12); // Rust/Orange tone
  const authorsText = article.authors?.length > 0 ? article.authors.join(' • ') : 'Author not specified';
  y = addWrappedText(doc, authorsText, margin, y, contentWidth, 5);
  y += 4;

  // Metadata Box (Year, Source, Journal, DOI)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PUBLICATION YEAR', margin + 4, y + 6);
  doc.text('DATABASE NODE', margin + 40, y + 6);
  doc.text('SOURCE / JOURNAL', margin + 85, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(article.year || 'N/A', margin + 4, y + 12);
  doc.text(article.source || 'OpenAlex', margin + 40, y + 12);
  
  const journalTrimmed = article.journal ? (article.journal.length > 50 ? article.journal.substring(0, 48) + '...' : article.journal) : 'Scholarly Repository';
  doc.setFont('helvetica', 'normal');
  doc.text(journalTrimmed, margin + 85, y + 12);

  // DOI line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DOI / PERSISTENT IDENTIFIER:', margin + 4, y + 19);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text(article.doi || 'No DOI indexed', margin + 55, y + 19);

  y += 32;

  // Section: Abstract
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ABSTRACT & SCHOLARLY SUMMARY', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const abstractText = article.abstract || 'No abstract text available for this indexed record.';
  y = addWrappedText(doc, abstractText, margin, y, contentWidth, 5.2);
  y += 8;

  // Section: Formal Academic Citation (APA 7th)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RECOMMENDED CITATION (APA 7th Edition)', margin, y);
  y += 6;

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  const citationText = formatAPACitation(article);
  const citLines = doc.splitTextToSize(citationText, contentWidth - 8);
  const citBoxHeight = Math.max(citLines.length * 5 + 6, 16);

  doc.roundedRect(margin, y, contentWidth, citBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(citLines, margin + 4, y + 6);
  y += citBoxHeight + 8;

  // Direct Link
  if (article.url) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(194, 65, 12);
    doc.text('FULL TEXT REPOSITORY ACCESS:', margin, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    const urlTrimmed = article.url.length > 75 ? article.url.substring(0, 72) + '...' : article.url;
    doc.text(urlTrimmed, margin, y + 5);
    y += 12;
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.4);
    doc.line(margin, 282, margin + contentWidth, 282);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('ARHET — Academic Research & Higher Education Transformation', margin, 287);
    doc.text(`Page ${i} of ${pageCount}`, margin + contentWidth - 18, 287);
  }

  // Sanitize filename
  const cleanTitle = (article.title || 'research_article')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 40);
  doc.save(`${cleanTitle}_arhet.pdf`);
}

/**
 * Export a list/bibliography of research articles as an executive PDF digest
 */
export function exportArticleListToPDF(
  articles: SearchResult[],
  title = 'ARHET Scholarly Research Bibliography',
  filterDescription = ''
) {
  if (articles.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Cover / Header Bar
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y, 4, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text('ARHET RESEARCH BIBLIOGRAPHY', margin + 7, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(title, margin + 7, y + 11);
  doc.text(
    `Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • Total Articles: ${articles.length}`,
    margin + 7,
    y + 16
  );

  y += 26;

  // Filter note if present
  if (filterDescription) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Active Filter / Search Term: "${filterDescription}"`, margin + 4, y + 6);
    y += 15;
  }

  // Articles loop
  articles.forEach((art, index) => {
    // Check if new page is needed for next item
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Article index pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(194, 65, 12);
    doc.text(`[RECORD #${index + 1}] • ${art.source.toUpperCase()} • ${art.year || 'N/A'}`, margin + 3, y + 4.2);
    y += 9;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    y = addWrappedText(doc, art.title, margin, y, contentWidth, 5);
    y += 2;

    // Authors & Journal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const authorLine = (art.authors?.length > 0 ? art.authors.join(', ') : 'Unknown Author') +
      (art.journal ? ` — ${art.journal}` : '');
    y = addWrappedText(doc, authorLine, margin, y, contentWidth, 4.2);
    y += 2;

    // DOI / Link
    if (art.doi) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`DOI: https://doi.org/${art.doi.replace('https://doi.org/', '')}`, margin, y);
      y += 4;
    }

    // Abstract snippet
    if (art.abstract) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const snippet = art.abstract.length > 220 ? art.abstract.slice(0, 217) + '...' : art.abstract;
      y = addWrappedText(doc, snippet, margin, y, contentWidth, 3.8);
      y += 2;
    }

    // Subtle divider
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.4);
    doc.line(margin, 282, margin + contentWidth, 282);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('ARHET — Academic Research & Higher Education Transformation Repository', margin, 287);
    doc.text(`Page ${i} of ${pageCount}`, margin + contentWidth - 18, 287);
  }

  doc.save(`arhet_research_bibliography_${new Date().toISOString().slice(0, 10)}.pdf`);
}
