import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule, Location } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-proforma',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './proforma.html',
    styleUrl: './proforma.scss'
})
export class Proforma  {
     constructor(private location: Location,private route: ActivatedRoute,private saleService:SaleService,private router:Router){}
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

  // ================= HEADER =================
  const drawHeader = () => {
    let yOffset = 15;

    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, yOffset, 20, 20);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text(`${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`, 40, yOffset + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(this.companyDetail.address, 40, yOffset + 7);
    doc.text(`Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`, 40, yOffset + 11);
    doc.text(`Email: ${this.companyDetail.email}`, 40, yOffset + 15);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(15, yOffset + 20, pageWidth - 15, yOffset + 20);

    return yOffset + 25;
  };

  // ================= FOOTER =================
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
  };

  let yStart = drawHeader();

  // ================= TITLE =================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFORMA', pageWidth / 2, yStart, { align: 'center' });
  yStart += 6;

  // ================= CUSTOMER =================
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  doc.text(`Name: ${data.sale[0].customer_name}`, 15, yStart);
  doc.text(`Phone: ${data.sale[0].phone}`, 15, yStart + 4);
  doc.text(`Address: ${data.sale[0].address}`, 15, yStart + 8);
  doc.text(`TRN: ${data.sale[0].trn || '-'}`, 15, yStart + 12);

  doc.text(`Proforma No: ${data.sale[0].invoice_no}`, pageWidth - 70, yStart);
  doc.text(`Date: ${data.sale[0].sale_date?.split('T')[0]}`, pageWidth - 70, yStart + 4);

  yStart += 16;

  // ================= TABLE =================
  const tableColumns = ['#', 'Description', 'Qty', 'Price', 'Discount', 'Total'];

  const tableRows = data.sale_detail.map((item: any, i: number) => ([
    i + 1,
    item.product,
    Number(item.qty || 0),
    parseFloat(item.price || 0).toFixed(2),
    parseFloat(item.discount || 0).toFixed(2),
    parseFloat(item.total || 0).toFixed(2)
  ]));

 autoTable(doc, {
  startY: yStart,
  head: [tableColumns],
  body: tableRows,

  theme: 'grid',

  styles: {
    fontSize: 7,
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],   // 🔥 black borders
    lineWidth: 0.2          // 🔥 thin single line
  },

  headStyles: {
    fillColor: [255, 255, 255], // 🔥 white background (no grey)
    textColor: [0, 0, 0],
    fontStyle: 'bold',          // 🔥 bold header
    lineColor: [0, 0, 0],
    lineWidth: 0.2
  },

  bodyStyles: {
    lineColor: [0, 0, 0],
    lineWidth: 0.2
  },

  alternateRowStyles: {
    fillColor: [255, 255, 255] // 🔥 remove zebra shading
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

  doc.setFontSize(7);
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
  if (data.sale[0].note) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Notes: ${data.sale[0].note}`, 15, y + 15);
  }

  // ================= SIGNATURE =================
  const sigY = y + 30;

  doc.text('Prepared By', 15, sigY);
  doc.line(15, sigY + 2, 60, sigY + 2);

  doc.text('Received By', pageWidth - 70, sigY);
  doc.line(pageWidth - 70, sigY + 2, pageWidth - 20, sigY + 2);

  // ================= OUTPUT =================
  if (type === 'download') {
    doc.save(`proforma-${data.sale[0].invoice_no}.pdf`);
  } else {
    const blob = doc.output('bloburl');
    let iframe:any;
     iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blob;
    document.body.appendChild(iframe);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }
}
}
