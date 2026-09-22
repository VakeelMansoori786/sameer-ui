import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { ReportService } from '@/app/sm/services/report-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService, MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { companyDetail } from '@/app/environments/environment';
@Component({
    selector: 'app-statement',
       imports: [SharedModule],
    templateUrl: './statement.html',
    styleUrl: './statement.scss',
    providers: [MessageService,ConfirmationService]
})
export class Statement {
    filters!: FormGroup;
customersList = signal<any[]>([]);
typeList :any[]=[{name: 'STATEMENT'},{name: 'OUTSTANDING',}]
ledgerList = signal<any[]>([]);
loading = signal(false);
   companyDetail=companyDetail
  constructor(private router: Router,private reportService:ReportService,private commonService: CommonService,private fb: FormBuilder,private supplierService:SupplierService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
   
const today = new Date();

const oneYearAgo = new Date(today);
oneYearAgo.setFullYear(today.getFullYear() - 1);

this.filters = this.fb.group({
  customer_id: [null],
  from: [oneYearAgo],
  to: [today],
  report_type: [null],
});
this.getCustomers();
  }
   loadLedger(){
  this.loading.set(true);
  const form = this.filters.value;
const model = {
    customer_id: form.customer_id,
    from: this.commonService.formatDate(form.from),
    to: this.commonService.formatDate(form.to),
    report_type: form.report_type,
  };

  this.reportService.customerLedger(model)
  .subscribe((res:any)=>{
    this.ledgerList.set(res);
    this.loading.set(false);
  });
}
  getCustomers() {
    this.supplierService.getAll().subscribe((res: any) => {
      this.customersList.set(res);
    });
  }
exportPdf() {

  const reportType = this.filters.value.report_type;
  const ledger = this.ledgerList();

  if (!ledger || ledger.length === 0) return;

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  // ============================================================
  // COMPANY INFORMATION
  // ============================================================

  const companyName =
    this.companyDetail.name ||
    `${this.companyDetail.owner || ''} ${this.companyDetail.bussiness_type || ''}`.trim();

  const companyAddress =
    this.companyDetail.address || '';

  const companyPhone =
    [this.companyDetail.tel, this.companyDetail.mobile1]
      .filter(x => x)
      .join(' / ');

  const companyEmail =
    this.companyDetail.email || '';

  // ============================================================
  // CUSTOMER INFORMATION
  // ============================================================

  const customerName =
    ledger[0]?.customer_name ||
    'All Customers';

  // ============================================================
  // HELPERS
  // ============================================================

  const formatAmount = (value: any): string => {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (value: any): string => {
    if (!value) return '-';

    return this.commonService.formatDateDDMMYYY(value)?.toString() || '-';
  };

  // ============================================================
  // HEADER
  // ============================================================

  const drawHeader = () => {

    const headerTop = 10;

    // Logo
    if (logoImg) {
      doc.addImage(
        logoImg,
        'PNG',
        15,
        headerTop,
        22,
        22
      );
    }

    const companyX = logoImg ? 42 : 15;

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);

    doc.text(
      companyName,
      companyX,
      headerTop + 5
    );

    // Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    if (companyAddress) {
      doc.text(
        companyAddress,
        companyX,
        headerTop + 10
      );
    }

    // Phone
    if (companyPhone) {
      doc.text(
        `Tel: ${companyPhone}`,
        companyX,
        headerTop + 14
      );
    }

    // Email
    if (companyEmail) {
      doc.text(
        `Email: ${companyEmail}`,
        companyX,
        headerTop + 18
      );
    }

    // Header line
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);

    doc.line(
      15,
      headerTop + 25,
      pageWidth - 15,
      headerTop + 25
    );

