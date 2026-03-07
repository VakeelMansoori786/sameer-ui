
import { companyDetail } from '@/app/environments/environment';
import { PurchaseService } from '@/app/sm/services/purchase.service';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-purchase-order',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './purchase-order.html',
    styleUrl: './purchase-order.scss'
})
export class PurchaseOrder {
     constructor(private route: ActivatedRoute,private purchaseService:PurchaseService,private router:Router){}
     
 id=signal<string>('0');
 mainList = signal<any>({});
 companyDetail=companyDetail
 ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id.set(atob(routeId));
 this.getSale();
    }
 }
 
getSale() {
    this.purchaseService.getOne(this.id()).subscribe((data: any) => {
      this.mainList.set(data);
     
    });
}
    print() {
  window.print();
}
}
