import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PurchaseService } from '@/app/sm/services/purchase.service';
import { CommonService } from '@/app/sm/services/common-service';

@Component({
selector: 'app-purchase-list',
imports: [SharedModule],
templateUrl: './purchase-list.html',
styleUrl: './purchase-list.scss',
providers: [MessageService, ConfirmationService]
})
export class PurchaseList {

mainList = signal<any[]>([]);
loading = signal(false);

constructor(
private route: ActivatedRoute,private router: Router,
private purchaseService: PurchaseService,
private commonService: CommonService,
private confirmationService: ConfirmationService,
private messageService: MessageService
) {}
fromDate: Date | null = null;
toDate: Date | null = null;
  total_purchases = signal(0);
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
    table:'PURCHASE',
        from: this.commonService.formatDate(this.fromDate),
      to: this.commonService.formatDate(this.toDate),
       purpose:''
}
this.commonService.GetTableRange(model).subscribe((data: any) => {
this.mainList.set(data);
   const totalSale = this.mainList().filter(x=>x.status!=='PO').reduce(
  (sum, item) => sum + Number(item.grand_total || 0),
  0
);
      this.total_purchases.set(totalSale);
this.loading.set(false);
});
}

edit(id:any){
this.router.navigate(['/purchase',{ id: btoa(id) }]);
}

delete(id:any){

this.purchaseService.delete(id).subscribe(() => {
this.mainList.set(this.mainList().filter(x=>x.id !== id));
});

}

report(id:any){
this.router.navigate(['/purchase-order',{ id: btoa(id) }]);
}
add(){
    
this.router.navigate(['/purchase',{  }]);
}
}