import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule, Location } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-delivery-note',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './delivery-note.html',
    styleUrl: './delivery-note.scss'
})
export class DeliveryNote  {
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

  if (!data?.sale?.length) {
    return;
  }

  const sale = data.sale[0];

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 15;
  const marginRight = 15;

  const contentWidth =
    pageWidth - marginLeft - marginRight;

  const logoImg =
    this.companyDetail?.logo;


  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (value: any): string => {

    if (!value) {
      return '';
    }

    return value
      .toString()
      .split('T')[0];

  };


  // ============================================================
  // DELIVERY NOTE NUMBER
  // ============================================================

  const originalInvoiceNo =
    sale.invoice_no?.toString() || '';

  const deliveryNoteNo =
    originalInvoiceNo.replace('IN','DN');


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
      logoImg
        ? 42
        : marginLeft;


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

    doc.setLineWidth(
      0.35
    );

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

    doc.setLineWidth(
      0.2
    );


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

    doc.setFontSize(
      7.5
    );

    doc.setTextColor(
      100,
      100,
      100
    );


    doc.text(
      'This is a computer generated delivery note.',
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
  // START
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

  doc.setFontSize(
    13
  );

  doc.setTextColor(
    0,
    0,
    0
  );


  doc.text(
    'DELIVERY NOTE',
    pageWidth / 2,
    yStart,
    {
      align: 'center'
    }
  );


  yStart += 8;


  // ============================================================
  // CUSTOMER / DELIVERY DETAILS
  // ============================================================

  const customerX =
    marginLeft;

  const deliveryX =
    pageWidth - 75;


  // Section headings
  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(
    8.5
  );

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
    'DELIVERY DETAILS',
    deliveryX,
    yStart
  );


  yStart += 5;


  // ============================================================
  // CUSTOMER
  // ============================================================

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
  // DELIVERY DETAILS
  // ============================================================

  doc.text(
    `Delivery Note No: ${deliveryNoteNo || '-'}`,
    deliveryX,
    yStart
  );


  doc.text(
    `Date: ${formatDate(sale.sale_date)}`,
    deliveryX,
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
      deliveryX,
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
  // DELIVERY ITEMS TABLE
  // ============================================================

  const tableColumns = [
    '#',
    'Description',
    'Qty',
    'Unit'
  ];


  const tableRows =
    (data.sale_detail || []).map(
      (item: any, i: number) => {

        const qty =
          parseFloat(item.qty || 0);


        return [

          i + 1,

          item.product || '-',

          qty.toLocaleString(
            'en-AE',
            {
              maximumFractionDigits: 3
            }
          ),

          item.unit || '-'

        ];

      }
    );


  // ============================================================
  // AUTO TABLE
  // ============================================================

  autoTable(doc, {

    startY:
      yStart + 3,


    head: [
      tableColumns
    ],


    body:
      tableRows,


    theme:
      'grid',


    margin: {

      left:
        marginLeft,

      right:
        marginRight,

      top:
        42,

      bottom:
        18

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
        1.8,

      minCellHeight:
        7,

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
        1.8,

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

        cellWidth:
          12,

        halign:
          'center'

      },

      1: {

        cellWidth:
          125,

        halign:
          'left'

      },

      2: {

        cellWidth:
          20,

        halign:
          'right'

      },

      3: {

        cellWidth:
          28,

        halign:
          'center'

      }

    },


    // ==========================================================
    // PAGE HEADER / FOOTER
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

  const finalY =
    (doc as any).lastAutoTable?.finalY ||
    yStart + 10;


  let safeY =
    finalY + 10;


  // ============================================================
  // NOTES
  // ============================================================

  if (
    sale.note &&
    sale.note.toString().trim() !== ''
  ) {

    if (
      safeY + 30 >
      pageHeight - 15
    ) {

      doc.addPage();

      drawHeader();

      safeY = 45;

    }


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      8
    );

    doc.setTextColor(
      50,
      50,
      50
    );


    doc.text(
      'NOTES',
      marginLeft,
      safeY
    );


    safeY += 5;


    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(
      8
    );

    doc.setTextColor(
      0,
      0,
      0
    );


    const notes =
      doc.splitTextToSize(
        sale.note.toString(),
        contentWidth
      );


    doc.text(
      notes,
      marginLeft,
      safeY
    );


    safeY +=
      notes.length * 4 + 8;

  }


  // ============================================================
  // SIGNATURE SECTION
  // ============================================================

  let signatureY =
    safeY + 15;


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


  // ============================================================
  // PREPARED BY
  // ============================================================

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


  // ============================================================
  // RECEIVED BY
  // ============================================================

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

  const fileName =
    deliveryNoteNo ||
    'Delivery-Note';


  if (
    type === 'download'
  ) {

    doc.save(
      `Delivery-Note-${fileName}.pdf`
    );

  } else {

    const blobUrl =
      doc.output('bloburl');


    const iframe =
      document.createElement(
        'iframe'
      );


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

}