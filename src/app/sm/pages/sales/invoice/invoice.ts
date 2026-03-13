import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule, Location } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
    selector: 'app-invoice',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './invoice.html',
    styleUrl: './invoice.scss'
})
export class Invoice {
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
report(type:string) {
  const data: any = this.mainList();
  if (!data) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  // Helper to draw header on each page
  const drawHeader = (doc: any) => {
    let yOffset = 15;

    if (logoImg) {
      const img = new Image();
      img.src = logoImg;
      // We cannot await here, so use a fixed size
      doc.addImage(logoImg, 'PNG', 15, yOffset, 20, 20);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica','bold');
    doc.setTextColor(31,78,121);
    doc.text(`${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`, 40, yOffset + 3);

    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(0,0,0);
    doc.text(this.companyDetail.address, 40, yOffset + 7);
    doc.text(`Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`, 40, yOffset + 11);
    doc.text(`Email: ${this.companyDetail.email}`, 40, yOffset + 15);

    doc.setDrawColor(0,0,0);
    doc.setLineWidth(0.3);
    doc.line(15, yOffset + 20, pageWidth - 15, yOffset + 20);

    return yOffset + 25; // return starting Y after header
  };

  const footer = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.setTextColor(0,0,0);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
  };

  let yStart = drawHeader(doc);

  // PROFORMA INVOICE TITLE
  doc.setFontSize(8);
  doc.setFont('helvetica','bold');
  doc.text('INVOICE', pageWidth/2, yStart, {align:'center'});
  yStart += 6;

  // CUSTOMER DETAILS
  doc.setFontSize(7);
  doc.setFont('helvetica','normal');
  doc.text(`Name: ${data.sale[0].customer_name}`, 15, yStart);
  doc.text(`Phone: ${data.sale[0].phone}`, 15, yStart + 4);
  doc.text(`Address: ${data.sale[0].address}`, 15, yStart + 8);
  doc.text(`TRN: ${data.sale[0].trn || '-'}`, 15, yStart + 12);
  doc.text(`Invoice No: ${data.sale[0].invoice_no}`, pageWidth - 70, yStart);
  doc.text(`Date: ${data.sale[0].sale_date?.split('T')[0]}`, pageWidth - 70, yStart + 4);
  yStart += 16;

  // ITEMS TABLE
  const tableColumns = [
    { header: '#', dataKey: 'no' },
    { header: 'Description', dataKey: 'product' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Price', dataKey: 'price' },
    { header: 'Discount', dataKey: 'discount' },
    { header: 'Total', dataKey: 'total' },
  ];

  const tableRows = data.sale_detail.map((item:any, i:number) => ({
    no: i+1,
    product: item.product,
    qty: Number(item.qty || 0),
    price: parseFloat(item.price || 0).toFixed(2),
    discount: parseFloat(item.discount || 0).toFixed(2),
    total: parseFloat(item.total || 0).toFixed(2)
  }));

autoTable(doc, {
  startY: yStart, // initial start
  head: [tableColumns.map(c => c.header)],
  body: tableRows.map((r:any) => Object.values(r)),
  theme: 'grid',
  headStyles: { fillColor: [242,242,242], textColor:0, fontStyle:'bold' },
  styles: { fontSize: 7 },
  margin: { left: 15, right: 15, top: 40 }, // reserve space for header
  showHead: 'everyPage', // repeat table header
  didDrawPage: (dataArg) => {
    const pageNum = doc.getCurrentPageInfo().pageNumber;
    footer(pageNum, doc.getNumberOfPages());

    // Draw company header only for new pages
    drawHeader(doc);

    // Reset the table's margin.top to avoid overlapping
    (dataArg as any).settings.margin.top = 35; // header height
  }
});

  // TOTALS AFTER TABLE
  const finalY = (autoTable as any).previous?.finalY || yStart + 5;

const labelX = pageWidth - 70;   // label column
const valueX = pageWidth - 15;   // value column (right aligned)

doc.setFontSize(7);
doc.setFont('helvetica','normal');

// Subtotal
doc.text('Sub Total', labelX, finalY + 5);
doc.text(parseFloat(data.sale[0].total || 0).toFixed(2) + ' AED', valueX, finalY + 5, { align: 'right' });

// Discount
doc.text('Discount', labelX, finalY + 10);
doc.text(parseFloat(data.sale[0].discount || 0).toFixed(2) + ' AED', valueX, finalY + 10, { align: 'right' });

// VAT
if (data.sale[0].vat !== '0.00') {
  doc.text('VAT (5%)', labelX, finalY + 15);
  doc.text(parseFloat(data.sale[0].vat || 0).toFixed(2) + ' AED', valueX, finalY + 15, { align: 'right' });
}

// Grand Total
doc.setFont('helvetica','bold');
doc.text('Grand Total (AED)', labelX, finalY + 20);
doc.text(parseFloat(data.sale[0].grand_total || 0).toFixed(2) + ' AED', valueX, finalY + 20, { align: 'right' });
  // NOTES
  doc.setFont('helvetica','normal');
  doc.text('Notes: Please supply the above materials as per terms and conditions.', 15, finalY + 35);

  // SIGNATURES
  const sigY = finalY + 50;
  doc.text('Prepared By', 15, sigY);
  doc.line(15, sigY + 2, 60, sigY + 2);
  doc.text('Received By', pageWidth - 70, sigY);
  doc.line(pageWidth - 70, sigY + 2, pageWidth - 20, sigY + 2);


  if(type==='download'){
  doc.save(`Invoice-${data.sale[0].invoice_no}.pdf`);
  }
  else{
    let blob:any={}
   blob = doc.output('bloburl');
const iframe = document.createElement('iframe');
iframe.style.display = 'none';
iframe.src = blob;
document.body.appendChild(iframe);
iframe.contentWindow?.focus();
iframe.contentWindow?.print();
  }
}
}
