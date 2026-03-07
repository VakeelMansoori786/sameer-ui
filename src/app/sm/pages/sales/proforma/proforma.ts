import { companyDetail } from '@/app/environments/environment';
import { SaleService } from '@/app/sm/services/sale.service';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';


@Component({
    selector: 'app-proforma',
     imports: [CommonModule,ButtonModule], 
    templateUrl: './proforma.html',
    styleUrl: './proforma.scss'
})
export class Proforma  {
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
}
