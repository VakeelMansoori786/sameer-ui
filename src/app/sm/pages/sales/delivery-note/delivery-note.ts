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
  if (!data) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  // ================= HEADER =================
  const drawHeader = () => {
    const yOffset = 15;

    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, yOffset, 20, 20);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text(
      `${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`,
      40,
      yOffset + 3
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    doc.text(this.companyDetail.address, 40, yOffset + 7);
    doc.text(
      `Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`,
      40,
      yOffset + 11
    );
    doc.text(
      `TRN: ${this.companyDetail.trn}  Email: ${this.companyDetail.email}`,
      40,
      yOffset + 15
    );

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(15, yOffset + 20, pageWidth - 15, yOffset + 20);

    return yOffset + 25;
  };

  // ================= FOOTER =================
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - 30,
      pageHeight - 10
    );
  };

  let yStart = drawHeader();

  // ================= TITLE =================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY NOTE', pageWidth / 2, yStart, {
    align: 'center'
  });

  yStart += 6;

  // ================= CUSTOMER =================
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const custAddress = doc.splitTextToSize(
    data.sale[0].address || '',
    90
  );

  doc.text(`Name: ${data.sale[0].customer_name}`, 15, yStart);
  doc.text(`Phone: ${data.sale[0].phone}`, 15, yStart + 4);
  doc.text(custAddress, 15, yStart + 8);

  doc.text(
    `TRN: ${data.sale[0].trn || '-'}`,
    15,
    yStart + 8 + custAddress.length * 3
  );

  doc.text(
    `Delivery Note No: ${data.sale[0].invoice_no.replace('IN', 'DN')}`,
    pageWidth - 70,
    yStart
  );

  doc.text(
    `Date: ${data.sale[0].sale_date?.split('T')[0]}`,
    pageWidth - 70,
    yStart + 4
  );

  yStart += 16 + custAddress.length * 3;

  // ================= TABLE =================
  // Price and Total columns removed
  const tableColumns = ['#', 'Description', 'Qty', 'Unit'];

  const tableRows = data.sale_detail.map(
    (item: any, i: number) => [
      i + 1,
      item.product,
      Number(item.qty || 0),
      item.unit || ''
    ]
  );

  autoTable(doc, {
    startY: yStart,
    head: [tableColumns],
    body: tableRows,

    theme: 'grid',

    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      minCellHeight: 6
    },

    headStyles: {
      fillColor: [200, 200, 200],
      fontStyle: 'bold',
      cellPadding: 1.5,
      minCellHeight: 6,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },

    bodyStyles: {
      cellPadding: 1.5,
      minCellHeight: 6,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },

    // Better widths after removing financial columns
    columnStyles: {
      0: {
        cellWidth: 12,
        halign: 'center'
      },
      1: {
        cellWidth: 120
      },
      2: {
        cellWidth: 20,
        halign: 'center'
      },
      3: {
        cellWidth: 28,
        halign: 'center'
      }
    },

    margin: {
      left: 15,
      right: 15,
      top: 40
    },

    showHead: 'everyPage',

    didDrawPage: (dataArg: any) => {
      drawHeader();

      const pageNum = doc.getCurrentPageInfo().pageNumber;

      drawFooter(
        pageNum,
        doc.getNumberOfPages()
      );

      dataArg.settings.margin.top = 35;
    }
  });

  // ================= FINAL POSITION =================
  const finalY =
    (doc as any).lastAutoTable?.finalY || yStart + 10;

  let safeY = finalY + 10;

  // ================= NOTES =================
  if (data.sale[0].note) {

    if (safeY + 20 > pageHeight) {
      doc.addPage();
      drawHeader();
      safeY = 45;
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const notes = doc.splitTextToSize(
      `Notes: ${data.sale[0].note}`,
      pageWidth - 30
    );

    doc.text(notes, 15, safeY);

    safeY += notes.length * 4 + 10;
  }

  // ================= SIGNATURE =================
  let sigY = safeY + 20;

  if (sigY + 20 > pageHeight) {
    doc.addPage();
    drawHeader();
    sigY = 60;
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  doc.text('Prepared By', 15, sigY);
  doc.line(15, sigY + 3, 60, sigY + 3);

  doc.text('Received By', pageWidth - 70, sigY);
  doc.line(
    pageWidth - 70,
    sigY + 3,
    pageWidth - 20,
    sigY + 3
  );

  // ================= OUTPUT =================
  if (type === 'download') {
    doc.save(`Invoice-${data.sale[0].invoice_no}.pdf`);
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