    return headerTop + 31;
  };

  // ============================================================
  // FOOTER
  // ============================================================

  const drawFooter = () => {

    const pageNumber =
      doc.getCurrentPageInfo().pageNumber;

    doc.setDrawColor(200);
    doc.setLineWidth(0.2);

    doc.line(
      15,
      pageHeight - 14,
      pageWidth - 15,
      pageHeight - 14
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(
      companyName,
      15,
      pageHeight - 8
    );

    doc.text(
      `Page ${pageNumber}`,
      pageWidth - 15,
      pageHeight - 8,
      { align: 'right' }
    );
  };

  // ============================================================
  // FIRST PAGE HEADER
  // ============================================================

  let yStart = drawHeader();

  // ============================================================
  // REPORT TITLE
  // ============================================================

  const reportTitle =
    reportType === 'OUTSTANDING'
      ? 'OUTSTANDING REPORT'
      : 'ACCOUNT STATEMENT';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  doc.text(
    reportTitle,
    pageWidth / 2,
    yStart,
    { align: 'center' }
  );

  yStart += 9;

  // ============================================================
  // CUSTOMER INFORMATION BOX
  // ============================================================

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(210);
  doc.setLineWidth(0.3);

  doc.roundedRect(
    15,
    yStart,
    pageWidth - 30,
    20,
    2,
    2,
    'FD'
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text(
    'CUSTOMER',
    20,
    yStart + 7
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(
    customerName,
    20,
    yStart + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text(
    'REPORT PERIOD',
    pageWidth - 85,
    yStart + 7
  );

  doc.setFont('helvetica', 'normal');

  const fromDate =
    this.commonService.formatDateDDMMYYY(
      this.filters.value.from
    );

  const toDate =
    this.commonService.formatDateDDMMYYY(
      this.filters.value.to
    );

  doc.text(
    `${fromDate} - ${toDate}`,
    pageWidth - 85,
    yStart + 14
  );

  yStart += 28;

  // ============================================================
  // STATEMENT REPORT
  // ============================================================

  if (reportType === 'STATEMENT') {

    const openingRow =
      ledger.find(
        (x: any) => x.ref_type === 'OPENING'
      );

    const openingBalance =
      Number(openingRow?.running_balance || 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text(
      `Opening Balance: ${formatAmount(openingBalance)}`,
      15,
      yStart
    );

    yStart += 6;

    autoTable(doc, {

      startY: yStart,

      margin: {
        left: 15,
        right: 15,
        top: 40,
        bottom: 20
      },

      head: [[
        'Date',
        'Type',
        'Ref No',
        'Debit',
        'Credit',
        'Balance'
      ]],

      body: ledger.map((item: any) => ([
        formatDate(item.date),
        item.ref_type || '-',
        item.ref_no || '-',
        formatAmount(item.debit),
        formatAmount(item.credit),
        formatAmount(item.running_balance)
      ])),

      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3,
        valign: 'middle'
      },

      headStyles: {
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },

      columnStyles: {
        0: {
          cellWidth: 25
        },
        1: {
          cellWidth: 30
        },
        2: {
          cellWidth: 35
        },
        3: {
          halign: 'right'
        },
        4: {
          halign: 'right'
        },
        5: {
          halign: 'right'
        }
      },

      didDrawPage: () => {
        drawHeader();
        drawFooter();
      }
    });

    // ========================================================
    // STATEMENT TOTALS
    // ========================================================

    const totalDebit =
      ledger.reduce(
        (sum: number, x: any) =>
          sum + Number(x.debit || 0),
        0
      );

    const totalCredit =
      ledger.reduce(
        (sum: number, x: any) =>
          sum + Number(x.credit || 0),
        0
      );

    const closingBalance =
      Number(
        ledger[ledger.length - 1]?.running_balance || 0
      );

    let finalY =
      (doc as any).lastAutoTable.finalY + 10;

    // Prevent totals from being pushed outside page
    if (finalY > pageHeight - 45) {
      doc.addPage();
      drawHeader();
      finalY = 45;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text(
      'Total Debit:',
      125,
      finalY
    );

    doc.text(
      formatAmount(totalDebit),
      pageWidth - 15,
      finalY,
      { align: 'right' }
    );

    doc.text(
      'Total Credit:',
      125,
      finalY + 7
    );

    doc.text(
      formatAmount(totalCredit),
      pageWidth - 15,
      finalY + 7,
      { align: 'right' }
    );

    doc.text(
      'Closing Balance:',
      125,
      finalY + 14
    );

    doc.text(
      formatAmount(closingBalance),
      pageWidth - 15,
      finalY + 14,
      { align: 'right' }
    );
  }

  // ============================================================
  // OUTSTANDING REPORT
  // ============================================================

  else if (reportType === 'OUTSTANDING') {

    autoTable(doc, {

      startY: yStart,

      margin: {
        left: 15,
        right: 15,
        top: 40,
        bottom: 20
      },

      head: [[
        'Invoice No',
        'Date',
        'Invoice Amount',
        'Paid Amount',
        'Outstanding'
      ]],

      body: ledger.map((item: any) => ([
        item.invoice_no || '-',
        formatDate(item.sale_date),
        formatAmount(item.grand_total),
        formatAmount(item.paid_amount),
        formatAmount(item.outstanding_amount)
      ])),

      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3,
        valign: 'middle'
      },

      headStyles: {
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },

      columnStyles: {

        0: {
          cellWidth: 38
        },

        1: {
          cellWidth: 28
        },

        2: {
          halign: 'right'
        },

        3: {
          halign: 'right'
        },

        4: {
          halign: 'right'
        }
      },

      didDrawPage: () => {
        drawHeader();
        drawFooter();
      }
    });

    // ========================================================
    // OUTSTANDING TOTALS
    // ========================================================

    const totalInvoice =
      ledger.reduce(
        (sum: number, x: any) =>
          sum + Number(x.grand_total || 0),
        0
      );

    const totalPaid =
      ledger.reduce(
        (sum: number, x: any) =>
          sum + Number(x.paid_amount || 0),
        0
      );

    const totalOutstanding =
      ledger.reduce(
        (sum: number, x: any) =>
          sum + Number(x.outstanding_amount || 0),
        0
      );

    let finalY =
      (doc as any).lastAutoTable.finalY + 10;

    // Prevent totals from going outside page
    if (finalY > pageHeight - 50) {
      doc.addPage();
      drawHeader();
      finalY = 45;
    }

    // ========================================================
    // TOTAL SUMMARY BOX
    // ========================================================

    const boxX = 105;
    const boxWidth = pageWidth - boxX - 15;
    const boxHeight = 35;

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(200);

    doc.roundedRect(
      boxX,
      finalY,
      boxWidth,
      boxHeight,
      2,
      2,
      'FD'
    );

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    doc.text(
      'Invoice Total',
      boxX + 5,
      finalY + 8
    );

    doc.text(
      formatAmount(totalInvoice),
      pageWidth - 20,
      finalY + 8,
      { align: 'right' }
    );

    doc.text(
      'Paid Total',
      boxX + 5,
      finalY + 16
    );

    doc.text(
      formatAmount(totalPaid),
      pageWidth - 20,
      finalY + 16,
      { align: 'right' }
    );

    doc.text(
      'Outstanding Total',
      boxX + 5,
      finalY + 26
    );

    doc.setFontSize(10);

    doc.text(
      formatAmount(totalOutstanding),
      pageWidth - 20,
      finalY + 26,
      { align: 'right' }
    );
  }

  // ============================================================
  // SAVE PDF
  // ============================================================

  const customerFileName =
    customerName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);

  const fileName =
    reportType === 'OUTSTANDING'
      ? `Outstanding_Report_${customerFileName}.pdf`
      : `Account_Statement_${customerFileName}.pdf`;

  doc.save(fileName);
}



exportExcel() {

  const reportType = this.filters.value.report_type;

  let data: any[] = [];

  // =========================================
  // STATEMENT
  // =========================================

  if (reportType === 'STATEMENT') {

    data = this.ledgerList().map((row: any) => ({

      Date: this.commonService.formatDate(row.date),

      Type: row.ref_type,

      'Ref No': row.ref_no,

      Debit: Number(row.debit || 0),

      Credit: Number(row.credit || 0),

      Balance: Number(row.running_balance || 0),

    }));
  }

  // =========================================
  // OUTSTANDING
  // =========================================

  else if (reportType === 'OUTSTANDING') {

    data = this.ledgerList().map((row: any) => ({

      'Invoice No': row.invoice_no,

      Date: this.commonService.formatDate(row.sale_date),

      'Invoice Amount': Number(row.grand_total || 0),

      'Paid Amount': Number(row.paid_amount || 0),

      Outstanding: Number(row.outstanding_amount || 0),

    }));
  }

  const worksheet =
    XLSX.utils.json_to_sheet(data);

  const workbook = {
    Sheets: { data: worksheet },
    SheetNames: ['data']
  };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  this.saveAsExcelFile(
    excelBuffer,
    reportType === 'OUTSTANDING'
      ? 'Outstanding_Report'
      : 'Account_Statement'
  );
}



saveAsExcelFile(buffer: any, fileName: string) {

  const data: Blob = new Blob(
    [buffer],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    }
  );

  FileSaver.saveAs(
    data,
    `${fileName}_${new Date().getTime()}.xlsx`
  );
}
getTotalOutstanding(): number {
  return this.ledgerList().reduce(
    (total, row) => total + Number(row.outstanding_amount || 0),
    0
  );
}

}