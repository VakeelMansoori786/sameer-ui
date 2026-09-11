import { IndianCurrencyPipe } from '@/app/sm/common/indian-currency.pipe';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SaleService } from '@/app/sm/services/sale.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { companyDetail } from '@/app/environments/environment';
@Component({
    selector: 'app-sale-list',
           imports: [SharedModule],
    templateUrl: './sale-list.html',
    styleUrl: './sale-list.scss',
    providers: [MessageService,ConfirmationService]
})
export class SaleList {
  companyDetail=companyDetail
     mainList = signal<any[]>([]);
  loading = signal(false);
  loading1 = signal(false);
  total_sales = signal(0);
  constructor(private route: ActivatedRoute,private router: Router,private saleService:SaleService,private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

fromDate: Date | null = null;
toDate: Date | null = null;
ngOnInit(): void {

  this.route.queryParams.subscribe(params => {

    if (params['from'] && params['to']) {

      this.fromDate = new Date(params['from']);
      this.toDate = new Date(params['to']);

    } else {

      let minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 3);

      const today = new Date();

      this.toDate = today;
      this.fromDate = minDate;
    }

    this.getAll();
  });
}
    getAll() {
        this.loading.set(true);
  let model={
    table:'SALE',
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.toDate)
}
this.commonService.GetTableRange(model).subscribe((data: any) => {
      this.mainList.set(data);
      const totalSale = this.mainList().filter(x=>x.status!=='Proforma').reduce(
  (sum, item) => sum + Number(item.grand_total || 0),
  0
);
      this.total_sales.set(totalSale);
           this.loading.set(false);
    });
  }
   edit(id:any){
      this.router.navigate(['/sale',{ id: btoa(id) },]);
  }
 

   delete(id: any) {

  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this payment?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptButtonStyleClass: 'p-button-danger',
    accept: () => {

         this.saleService.delete(id).subscribe((data: any) => {
this.mainList.set(this.mainList().filter(x=>x.id!==id));

        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Payment deleted successfully'
        });

      });

    }
  });

}
   invoice(id:any){
      this.router.navigate(['/invoice',{ id: btoa(id) },]);
  }
  
   add(){
      this.router.navigate(['/sale',{  },]);
  }
  downloadBulk() {

  }
