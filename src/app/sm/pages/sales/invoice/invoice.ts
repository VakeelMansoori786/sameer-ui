import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule, Location } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonService } from '@/app/sm/services/common-service';
@Component({
    selector: 'app-invoice',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './invoice.html',
    styleUrl: './invoice.scss'
})
export class Invoice {
     constructor(private location: Location,private route: ActivatedRoute,private saleService:SaleService,private router:Router,private commonService: CommonService){}
      companyDetail=companyDetail
 id=signal<string>('0');
 mainList = signal<any>({});
 ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id.set(atob(routeId));
 this.getSale();
    }
 }
 
getSale() {
    this.saleService.getOne(this.id()).subscribe((data: any) => {
      this.mainList.set(data);
     
    });
}
    print() {
  window.print();
}
goBack() {
    this.location.back();
  }
report(type: string) {
  const data: any = this.mainList();
  if (!data) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  // Check payment status once, reuse everywhere
  const isPaid = (data.sale[0].status || '').toString().toLowerCase() === 'paid';

  // ================= HEADER =================
  const drawHeader = () => {
    let yOffset = 15;

    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, yOffset, 20, 20);
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text(`${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`, 40, yOffset + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(this.companyDetail.address, 40, yOffset + 7);
    doc.text(`Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`, 40, yOffset + 11);
    doc.text(`TRN:  ${this.companyDetail.trn}  Email: ${this.companyDetail.email}`, 40, yOffset + 15);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(15, yOffset + 20, pageWidth - 15, yOffset + 20);

    return yOffset + 25;
  };

  // ================= FOOTER =================
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(9);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
  };

  // ================= STAMP (rendered via canvas so Arabic shapes correctly) =================
  const buildStampImage = (): string => {
    const scale = 4; // higher = sharper in PDF
    const w = 400 * scale;
    const h = 220 * scale;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // rotate around center, like a stamp
    ctx.translate(w / 2, h / 2);
    ctx.rotate((-1 * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    // outer border
    ctx.strokeStyle = '#0057b8';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(10 * scale, 10 * scale, w - 20 * scale, h - 20 * scale);

    ctx.fillStyle = '#0057b8';
    ctx.textAlign = 'center';

    // PAID
    ctx.font = `bold ${34 * scale}px Arial`;
    ctx.fillText('PAID', w / 2, 55 * scale);

    // Arabic lines (canvas handles RTL shaping natively)
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.direction = 'rtl';
    ctx.fillText('مدفوع', w / 2, 90 * scale);
    ctx.fillText('سمير محمد لتجارة مواد البناء ذ.م.م', w / 2, 112 * scale);

    // English company name
    ctx.direction = 'ltr';
    ctx.font = `bold ${13 * scale}px Arial`;
    ctx.fillText('SAMEER MOHAMMED', w / 2, 138 * scale);
    ctx.fillText('BUILDING MATERIALS TRADING L.L.C', w / 2, 156 * scale);

    // Date, red
    ctx.fillStyle = 'red';
    ctx.font = `bold ${13 * scale}px Arial`;
    ctx.fillText(`DATE: ${data.sale[0].sale_date?.split('T')[0] || ''}`, w / 2, 182 * scale);

    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  const drawStamp = (centerX: number, centerY: number) => {
    const stampDataUrl = buildStampImage();
    const boxW = 48;
    const boxH = 26;
    const x = centerX - boxW / 2;
    const y = centerY - boxH / 2;
    doc.addImage(stampDataUrl, 'PNG', x, y, boxW, boxH);
  };

  let yStart = drawHeader();

  // ================= TITLE =================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, yStart, { align: 'center' });
  yStart += 6;

  // ================= CUSTOMER =================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const custAddress = doc.splitTextToSize(data.sale[0].address || '', 90);

  doc.text(`Name: ${data.sale[0].customer_name}`, 15, yStart);
  doc.text(`Phone: ${data.sale[0].phone}`, 15, yStart + 4);
  doc.text(custAddress, 15, yStart + 8);
  doc.text(`TRN: ${data.sale[0].trn || '-'}`, 15, yStart + 8 + (custAddress.length * 5));

const invoiceNo = data.sale[0].invoice_no;
const lpoNo = data.sale[0].lpo_no;

doc.text(`Invoice No: ${invoiceNo}`, pageWidth - 70, yStart);

let invoiceInfoY = yStart + 4;

if (lpoNo !== null && lpoNo !== undefined && lpoNo.toString().trim() !== '') {
  doc.text(`LPO No: ${lpoNo}`, pageWidth - 70, invoiceInfoY);
  invoiceInfoY += 4;
}

doc.text(
  `Date: ${data.sale[0].sale_date?.split('T')[0]}`,
  pageWidth - 70,
  invoiceInfoY
);;

  yStart += 16 + (custAddress.length * 3);

  // ================= TABLE =================
  const tableColumns = ['#', 'Description', 'Unit', 'Qty', 'Rate', 'Sub Total', 'VAT 5%', 'VAT Amt', 'Total Amt'];

  const tableRows = data.sale_detail.map((item: any, i: number) => ([
    i + 1,
    item.product,
    item.unit,
    Number(item.qty || 0),
    parseFloat(item.price || 0).toFixed(2),
    parseFloat(item.total || 0).toFixed(2),
   '5%',
    (parseFloat(item.price)*1.05).toFixed(2),
    (parseFloat(item.total)*1.05).toFixed(2),
  ]));

  autoTable(doc, {
    startY: yStart,
    head: [tableColumns],
    body: tableRows,

    theme: 'grid',

    styles: {
      fontSize: 8,
      cellPadding: 1.2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      minCellHeight: 5
    },

    headStyles: {
      fillColor: [200, 200, 200],
      fontStyle: 'bold',
      cellPadding: 1.2,
      minCellHeight: 5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },

    bodyStyles: {
      cellPadding: 1.2,
      minCellHeight: 5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },

    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },

    columnStyles: {
      // OPTIONAL: force smaller width per column
      // 0: { cellWidth: 20 },
      // 1: { cellWidth: 30 },
    },

    margin: { left: 15, right: 15, top: 40 },
    showHead: 'everyPage',

    didDrawPage: (dataArg: any) => {
      drawHeader();
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      drawFooter(pageNum, doc.getNumberOfPages());
      dataArg.settings.margin.top = 35;
    }
  });

  // ================= SAFE POSITION =================
  let finalY = (doc as any).lastAutoTable?.finalY || yStart + 10;
  let safeY = finalY + 8;

  // ================= PAGE BREAK =================
  if (safeY + 50 > pageHeight) {
    doc.addPage();
    drawHeader();
    safeY = 40;
  }

  const labelX = pageWidth - 70;
  const valueX = pageWidth - 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // ================= TOTALS (DYNAMIC) =================
  let y = safeY + 5;

  const subTotal = parseFloat(data.sale[0].total || 0);
  const discount = parseFloat(data.sale[0].discount || 0);
  const vatAmount = parseFloat(data.sale[0].vat || 0);
  const grandTotal = parseFloat(data.sale[0].grand_total || 0);

  // Subtotal
  doc.text('Sub Total', labelX, y);
  doc.text(subTotal.toFixed(2) + ' AED', valueX, y, { align: 'right' });
  y += 5;

  // Discount (only if > 0)
  if (discount > 0) {
    doc.text('Discount', labelX, y);
    doc.text(discount.toFixed(2) + ' AED', valueX, y, { align: 'right' });
    y += 5;
  }

  // VAT (only if > 0)
  if (vatAmount > 0) {
    doc.text('VAT (5%)', labelX, y);
    doc.text(vatAmount.toFixed(2) + ' AED', valueX, y, { align: 'right' });
    y += 5;
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total (AED)', labelX, y);
  doc.text(grandTotal.toFixed(2) + ' AED', valueX, y, { align: 'right' });

  // ================= NOTES =================
 
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount in Words: ${this.amountToWords(grandTotal)}`, 15, y + 15);
  

  // ================= SIGNATURE + STAMP =================
  const sigY = y + 40;

  doc.setFont('helvetica', 'normal');
  doc.text('Prepared By', 15, sigY);
  doc.line(15, sigY + 2, 60, sigY + 2);

  // stamp only if the invoice is marked as paid
  if (isPaid) {
    drawStamp(pageWidth / 2 + 5, sigY - 5);
  }

  doc.text('Received By', pageWidth - 70, sigY);
  doc.line(pageWidth - 70, sigY + 2, pageWidth - 20, sigY + 2);

  // ================= OUTPUT =================
  if (type === 'download') {
    doc.save(`Invoice-${data.sale[0].invoice_no}.pdf`);
  } else {
    const blob = doc.output('bloburl');
    let iframe: any;
    iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blob;
    document.body.appendChild(iframe);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }
}
amountToWords(amount: number): string {
   return this.commonService.amountToWords(amount);
}
}
