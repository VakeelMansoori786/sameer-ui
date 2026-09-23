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
    selector: 'app-proforma',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './proforma.html',
    styleUrl: './proforma.scss'
})
export class Proforma  {
     constructor(private location: Location,private commonService: CommonService,private route: ActivatedRoute,private saleService:SaleService,private router:Router){}
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


  // ============================================================
  // PROFORMA NUMBER
  // ============================================================

  const originalInvoiceNo =
    sale.invoice_no?.toString() || '';

  const proformaNo =
    originalInvoiceNo.replace('IN','PR');


  // ============================================================
  // HEADER
  // ============================================================

  const drawHeader = () => {

    const top = 12;

    // ----------------------------------------------------------
    // LOGO
    // ----------------------------------------------------------

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

        console.warn(
          'Unable to add company logo',
          error
        );

      }

    }


    const companyX =
      logoImg ? 42 : marginLeft;


    // ----------------------------------------------------------
    // COMPANY NAME
    // ----------------------------------------------------------

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(12);

    doc.setTextColor(
      31,
      78,
      121
    );

    doc.text(
      `${this.companyDetail?.owner || ''} ${this.companyDetail?.bussiness_type || ''}`,
      companyX,
      top + 4
    );


    // ----------------------------------------------------------
    // ADDRESS
    // ----------------------------------------------------------

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(8.5);

    doc.setTextColor(
      60,
      60,
      60
    );

    doc.text(
      this.companyDetail?.address || '',
      companyX,
      top + 9
    );


    // ----------------------------------------------------------
    // TELEPHONE
    // ----------------------------------------------------------

    doc.text(
      `Tel: ${this.companyDetail?.tel || '-'} / ${this.companyDetail?.mobile1 || '-'}`,
      companyX,
      top + 14
    );


    // ----------------------------------------------------------
    // TRN + EMAIL
    // ----------------------------------------------------------

    doc.text(
      `TRN: ${this.companyDetail?.trn || '-'}   Email: ${this.companyDetail?.email || '-'}`,
      companyX,
      top + 19
    );


    // ----------------------------------------------------------
    // HEADER LINE
    // ----------------------------------------------------------

    doc.setDrawColor(
      80,
      80,
      80
    );

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

    const footerY =
      pageHeight - 9;


    doc.setDrawColor(
      180,
      180,
      180
    );

    doc.setLineWidth(0.2);

    doc.line(
      marginLeft,
      footerY - 4,
      pageWidth - marginRight,
      footerY - 4
    );


    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      100,
      100,
      100
    );


    doc.text(
      'This is a proforma invoice and is not a tax invoice.',
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
  // START DOCUMENT
  // ============================================================

  let yStart =
    drawHeader();


  // ============================================================
  // TITLE
  // ============================================================

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(13);

  doc.setTextColor(
    0,
    0,
    0
  );


  doc.text(
    'PROFORMA INVOICE',
    pageWidth / 2,
    yStart,
    {
      align: 'center'
    }
  );


  yStart += 8;


  // ============================================================
  // CUSTOMER + PROFORMA DETAILS
  // ============================================================

  const customerX =
    marginLeft;

  const proformaX =
    pageWidth - 75;


  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(8.5);

  doc.setTextColor(
    50,
    50,
    50
  );


  doc.text(
    'CUSTOMER DETAILS',
    customerX,
    yStart
  );


  doc.text(
    'PROFORMA DETAILS',
    proformaX,
    yStart
  );


  yStart += 5;


  // ============================================================
  // CUSTOMER DETAILS
  // ============================================================

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(8.5);

  doc.setTextColor(
    0,
    0,
    0
  );


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


  const customerAddress =
    doc.splitTextToSize(
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


  // ============================================================
  // PROFORMA DETAILS
  // ============================================================

  doc.text(
    `Proforma No: ${proformaNo || '-'}`,
    proformaX,
    yStart
  );


  doc.text(
    `Date: ${formatDate(sale.sale_date)}`,
    proformaX,
    yStart + 4
  );


  // Optional LPO
  if (
    sale.lpo_no !== null &&
    sale.lpo_no !== undefined &&
    sale.lpo_no.toString().trim() !== ''
  ) {

    doc.text(
      `LPO No: ${sale.lpo_no}`,
      proformaX,
      yStart + 8
    );

  }


  // ============================================================
  // MOVE BELOW CUSTOMER SECTION
  // ============================================================

  yStart +=
    Math.max(
      20 + addressHeight,
      14
    );


  // ============================================================
  // ITEMS TABLE
  // ============================================================

  const tableColumns = [
    '#',
    'Description',
    'Unit',
    'Qty',
    'Rate',
    'Amount'
  ];


  const tableRows =
    (data.sale_detail || []).map(
      (item: any, i: number) => {

        const qty =
          toNumber(item.qty);

        const price =
          toNumber(item.price);

        const total =
          toNumber(item.total);


        return [

          i + 1,

          item.product || '-',

          item.unit || '-',

          qty.toLocaleString(
            'en-AE',
            {
              maximumFractionDigits: 3
            }
          ),

          formatAmount(price),

          formatAmount(total)

        ];

      }
    );


  // ============================================================
  // AUTO TABLE
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


    showHead:
      'everyPage',


    styles: {

      font:
        'helvetica',

      fontSize:
        8,

      textColor:
        [30, 30, 30],

      lineColor:
        [150, 150, 150],

      lineWidth:
        0.15,

      cellPadding:
        1.5,

      minCellHeight:
        5,

      valign:
        'middle'

    },


    // ==========================================================
    // TABLE HEADER
    // ==========================================================

    headStyles: {

      fillColor:
        [235, 238, 242],

      textColor:
        [30, 30, 30],

      fontStyle:
        'bold',

      fontSize:
        8,

      lineColor:
        [120, 120, 120],

      lineWidth:
        0.2,

      cellPadding:
        1.5,

      halign:
        'center'

    },


    bodyStyles: {

      fillColor:
        [255, 255, 255],

      lineColor:
        [150, 150, 150],

      lineWidth:
        0.15

    },


    alternateRowStyles: {

      fillColor:
        [250, 250, 250]

    },


    // ==========================================================
    // COLUMN WIDTHS
    // ==========================================================

    columnStyles: {

      0: {

        cellWidth: 9,

        halign: 'center'

      },

      1: {

        cellWidth: 80,

        halign: 'left'

      },

      2: {

        cellWidth: 18,

        halign: 'center'

      },

      3: {

        cellWidth: 15,

        halign: 'right'

      },

      4: {

        cellWidth: 27,

        halign: 'right'

      },

      5: {

        cellWidth: 27,

        halign: 'right'

      }

    },


    // ==========================================================
    // EVERY PAGE
    // ==========================================================

    didDrawPage:
      (pageData: any) => {

        drawHeader();


        const currentPage =
          doc
            .getCurrentPageInfo()
            .pageNumber;


        drawFooter(
          currentPage,
          doc.getNumberOfPages()
        );


        pageData.settings.margin.top =
          42;

      }

  });


  // ============================================================
  // FINAL TABLE POSITION
  // ============================================================

  let finalY =
    (doc as any).lastAutoTable?.finalY ||
    yStart + 10;


  let safeY =
    finalY + 8;


  // ============================================================
  // TOTALS
  // ============================================================

  const subTotal =
    toNumber(sale.total);


  const discount =
    toNumber(sale.discount);


  const vatAmount =
    toNumber(sale.vat);


  const grandTotal =
    toNumber(sale.grand_total);


  // ============================================================
  // PAGE BREAK BEFORE TOTALS
  // ============================================================

  if (
    safeY + 65 >
    pageHeight - 15
  ) {

    doc.addPage();

    drawHeader();

    safeY = 45;

  }


  // ============================================================
  // TOTALS BOX
  // ============================================================

  const totalsWidth =
    75;


  const totalsX =
    pageWidth -
    marginRight -
    totalsWidth;


  let totalsY =
    safeY;


  let totalsRows =
    2;


  if (discount > 0) {

    totalsRows++;

  }


  if (vatAmount > 0) {

    totalsRows++;

  }


  const totalsHeight =
    totalsRows * 6 + 4;


  // Box
  doc.setDrawColor(
    170,
    170,
    170
  );

  doc.setLineWidth(
    0.2
  );


  doc.rect(
    totalsX,
    totalsY,
    totalsWidth,
    totalsHeight
  );


  // ============================================================
  // SUB TOTAL
  // ============================================================

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(
    8.5
  );


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


  // ============================================================
  // DISCOUNT
  // ============================================================

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


  // ============================================================
  // VAT
  // ============================================================

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


  // ============================================================
  // GRAND TOTAL
  // ============================================================

  doc.setDrawColor(
    100,
    100,
    100
  );


  doc.line(
    totalsX,
    totalsY + 1,
    totalsX + totalsWidth,
    totalsY + 1
  );


  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(
    9
  );


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


  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(
    8
  );


  doc.text(
    'Amount in Words:',
    marginLeft,
    wordsY
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  const amountWords =
    this.amountToWords(
      grandTotal
    );


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
  // NOTES
  // ============================================================

  let notesY =
    wordsY +
    Math.max(
      10,
      wordsLines.length * 4
    );


  if (
    sale.note &&
    sale.note.toString().trim() !== ''
  ) {

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      8
    );


    doc.text(
      'Notes:',
      marginLeft,
      notesY
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    const noteLines =
      doc.splitTextToSize(
        sale.note.toString(),
        contentWidth - 18
      );


    doc.text(
      noteLines,
      marginLeft + 12,
      notesY
    );


    notesY +=
      Math.max(
        8,
        noteLines.length * 4
      );

  }


  // ============================================================
  // SIGNATURE AREA
  // ============================================================

  let signatureY =
    notesY + 18;


  if (
    signatureY + 25 >
    pageHeight - 15
  ) {

    doc.addPage();

    drawHeader();

    signatureY = 50;

  }


  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(
    8.5
  );

  doc.setTextColor(
    0,
    0,
    0
  );


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
  // FINAL OUTPUT
  // ============================================================

  const fileName =
    proformaNo || 'Proforma';


  if (type === 'download') {

    doc.save(
      `Proforma-${fileName}.pdf`
    );

  } else {

    const blobUrl =
      doc.output('bloburl');


    const iframe =
      document.createElement('iframe');


    iframe.style.position =
      'fixed';

    iframe.style.right =
      '0';

    iframe.style.bottom =
      '0';

    iframe.style.width =
      '0';

    iframe.style.height =
      '0';

    iframe.style.border =
      '0';


    iframe.src =
      blobUrl.toString();


    document.body.appendChild(
      iframe
    );


    iframe.onload = () => {

      setTimeout(() => {

        iframe.contentWindow
          ?.focus();

        iframe.contentWindow
          ?.print();

      }, 300);

    };

  }
}
amountToWords(amount: number): string {
   return this.commonService.amountToWords(amount);
}
}
