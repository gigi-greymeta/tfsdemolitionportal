import jsPDF from "jspdf";
import QRCode from "qrcode";

interface SignatureEntry {
  name: string;
  signatureData: string | null;
  signedAt: string;
}

interface DocumentPDFData {
  documentId: string;
  title: string;
  documentType: string;
  version: string | null;
  projectName: string;
  projectNumber: string | null;
  description: string | null;
  signatures: SignatureEntry[];
  baseUrl: string;
}

export async function generateDocumentPDF(data: DocumentPDFData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DOCUMENT SIGN-ON SHEET", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Document Info Box
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - margin * 2, 45, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, pageWidth - margin * 2, 45, "S");

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Document Title:", margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin + 40, yPos);

  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Type:", margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.documentType}${data.version ? ` (v${data.version})` : ""}`, margin + 40, yPos);

  yPos += 8;
  doc.setTextColor(100, 100, 100);
  doc.text("Project:", margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.projectName}${data.projectNumber ? ` (${data.projectNumber})` : ""}`, margin + 40, yPos);

  yPos += 8;
  doc.setTextColor(100, 100, 100);
  doc.text("Generated:", margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  doc.text(new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }), margin + 40, yPos);

  yPos += 20;

  // QR Code section
  const qrUrl = `${data.baseUrl}/document-sign?doc=${data.documentId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 100,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // QR Code Box
    const qrBoxWidth = 60;
    const qrBoxX = pageWidth - margin - qrBoxWidth;
    doc.setFillColor(255, 255, 255);
    doc.rect(qrBoxX, yPos, qrBoxWidth, 70, "FD");

    doc.addImage(qrDataUrl, "PNG", qrBoxX + 5, yPos + 5, 50, 50);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Scan to sign", qrBoxX + qrBoxWidth / 2, yPos + 62, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Signatures Table Header
  const tableStartY = yPos;
  const colWidths = {
    name: 50,
    signature: 50,
    date: 40,
  };
  const tableWidth = colWidths.name + colWidths.signature + colWidths.date;
  const rowHeight = 25;
  const headerHeight = 10;

  doc.setFillColor(30, 30, 30);
  doc.rect(margin, tableStartY, tableWidth, headerHeight, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Name", margin + 5, tableStartY + 7);
  doc.text("Signature", margin + colWidths.name + 5, tableStartY + 7);
  doc.text("Date Signed", margin + colWidths.name + colWidths.signature + 5, tableStartY + 7);

  yPos = tableStartY + headerHeight;

  // Signature Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  if (data.signatures.length === 0) {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos, tableWidth, rowHeight, "FD");
    doc.setTextColor(150, 150, 150);
    doc.text("No signatures yet", margin + tableWidth / 2, yPos + rowHeight / 2 + 3, { align: "center" });
    yPos += rowHeight;
  } else {
    for (let i = 0; i < data.signatures.length; i++) {
      const sig = data.signatures[i];

      // Check if we need a new page
      if (yPos + rowHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;

        // Re-draw header on new page
        doc.setFillColor(30, 30, 30);
        doc.rect(margin, yPos, tableWidth, headerHeight, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Name", margin + 5, yPos + 7);
        doc.text("Signature", margin + colWidths.name + 5, yPos + 7);
        doc.text("Date Signed", margin + colWidths.name + colWidths.signature + 5, yPos + 7);
        yPos += headerHeight;
      }

      // Row background (alternating)
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248);
      doc.rect(margin, yPos, tableWidth, rowHeight, "FD");

      // Name
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(sig.name, margin + 5, yPos + rowHeight / 2 + 3);

      // Signature Image
      if (sig.signatureData && sig.signatureData.startsWith("data:image")) {
        try {
          doc.addImage(
            sig.signatureData,
            "PNG",
            margin + colWidths.name + 2,
            yPos + 2,
            colWidths.signature - 4,
            rowHeight - 4
          );
        } catch {
          doc.text("[signature]", margin + colWidths.name + 5, yPos + rowHeight / 2 + 3);
        }
      } else {
        doc.text("[signed]", margin + colWidths.name + 5, yPos + rowHeight / 2 + 3);
      }

      // Date
      const signedDate = new Date(sig.signedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      doc.text(signedDate, margin + colWidths.name + colWidths.signature + 5, yPos + rowHeight / 2 + 3);

      yPos += rowHeight;
    }
  }

  // Draw table border
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, tableStartY + headerHeight, tableWidth, yPos - tableStartY - headerHeight, "S");

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Total Signatures: ${data.signatures.length}`,
    margin,
    pageHeight - 10
  );
  doc.text(
    "Generated via TFS Site Safety System",
    pageWidth - margin,
    pageHeight - 10,
    { align: "right" }
  );

  return doc.output("blob");
}
