
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
    imports: [SharedModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
    providers: [MessageService,ConfirmationService]
})
export class DashboardComponent {
  loading=[false];
 constructor(private router:Router,private confirmationService:ConfirmationService,private messageService:MessageService,private route: ActivatedRoute,private fb: FormBuilder,private commonService:CommonService,private productService:ProductService) {}
 
fromDate: Date | null = null;
toDate: Date | null = null;

cash:any={};
sale:any={};
purchase:any={};
  cards = signal<any>({});
 ngOnInit(): void {
    const today = new Date();
      this.toDate=today;
  this.fromDate = today;
  this. GetData();
  }
  GetSales() {
this.loading[0]=true;
let model={
    table:'SALESUMCOUNT',
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.fromDate)
}
this.commonService.GetTableRange(model).subscribe((data: any) => {
  this.sale


this.loading[0]=false;
});
}

  GetCash() {
this.loading[0]=true;
let model={
    table:'CASHDALIY',
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.fromDate)
}
this.commonService.GetTableRange(model).subscribe((data: any) => {
if(data?.length>0){
  this.cash=data[0];

}

this.loading[0]=false;
});
}
GetPurchase() {
this.loading[0]=true;
let model={
    table:'SALESUMCOUNT',
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.fromDate)
}
this.commonService.GetTableRange(model).subscribe((data: any) => {
if(data.length>0){
  this.purchase.count=data[0].count;
  this.purchase.total=data[0].total;
}
else{
  this.purchase.count=0;
  this.purchase.total=0;
}

this.loading[0]=false;
});
}
GetData(){
  this.GetSales();
  this.GetCash();
}
}
