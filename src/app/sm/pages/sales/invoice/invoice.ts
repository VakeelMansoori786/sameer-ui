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

  if (!data?.sale?.length) {
    return;
  }

  const sale = data.sale[0];

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const logoImg = this.companyDetail?.logo;

  // ============================================================
  // HELPERS
  // ============================================================

  const toNumber = (value: any): number => {
    const number = parseFloat(value);
    return isNaN(number) ? 0 : number;
  };

  const formatAmount = (value: any): string => {
    return toNumber(value).toLocaleString('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (value: any): string => {
    if (!value) {
      return '';
    }

    return value.toString().split('T')[0];
  };

  const isPaid =
    (sale.status || '')
      .toString()
      .trim()
      .toLowerCase() === 'paid';


  // ============================================================
  // HEADER
  // ============================================================

  const drawHeader = () => {

    const top = 12;

    // Logo
    if (logoImg) {
      try {
        doc.addImage(
          logoImg,
          'PNG',
          marginLeft,
          top,
          22,
          22
        );
      } catch (error) {
        console.warn('Unable to add company logo', error);
      }
    }

    const companyX = logoImg ? 42 : marginLeft;

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(31, 78, 121);

    doc.text(
      `${this.companyDetail?.owner || ''} ${this.companyDetail?.bussiness_type || ''}`,
      companyX,
      top + 4
    );

    // Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);

    doc.text(
      this.companyDetail?.address || '',
      companyX,
      top + 9
    );

    // Telephone
    doc.text(
      `Tel: ${this.companyDetail?.tel || '-'} / ${this.companyDetail?.mobile1 || '-'}`,
      companyX,
      top + 14
    );

    // TRN / Email
    doc.text(
      `TRN: ${this.companyDetail?.trn || '-'}   Email: ${this.companyDetail?.email || '-'}`,
      companyX,
      top + 19
    );

    // Header line
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.35);

    doc.line(
      marginLeft,
      top + 26,
      pageWidth - marginRight,
      top + 26
    );

    return top + 31;
  };


  // ============================================================
  // FOOTER
  // ============================================================

  const drawFooter = (
    pageNumber: number,
    totalPages: number
  ) => {

    const footerY = pageHeight - 9;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);

    doc.line(
      marginLeft,
      footerY - 4,
      pageWidth - marginRight,
      footerY - 4
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);

    doc.text(
      'This is a computer generated invoice.',
      marginLeft,
      footerY
    );

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - marginRight,
      footerY,
      {
        align: 'right'
      }
    );
  };


  // ============================================================
  // PAID STAMP
  // ============================================================

  const buildStampImage = (): string => {

    const scale = 4;

    const w = 400 * scale;
    const h = 220 * scale;

    const canvas = document.createElement('canvas');

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, w, h);

    ctx.save();

    ctx.translate(w / 2, h / 2);

    ctx.rotate((-1 * Math.PI) / 180);

    ctx.translate(-w / 2, -h / 2);

    // Border
    ctx.strokeStyle = '#0057b8';

    ctx.lineWidth = 4 * scale;

    ctx.strokeRect(
      10 * scale,
      10 * scale,
      w - 20 * scale,
      h - 20 * scale
    );

    ctx.fillStyle = '#0057b8';

    ctx.textAlign = 'center';

    // PAID
    ctx.font = `bold ${34 * scale}px Arial`;

    ctx.direction = 'ltr';

    ctx.fillText(
      'PAID',
      w / 2,
      55 * scale
    );

    // Arabic
    ctx.font = `bold ${16 * scale}px Arial`;

    ctx.direction = 'rtl';

    ctx.fillText(
      'مدفوع',
      w / 2,
      90 * scale
    );

    ctx.fillText(
      'سمير محمد لتجارة مواد البناء ذ.م.م',
      w / 2,
      112 * scale
    );

    // English
    ctx.direction = 'ltr';

    ctx.font = `bold ${13 * scale}px Arial`;

    ctx.fillText(
      'SAMEER MOHAMMED',
      w / 2,
      138 * scale
    );

    ctx.fillText(
      'BUILDING MATERIALS TRADING L.L.C',
      w / 2,
      156 * scale
    );

    // Date
    ctx.fillStyle = 'red';

    ctx.font = `bold ${13 * scale}px Arial`;

    ctx.fillText(
      `DATE: ${formatDate(sale.sale_date)}`,
      w / 2,
      182 * scale
    );

    ctx.restore();

    return canvas.toDataURL('image/png');
  };


  const drawStamp = (
    centerX: number,
    centerY: number
  ) => {

    const stampDataUrl = buildStampImage();

    const boxW = 48;
    const boxH = 26;

    doc.addImage(
      stampDataUrl,
      'PNG',
      centerX - boxW / 2,
      centerY - boxH / 2,
      boxW,
      boxH
    );
  };


  // ============================================================
  // START
  // ============================================================

  let yStart = drawHeader();


  // ============================================================
  // TAX INVOICE TITLE
  // ============================================================

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);

  doc.text(
    'TAX INVOICE',
    pageWidth / 2,
    yStart,
    {
      align: 'center'
    }
  );

  yStart += 8;


  // ============================================================
  // CUSTOMER / INVOICE INFORMATION
  // ============================================================

  const customerX = marginLeft;
  const invoiceX = pageWidth - 75;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  doc.text(
    'CUSTOMER DETAILS',
    customerX,
    yStart
  );

  doc.text(
    'INVOICE DETAILS',
    invoiceX,
    yStart
  );

  yStart += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  // Customer
  doc.text(
    `Name: ${sale.customer_name || '-'}`,
    customerX,
    yStart
  );

  doc.text(
    `Phone: ${sale.phone || '-'}`,
    customerX,
    yStart + 4
  );

  const customerAddress = doc.splitTextToSize(
    sale.address || '-',
    90
  );

  doc.text(
    customerAddress,
    customerX,
    yStart + 8
  );

  const addressHeight =
    customerAddress.length * 4;

  doc.text(
    `TRN: ${sale.trn || '-'}`,
    customerX,
    yStart + 8 + addressHeight
  );


  // Invoice details
  doc.text(
    `Invoice No: ${sale.invoice_no || '-'}`,
    invoiceX,
    yStart
  );

  let invoiceY = yStart + 4;

  if (
    sale.lpo_no !== null &&
    sale.lpo_no !== undefined &&
    sale.lpo_no.toString().trim() !== ''
  ) {

    doc.text(
      `LPO No: ${sale.lpo_no}`,
      invoiceX,
      invoiceY
    );

    invoiceY += 4;
  }

  doc.text(
    `Date: ${formatDate(sale.sale_date)}`,
    invoiceX,
    invoiceY
  );

  invoiceY += 4;

  doc.text(
    `Status: ${(sale.status || '-').toUpperCase()}`,
    invoiceX,
    invoiceY
  );


  // Separator
  const customerBlockHeight =
    Math.max(
      20 + addressHeight,
      invoiceY - yStart + 5
    );

  yStart += customerBlockHeight;


  // ============================================================
  // TABLE DATA
  // ============================================================

  const tableColumns = [
    '#',
    'Description',
    'Unit',
    'Qty',
    'Rate',
    'Sub Total',
    'VAT %',
    'VAT Amt',
    'Total'
  ];


  const tableRows = data.sale_detail.map(
    (item: any, i: number) => {

      const qty = toNumber(item.qty);

      const price = toNumber(item.price);

      const subtotal = toNumber(item.total);

      const vatRate = 5;

      const vatAmount =
        subtotal * vatRate / 100;

      const total =
        subtotal + vatAmount;

      return [

        i + 1,

        item.product || '-',

        item.unit || '-',

        qty.toLocaleString('en-AE', {
          maximumFractionDigits: 3
        }),

        formatAmount(price),

        formatAmount(subtotal),

        '5%',

        formatAmount(vatAmount),

        formatAmount(total)

      ];
    }
  );


  // ============================================================
  // SALES TABLE
  // ============================================================

  autoTable(doc, {

    startY: yStart + 3,

    head: [
      tableColumns
    ],

    body: tableRows,

    theme: 'grid',

    margin: {
      left: marginLeft,
      right: marginRight,
      top: 42,
      bottom: 18
    },

    showHead: 'everyPage',

    styles: {

      font: 'helvetica',

      fontSize: 7.5,

      textColor: [30, 30, 30],

      lineColor: [150, 150, 150],

      lineWidth: 0.15,

      cellPadding: 1.5,

      minCellHeight: 5,

      valign: 'middle'

    },

    headStyles: {

      fillColor: [235, 238, 242],

      textColor: [30, 30, 30],

      fontStyle: 'bold',

      fontSize: 7.5,

      lineColor: [120, 120, 120],

      lineWidth: 0.2,

      cellPadding: 1.5,

      halign: 'center'

    },

    bodyStyles: {

      fillColor: [255, 255, 255]

    },

    alternateRowStyles: {

      fillColor: [250, 250, 250]

    },

    columnStyles: {

      0: {
        cellWidth: 8,
        halign: 'center'
      },

      1: {
        cellWidth: 48,
        halign: 'left'
      },

      2: {
        cellWidth: 12,
        halign: 'center'
      },

      3: {
        cellWidth: 12,
        halign: 'right'
      },

      4: {
        cellWidth: 18,
        halign: 'right'
      },

      5: {
        cellWidth: 22,
        halign: 'right'
      },

      6: {
        cellWidth: 14,
        halign: 'center'
      },

      7: {
        cellWidth: 20,
        halign: 'right'
      },

      8: {
        cellWidth: 22,
        halign: 'right'
      }

    },

    didDrawPage: (pageData: any) => {

      // Header
      drawHeader();

      // Footer
      const currentPage =
        doc.getCurrentPageInfo().pageNumber;

      drawFooter(
        currentPage,
        doc.getNumberOfPages()
      );

      // Ensure table does not overlap header
      pageData.settings.margin.top = 42;
    }

  });


  // ============================================================
  // FINAL TABLE POSITION
  // ============================================================

  let finalY =
    (doc as any).lastAutoTable?.finalY ||
    yStart + 10;


  let safeY = finalY + 8;


  // ============================================================
  // TOTALS
  // ============================================================

  const subTotal = toNumber(
    sale.total
  );

  const discount = toNumber(
    sale.discount
  );

  const vatAmount = toNumber(
    sale.vat
  );

  const grandTotal = toNumber(
    sale.grand_total
  );


  // Need new page?
  if (safeY + 65 > pageHeight - 15) {

    doc.addPage();

    drawHeader();

    safeY = 45;
  }


  // Totals box
  const totalsWidth = 75;

  const totalsX =
    pageWidth - marginRight - totalsWidth;

  let totalsY = safeY;


  // Box
  let totalsRows = 2;

  if (discount > 0) {
    totalsRows++;
  }

  if (vatAmount > 0) {
    totalsRows++;
  }

  const totalsHeight =
    totalsRows * 6 + 4;


  doc.setDrawColor(170, 170, 170);

  doc.setLineWidth(0.2);

  doc.rect(
    totalsX,
    totalsY,
    totalsWidth,
    totalsHeight
  );


  // Sub Total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(
    'Sub Total',
    totalsX + 4,
    totalsY + 6
  );

  doc.text(
    `${formatAmount(subTotal)} AED`,
    totalsX + totalsWidth - 4,
    totalsY + 6,
    {
      align: 'right'
    }
  );

  totalsY += 6;


  // Discount
  if (discount > 0) {

    doc.text(
      'Discount',
      totalsX + 4,
      totalsY + 6
    );

    doc.text(
      `${formatAmount(discount)} AED`,
      totalsX + totalsWidth - 4,
      totalsY + 6,
      {
        align: 'right'
      }
    );

    totalsY += 6;
  }


  // VAT
  if (vatAmount > 0) {

    doc.text(
      'VAT (5%)',
      totalsX + 4,
      totalsY + 6
    );

    doc.text(
      `${formatAmount(vatAmount)} AED`,
      totalsX + totalsWidth - 4,
      totalsY + 6,
      {
        align: 'right'
      }
    );

    totalsY += 6;
  }


  // Grand Total separator
  doc.setDrawColor(100, 100, 100);

  doc.line(
    totalsX,
    totalsY + 1,
    totalsX + totalsWidth,
    totalsY + 1
  );


  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text(
    'GRAND TOTAL',
    totalsX + 4,
    totalsY + 7
  );

  doc.text(
    `${formatAmount(grandTotal)} AED`,
    totalsX + totalsWidth - 4,
    totalsY + 7,
    {
      align: 'right'
    }
  );


  // ============================================================
  // AMOUNT IN WORDS
  // ============================================================

  const wordsY =
    Math.max(
      safeY + totalsHeight + 8,
      totalsY + 14
    );


  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  doc.text(
    'Amount in Words:',
    marginLeft,
    wordsY
  );


  doc.setFont('helvetica', 'normal');

  const amountWords =
    this.amountToWords(grandTotal);


  const wordsLines =
    doc.splitTextToSize(
      amountWords || '-',
      contentWidth - 32
    );


  doc.text(
    wordsLines,
    marginLeft + 27,
    wordsY
  );


  // ============================================================
  // PAYMENT STATUS
  // ============================================================

  let signatureY =
    wordsY +
    Math.max(
      20,
      wordsLines.length * 4
    );


  // New page if needed
  if (signatureY + 35 > pageHeight - 15) {

    doc.addPage();

    drawHeader();

    signatureY = 50;
  }


  // ============================================================
  // SIGNATURE AREA
  // ============================================================

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);


  // Prepared By
  doc.text(
    'Prepared By',
    marginLeft,
    signatureY
  );

  doc.line(
    marginLeft,
    signatureY + 8,
    marginLeft + 45,
    signatureY + 8
  );


  // Paid Stamp
  if (isPaid) {

    drawStamp(
      pageWidth / 2,
      signatureY + 1
    );

  }


  // Received By
  doc.text(
    'Received By',
    pageWidth - 65,
    signatureY
  );

  doc.line(
    pageWidth - 65,
    signatureY + 8,
    pageWidth - marginRight,
    signatureY + 8
  );


  // ============================================================
  // OUTPUT
  // ============================================================

  const invoiceNumber =
    sale.invoice_no || 'Invoice';


  if (type === 'download') {

    doc.save(
      `Invoice-${invoiceNumber}.pdf`
    );

  } else {

    const blobUrl =
      doc.output('bloburl');

    const iframe =
      document.createElement('iframe');

    iframe.style.position = 'fixed';

    iframe.style.right = '0';

    iframe.style.bottom = '0';

    iframe.style.width = '0';

    iframe.style.height = '0';

    iframe.style.border = '0';

    iframe.src = blobUrl.toString();

    document.body.appendChild(iframe);

    iframe.onload = () => {

      setTimeout(() => {

        iframe.contentWindow?.focus();

        iframe.contentWindow?.print();

      }, 300);

    };

  }
}
amountToWords(amount: number): string {
   return this.commonService.amountToWords(amount);
}
}
