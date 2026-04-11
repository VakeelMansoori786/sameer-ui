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
ledgerList = signal<any[]>([]);
loading = signal(false);
   companyDetail=companyDetail
  constructor(private router: Router,private reportService:ReportService,private commonService: CommonService,private fb: FormBuilder,private supplierService:SupplierService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
   
this.filters = this.fb.group({
  customer_id: [null],
  from: [null],
  to: [null]
});
this.getCustomers();
  }
   loadLedger(){
  this.loading.set(true);
  const form = this.filters.value;
const model = {
    customer_id: form.customer_id,
    from: this.commonService.formatDate(form.from),
    to: this.commonService.formatDate(form.to)
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

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImg = this.companyDetail.logo;

  // ✅ FORMAT FUNCTION (FIX ERROR HERE)
  const formatAmount = (val: any) => {
    const num = Number(val);
    return num ? num.toFixed(2) : '';
  };

  const formatBalance = (val: any) => {
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
    doc.text(`${this.companyDetail.owner} ${this.companyDetail.bussiness_type}`, 40, yOffset + 3);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyDetail.address, 40, yOffset + 7);
    doc.text(`Mobile: ${this.companyDetail.tel} / ${this.companyDetail.mobile1}`, 40, yOffset + 11);
    doc.text(`Email: ${this.companyDetail.email}`, 40, yOffset + 15);

    doc.setDrawColor(150);
    doc.line(15, yOffset + 20, pageWidth - 15, yOffset + 20);

    return yOffset + 25;
  };

  // ================= FOOTER =================
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 35, pageHeight - 8);
  };

  let yStart = drawHeader();

  // ================= TITLE =================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT STATEMENT', pageWidth / 2, yStart, { align: 'center' });
  yStart += 8;

  const ledger = this.ledgerList();
  if (!ledger || ledger.length === 0) return;

  const openingBalance = Number(ledger.find(x=>x.ref_type=='OPENING').running_balance) ||0;

  // ================= ACCOUNT INFO =================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(`Account Name: ${ledger[0].supplier_name}`, 15, yStart);
  doc.text(`Statement Period: ${this.commonService.formatDateDDMMYYY(this.filters.value.from)} to ${this.commonService.formatDateDDMMYYY(this.filters.value.to)}`, 15, yStart + 5);
  doc.text(`Opening Balance: ${openingBalance.toFixed(2)}`, 15, yStart + 10);

  yStart += 15;

  doc.setDrawColor(180);
  doc.line(15, yStart - 3, pageWidth - 15, yStart - 3);

  // ================= TABLE =================
  autoTable(doc, {
    startY: yStart,
    head: [['Date', 'Description', 'Ref No', 'Debit', 'Credit', 'Balance']],
    body: ledger.map((item: any) => ([
      this.commonService.formatDate(item.date),
      item.ref_type,
      item.ref_no,
      formatAmount(item.debit),
      formatAmount(item.credit),
      formatBalance(item.running_balance),
    ])),

    theme: 'plain',

    styles: {
      fontSize: 9,
      cellPadding: 2,
    },

    headStyles: {
      fontStyle: 'bold',
    },

    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },

    didDrawPage: (dataArg: any) => {
      drawHeader();
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      drawFooter(pageNum, doc.getNumberOfPages());
    }
  });

  // ================= SUMMARY =================
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  const totalDebit = ledger.reduce((sum: number, x: any) => sum + Number(x.debit || 0), 0);
  const totalCredit = ledger.reduce((sum: number, x: any) => sum + Number(x.credit || 0), 0);
  const closingBalance = Number(ledger[ledger.length - 1].running_balance || 0);

  // Page break check
  if (finalY + 30 > pageHeight) {
    doc.addPage();
    drawHeader();
    finalY = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SUMMARY', 15, finalY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Total Debit:', 120, finalY + 8);
  doc.text(totalDebit.toFixed(2), 190, finalY + 8, { align: 'right' });

  doc.text('Total Credit:', 120, finalY + 14);
  doc.text(totalCredit.toFixed(2), 190, finalY + 14, { align: 'right' });

  doc.text('Closing Balance:', 120, finalY + 20);
  doc.text(closingBalance.toFixed(2), 190, finalY + 20, { align: 'right' });

  // ================= SIGNATURE =================
  let sigY = finalY + 35;

  doc.text('Prepared By', 15, sigY);
  doc.line(15, sigY + 2, 60, sigY + 2);

  doc.text('Received By', pageWidth - 70, sigY);
  doc.line(pageWidth - 70, sigY + 2, pageWidth - 20, sigY + 2);

  // ================= SAVE =================
  doc.save('Account_Statement.pdf');
}
exportExcel() {
  const data = this.ledgerList().map(row => ({
    Date: this.commonService.formatDate(row.date),
    Type: row.ref_type,
    'Ref No': row.ref_no,
    Debit: row.debit || 0,
    Credit: row.credit || 0,
    Balance: row.running_balance,
  
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  this.saveAsExcelFile(excelBuffer, 'ledger');
}

saveAsExcelFile(buffer: any, fileName: string) {
  const data: Blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  FileSaver.saveAs(data, fileName + '_' + new Date().getTime() + '.xlsx');
}
}