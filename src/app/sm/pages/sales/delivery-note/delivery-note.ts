import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule } from '@angular/common';
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
     constructor(private route: ActivatedRoute,private saleService:SaleService,private router:Router){}
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
downloadPDF() {

  const data = this.mainList();
  const doc = new jsPDF('p','mm','a4');

  /* LOGO */
  const logo = this.companyDetail.logo;

  doc.addImage(logo, 'PNG', 10, 10, 25, 25);

  /* COMPANY HEADER */

  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text(this.companyDetail.owner + ' ' + this.companyDetail.bussiness_type, 40, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.text(this.companyDetail.address, 40, 21);
  doc.text("Mobile " + this.companyDetail.tel + " / " + this.companyDetail.mobile1, 40, 26);
  doc.text("Email: " + this.companyDetail.email, 40, 31);

  /* LINE */
  doc.line(10, 38, 200, 38);

  /* TITLE */

  doc.setFontSize(13);
  doc.setFont('helvetica','bold');
  doc.text("DELIVERY NOTE", 105, 45, {align:'center'});

  /* CUSTOMER INFO */

  doc.setFontSize(10);
  doc.setFont('helvetica','normal');

  doc.text("Name: " + data.sale[0].customer_name, 10, 55);
  doc.text("Phone: " + data.sale[0].phone, 10, 60);
  doc.text("Address: " + data.sale[0].address, 10, 65);
  doc.text("TRN: " + (data.sale[0].trn || '-'), 10, 70);

  doc.text("Delivery Note No: " + data.sale[0].invoice_no, 140, 55);
  doc.text("Date: " + data.sale[0].sale_date, 140, 60);

  /* TABLE */

  const rows = data.sale_detail.map((item:any,i:number)=>[
    i+1,
    item.product,
    item.qty,
   Number(item.price).toFixed(2),
    Number(item.discount).toFixed(2),
    Number(item.total).toFixed(2)
  ]);

  autoTable(doc,{
    startY: 75,
    head:[['#','Description','Qty','Price','Discount','Total']],
    body:rows,
    theme:'grid',
    styles:{
      fontSize:9
    },
    headStyles:{
      fillColor:[240,240,240],
      textColor:0
    },
    columnStyles:{
      0:{halign:'center',cellWidth:10},
      2:{halign:'center',cellWidth:20},
      3:{halign:'right',cellWidth:25},
      4:{halign:'right',cellWidth:30},
      5:{halign:'right',cellWidth:25}
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  /* TOTALS */

  doc.text("Subtotal", 140, finalY);
  doc.text(Number(data.sale[0].total.toFixed(2)) + " AED", 200, finalY,{align:'right'});

  doc.text("Discount", 140, finalY+6);
  doc.text(Number(data.sale[0].discount.toFixed(2)) + " AED", 200, finalY+6,{align:'right'});

  doc.text("VAT (5%)", 140, finalY+12);
  doc.text(Number(data.sale[0].vat.toFixed(2)) + " AED", 200, finalY+12,{align:'right'});

  doc.setFont('helvetica','bold');
  doc.text("Grand Total (AED)", 140, finalY+20);
  doc.text(Number(data.sale[0].grand_total).toFixed(2) + " AED", 200, finalY+20,{align:'right'});

  /* NOTES */

  doc.setFont('helvetica','bold');
  doc.text("Notes",10,finalY+35);

  doc.setFont('helvetica','normal');
  doc.text("Please supply the above materials as per terms and conditions.",10,finalY+42);

  /* SIGNATURES */

  const signY = finalY + 70;

  doc.text("Prepared By",30,signY);
  doc.text("Checked By",95,signY);
  doc.text("Approved By",160,signY);

  doc.line(15,signY+5,60,signY+5);
  doc.line(80,signY+5,125,signY+5);
  doc.line(145,signY+5,190,signY+5);

  doc.save("delivery-note.pdf");

}

}