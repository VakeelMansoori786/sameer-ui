import { IndianCurrencyPipe } from '@/app/sm/common/indian-currency.pipe';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SaleService } from '@/app/sm/services/sale.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-sale-list',
           imports: [SharedModule],
    templateUrl: './sale-list.html',
    styleUrl: './sale-list.scss',
    providers: [MessageService,ConfirmationService]
})
export class SaleList {

     mainList = signal<any[]>([]);
  loading = signal(false);
  constructor(private router: Router,private saleService:SaleService,private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
   
    this.getAll();
  }
    getAll() {
        this.loading.set(true);
    this.saleService.getAll().subscribe((data: any) => {
      this.mainList.set(data);
           this.loading.set(false);
    });
  }
   edit(id:any){
      this.router.navigate(['/sale',{ id: btoa(id) },]);
  }
   delete(id:any){
     this.saleService.delete(id).subscribe((data: any) => {
this.mainList.set(this.mainList().filter(x=>x.id!==id));
    });
  }
   invoice(id:any){
      this.router.navigate(['/invoice',{ id: btoa(id) },]);
  }
  
   add(){
      this.router.navigate(['/sale',{  },]);
  }
}
