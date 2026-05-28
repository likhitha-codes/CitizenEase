/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

/**
 * Splits document text into complete standalone sentences, aware of English punctuation,
 * Hindi Devanagari danda (।), Telugu characters, and newlines.
 * Solves the bug where narration either skips sentences or reads them incorrectly.
 */
export function splitTextIntoSentences(text: string): string[] {
  if (!text) return [];

  // Remove markdown headers/formatting symbols to speak only raw readable text cleanly
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
    .replace(/-\s+/g, ''); // Remove list dashes

  // Match sentences ending in . ! ? or Hindi danda (।), or split on substantial newlines
  const regex = /([^.!?।\n\r]+[.!?।]?)/gu;
  const matches = cleanText.match(regex);

  if (!matches) {
    return [cleanText];
  }

  return matches
    .map(match => match.trim())
    .filter(sentence => sentence.length > 1); // Avoid lone punctuation marks
}

/**
 * Download a document as a structurally formatted .txt file.
 * Perfect for Telugu and Hindi complex script formats as it guarantees no glyph omissions.
 */
export function downloadAsTxt(
  title: string,
  content: string,
  language: string,
  category: string
) {
  const dateStr = new Date().toLocaleString();
  const textHeader = 
`=========================================
      DOCUEASE CITIZEN SERVICE REPORT
=========================================
Document:    ${title}
Category:    ${category}
Language:    ${language}
Generated:   ${dateStr}
Organization: National Informatics Centre (NIC) Style
-----------------------------------------
Official Simplified Content:
-----------------------------------------

${content}

-----------------------------------------
Generated via DocuEase
"Simplifying Government Documents for Every Citizen"
=========================================`;

  const blob = new Blob([textHeader], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DocuEase_Report_${title.replace(/\s+/g, '_')}_${language}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Formats and downloads an English document as a beautiful, trustworthy government-style PDF.
 */
export function downloadAsPDF(
  title: string,
  content: string,
  category: string,
  language: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let cursorY = 25;

  // Draw background border
  doc.setDrawColor(0, 51, 102); // Primary Navy #003366
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Draw Banner/Header Background
  doc.setFillColor(245, 247, 250); // Background #F5F7FA
  doc.rect(11, 11, pageWidth - 22, 28, 'F');
  doc.setDrawColor(214, 220, 229); // Border Gray #D6DCE5
  doc.line(11, 39, pageWidth - 11, 39);

  // Header Title
  doc.setTextColor(0, 51, 102); // Primary Navy
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DOCUEASE CITIZEN SERVICE REPORT', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 120, 135);
  doc.text('Ministry of Electronics & IT • Government of India Style Portal', pageWidth / 2, 28, { align: 'center' });
  doc.text('Simplified Accessibility Service', pageWidth / 2, 33, { align: 'center' });

  // Document Metadata Section
  cursorY = 50;
  doc.setTextColor(31, 41, 55); // Text Dark
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DOCUMENT SUMMARY DETAILS', margin, cursorY);
  
  cursorY += 8;
  doc.setDrawColor(216, 220, 225);
  doc.line(margin, cursorY - 4, pageWidth - margin, cursorY - 4);

  // Meta Table fields
  doc.setFont('Helvetica', 'bold');
  doc.text('Document Title:', margin, cursorY);
  doc.setFont('Helvetica', 'normal');
  doc.text(title.length > 60 ? title.substring(0, 57) + '...' : title, margin + 40, cursorY);

  cursorY += 6;
  doc.setFont('Helvetica', 'bold');
  doc.text('Category:', margin, cursorY);
  doc.setFont('Helvetica', 'normal');
  doc.text(category, margin + 40, cursorY);

  cursorY += 6;
  doc.setFont('Helvetica', 'bold');
  doc.text('Language Scope:', margin, cursorY);
  doc.setFont('Helvetica', 'normal');
  doc.text(language, margin + 40, cursorY);

  cursorY += 6;
  doc.setFont('Helvetica', 'bold');
  doc.text('Generated At:', margin, cursorY);
  doc.setFont('Helvetica', 'normal');
  doc.text(new Date().toLocaleString(), margin + 40, cursorY);

  cursorY += 12;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY - 4, pageWidth - margin, cursorY - 4);

  // Content Text Rendering
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text('SIMPLIFIED CITIZEN REPORT CONTENT', margin, cursorY);
  cursorY += 8;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);

  // Remove markdown tags for PDF rendering to keep clean lay representation
  const plainContent = content
    .replace(/[#*`_~]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .split('\n');

  plainContent.forEach((line) => {
    if (cursorY > pageHeight - 30) {
      doc.addPage();
      // Draw border on new page
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(1);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      cursorY = 25;
    }

    if (line.trim().length === 0) {
      cursorY += 4;
      return;
    }

    // Split overly long line into text blocks fitting the page structure width
    const splitLines = doc.splitTextToSize(line, pageWidth - (margin * 2));
    splitLines.forEach((splitLine: string) => {
      if (cursorY > pageHeight - 30) {
        doc.addPage();
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(1);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
        cursorY = 25;
      }
      doc.text(splitLine, margin, cursorY);
      cursorY += 6;
    });
  });

  // Footer stamp and watermark
  const footerY = pageHeight - 15;
  doc.setDrawColor(214, 220, 229);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('WATERMARK: Generated via DocuEase', margin, footerY);
  doc.text('National Informatics Centre (NIC) Aesthetic Portal Service', pageWidth - margin, footerY, { align: 'right' });

  doc.save(`DocuEase_Report_${title.replace(/\s+/g, '_')}_English.pdf`);
}
