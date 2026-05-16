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
   
this.filters = this.fb.group({
  customer_id: [null],
  from: [null],
  to: [null],
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

  // ================= HELPERS =================

  const formatAmount = (val: any) => {
    return Number(val || 0).toFixed(2);
  };

  // ================= HEADER =================

  const drawHeader = () => {

    let yOffset = 12;

    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, yOffset, 18, 18);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text(
      `${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`,
      40,
      yOffset + 3
    );

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text(this.companyDetail.address, 40, yOffset + 7);

    doc.text(
      `Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`,
      40,
      yOffset + 11
    );

    doc.text(
      `Email: ${this.companyDetail.email}`,
      40,
      yOffset + 15
    );

    doc.setDrawColor(150);

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

    doc.setFontSize(8);

    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - 35,
      pageHeight - 8
    );
  };

  let yStart = drawHeader();

  // ================= TITLE =================

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');

  doc.text(
    reportType === 'OUTSTANDING'
      ? 'OUTSTANDING REPORT'
      : 'ACCOUNT STATEMENT',
    pageWidth / 2,
    yStart,
    { align: 'center' }
  );

  yStart += 10;

  // ================= CUSTOMER INFO =================

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(
    `Statement Period: ${this.commonService.formatDateDDMMYYY(this.filters.value.from)} to ${this.commonService.formatDateDDMMYYY(this.filters.value.to)}`,
    15,
    yStart
  );

  yStart += 10;

  // ==================================================
  // STATEMENT REPORT
  // ==================================================

  if (reportType === 'STATEMENT') {

    const openingRow = ledger.find((x: any) => x.ref_type === 'OPENING');

    const openingBalance =
      Number(openingRow?.running_balance || 0);

    doc.text(
      `Opening Balance: ${openingBalance.toFixed(2)}`,
      15,
      yStart
    );

    yStart += 10;

    autoTable(doc, {

      startY: yStart,

      head: [[
        'Date',
        'Type',
        'Ref No',
        'Debit',
        'Credit',
        'Balance'
      ]],

      body: ledger.map((item: any) => ([
        this.commonService.formatDate(item.date),
        item.ref_type,
        item.ref_no,
        formatAmount(item.debit),
        formatAmount(item.credit),
        formatAmount(item.running_balance),
      ])),

      theme: 'grid',

      styles: {
        fontSize: 9,
      },

      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },

      didDrawPage: () => {
        drawHeader();

        const pageNum =
          doc.getCurrentPageInfo().pageNumber;

        drawFooter(pageNum, doc.getNumberOfPages());
      }
    });

    const totalDebit = ledger.reduce(
      (sum: number, x: any) =>
        sum + Number(x.debit || 0),
      0
    );

    const totalCredit = ledger.reduce(
      (sum: number, x: any) =>
        sum + Number(x.credit || 0),
      0
    );

    const closingBalance =
      Number(
        ledger[ledger.length - 1]?.running_balance || 0
      );

    let finalY =
      (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'bold');

    doc.text(
      `Total Debit : ${formatAmount(totalDebit)}`,
      130,
      finalY
    );

    doc.text(
      `Total Credit : ${formatAmount(totalCredit)}`,
      130,
      finalY + 7
    );

    doc.text(
      `Closing Balance : ${formatAmount(closingBalance)}`,
      130,
      finalY + 14
    );
  }

  // ==================================================
  // OUTSTANDING REPORT
  // ==================================================

  else if (reportType === 'OUTSTANDING') {

    autoTable(doc, {

      startY: yStart,

      head: [[
        'Invoice No',
        'Date',
        'Invoice Amount',
        'Paid Amount',
        'Outstanding'
      ]],

      body: ledger.map((item: any) => ([
        item.invoice_no,
        this.commonService.formatDate(item.sale_date),
        formatAmount(item.grand_total),
        formatAmount(item.paid_amount),
        formatAmount(item.outstanding_amount),
      ])),

      theme: 'grid',

      styles: {
        fontSize: 9,
      },

      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },

      didDrawPage: () => {

        drawHeader();

        const pageNum =
          doc.getCurrentPageInfo().pageNumber;

        drawFooter(pageNum, doc.getNumberOfPages());
      }
    });

    const totalInvoice = ledger.reduce(
      (sum: number, x: any) =>
        sum + Number(x.grand_total || 0),
      0
    );

    const totalPaid = ledger.reduce(
      (sum: number, x: any) =>
        sum + Number(x.paid_amount || 0),
      0
    );

    const totalOutstanding = ledger.reduce(
      (sum: number, x: any) =>
        sum + Number(x.outstanding_amount || 0),
      0
    );

    let finalY =
      (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'bold');

    doc.text(
      `Invoice Total : ${formatAmount(totalInvoice)}`,
      120,
      finalY
    );

    doc.text(
      `Paid Total : ${formatAmount(totalPaid)}`,
      120,
      finalY + 7
    );

    doc.text(
      `Outstanding Total : ${formatAmount(totalOutstanding)}`,
      120,
      finalY + 14
    );
  }

  // ================= SAVE =================

  doc.save(
    reportType === 'OUTSTANDING'
      ? 'Outstanding_Report.pdf'
      : 'Account_Statement.pdf'
  );
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


}