generateInvoicePdf(data: any): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  const isPaid =
    (data.sale[0].status || '').toString().toLowerCase() === 'paid';

  // ================= HEADER =================
  const drawHeader = () => {
    let yOffset = 15;

    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, yOffset, 20, 20);
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);

    doc.text(
      `${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`,
      40,
      yOffset + 3
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(this.companyDetail.address, 40, yOffset + 7);

    doc.text(
      `Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`,
      40,
      yOffset + 11
    );

    doc.text(
      `TRN:  ${this.companyDetail.trn}  Email: ${this.companyDetail.email}`,
      40,
      yOffset + 15
    );

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    doc.line(
      15,
      yOffset + 20,
      pageWidth - 15,
      yOffset + 20
    );

    return yOffset + 25;
  };

  // ================= FOOTER =================
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(9);

    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - 30,
      pageHeight - 10
    );
  };

  // ================= STAMP =================
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
      `DATE: ${data.sale[0].sale_date?.split('T')[0] || ''}`,
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

    const x = centerX - boxW / 2;
    const y = centerY - boxH / 2;

    doc.addImage(
      stampDataUrl,
      'PNG',
      x,
      y,
      boxW,
      boxH
    );
  };

  let yStart = drawHeader();

  // ================= TITLE =================

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  doc.text(
    'TAX INVOICE',
    pageWidth / 2,
    yStart,
    { align: 'center' }
  );

  yStart += 6;

  // ================= CUSTOMER =================

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const custAddress =
    doc.splitTextToSize(
      data.sale[0].address || '',
      90
    );

  doc.text(
    `Name: ${data.sale[0].customer_name}`,
    15,
    yStart
  );

  doc.text(
    `Phone: ${data.sale[0].phone}`,
    15,
    yStart + 4
  );

  doc.text(
    custAddress,
    15,
    yStart + 8
  );

  doc.text(
    `TRN: ${data.sale[0].trn || '-'}`,
    15,
    yStart + 8 + (custAddress.length * 5)
  );

  const invoiceNo =
    data.sale[0].invoice_no;

  const lpoNo =
    data.sale[0].lpo_no;

  doc.text(
    `Invoice No: ${invoiceNo}`,
    pageWidth - 70,
    yStart
  );

  let invoiceInfoY =
    yStart + 4;

  if (
    lpoNo !== null &&
    lpoNo !== undefined &&
    lpoNo.toString().trim() !== ''
  ) {

    doc.text(
      `LPO No: ${lpoNo}`,
      pageWidth - 70,
      invoiceInfoY
    );

    invoiceInfoY += 4;
  }

  doc.text(
    `Date: ${data.sale[0].sale_date?.split('T')[0]}`,
    pageWidth - 70,
    invoiceInfoY
  );

  yStart +=
    16 + (custAddress.length * 3);

  // ================= TABLE =================

  const tableColumns = [
    '#',
    'Description',
    'Unit',
    'Qty',
    'Rate',
    'Sub Total',
    'VAT 5%',
    'VAT Amt',
    'Total Amt'
  ];

  const tableRows =
    data.sale_detail.map(
      (item: any, i: number) => [
        i + 1,
        item.product,
        item.unit,
        Number(item.qty || 0),
        parseFloat(item.price || 0).toFixed(2),
        parseFloat(item.total || 0).toFixed(2),
        '5%',
        (parseFloat(item.price || 0) * 1.05).toFixed(2),
        (parseFloat(item.total || 0) * 1.05).toFixed(2)
      ]
    );

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

    margin: {
      left: 15,
      right: 15,
      top: 40
    },

    showHead: 'everyPage',

    didDrawPage: (dataArg: any) => {

      drawHeader();

      const pageNum =
        doc.getCurrentPageInfo().pageNumber;

      drawFooter(
        pageNum,
        doc.getNumberOfPages()
      );

      dataArg.settings.margin.top = 35;
    }
  });

  // ================= SAFE POSITION =================

  const finalY =
    (doc as any).lastAutoTable?.finalY ||
    yStart + 10;

  let safeY =
    finalY + 8;

  if (safeY + 50 > pageHeight) {

    doc.addPage();

    drawHeader();

    safeY = 40;
  }

  const labelX =
    pageWidth - 70;

  const valueX =
    pageWidth - 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  let y =
    safeY + 5;

  // ================= TOTALS =================

  const subTotal =
    parseFloat(data.sale[0].total || 0);

  const discount =
    parseFloat(data.sale[0].discount || 0);

  const vatAmount =
    parseFloat(data.sale[0].vat || 0);

  const grandTotal =
    parseFloat(data.sale[0].grand_total || 0);

  // Subtotal
  doc.text(
    'Sub Total',
    labelX,
    y
  );

  doc.text(
    subTotal.toFixed(2) + ' AED',
    valueX,
    y,
    { align: 'right' }
  );

  y += 5;

  // Discount
  if (discount > 0) {

    doc.text(
      'Discount',
      labelX,
      y
    );

    doc.text(
      discount.toFixed(2) + ' AED',
      valueX,
      y,
      { align: 'right' }
    );

    y += 5;
  }

  // VAT
  if (vatAmount > 0) {

    doc.text(
      'VAT (5%)',
      labelX,
      y
    );

    doc.text(
      vatAmount.toFixed(2) + ' AED',
      valueX,
      y,
      { align: 'right' }
    );

    y += 5;
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');

  doc.text(
    'Grand Total (AED)',
    labelX,
    y
  );

  doc.text(
    grandTotal.toFixed(2) + ' AED',
    valueX,
    y,
    { align: 'right' }
  );

  // ================= NOTES =================

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Amount in Words: ${this.amountToWords(grandTotal)}`,
    15,
    y + 15
  );

  // ================= SIGNATURE =================

  const sigY =
    y + 40;

  doc.text(
    'Prepared By',
    15,
    sigY
  );

  doc.line(
    15,
    sigY + 2,
    60,
    sigY + 2
  );

  if (isPaid) {

    drawStamp(
      pageWidth / 2 + 5,
      sigY - 5
    );
  }

  doc.text(
    'Received By',
    pageWidth - 70,
    sigY
  );

  doc.line(
    pageWidth - 70,
    sigY + 2,
    pageWidth - 20,
    sigY + 2
  );

  return doc;
}
amountToWords(amount: number): string {
   return this.commonService.amountToWords(amount);
}
async bulkDownloadInvoices(invoiceList: any[]) {

  if (!invoiceList || invoiceList.length === 0) {
    alert('No invoices found.');
    return;
  }

  const zip = new JSZip();

  for (const data of invoiceList) {

    try {

      // Generate invoice PDF
      const doc = this.generateInvoicePdf(data);

      // Convert PDF to Blob
      const pdfBlob = doc.output('blob');

      // Invoice number
      const invoiceNo =
        data.sale?.[0]?.invoice_no || 'Unknown';

      // Add PDF to ZIP
      zip.file(
        `Invoice-${invoiceNo}.pdf`,
        pdfBlob
      );

    } catch (error) {

      console.error(
        `Error generating invoice`,
        data,
        error
      );
    }
  }

  // Generate ZIP
  const zipBlob =
    await zip.generateAsync({
      type: 'blob'
    });

  // Download ZIP
  const url =
    window.URL.createObjectURL(zipBlob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    `Invoices-${new Date().toISOString().split('T')[0]}.zip`;

  link.click();

  // Cleanup
  window.URL.revokeObjectURL(url);
}
getAllInvoices() {
        this.loading1.set(true);
  let model={
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.toDate)
}
this.commonService.GetBulkInvoice(model).subscribe((data: any) => {
  ;
  const response = data[0].map((sale: any) => ({
  sale: [sale],
  sale_detail: data[1].filter((item: any) => item.sale_id === sale.id)
}));
this.bulkDownloadInvoices(response);
           this.loading1.set(false);
    });
  }
}
