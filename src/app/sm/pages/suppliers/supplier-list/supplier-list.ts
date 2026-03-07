import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-supplier-list',
    imports: [SharedModule],
    providers: [MessageService,ConfirmationService],
    templateUrl: './supplier-list.html',
    styleUrl: './supplier-list.scss'
})
export class SupplierList {
    
  mainList = signal<any[]>([]);
  loading = signal(false);
  constructor(private router: Router,private supplierService:SupplierService,private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
   
    this.getAll();
  }
    getAll() {
           this.loading.set(true);
    this.supplierService.getAll().subscribe((data: any) => {
      this.mainList.set(data);
      this.loading.set(false);
    });
  }
  delete(id:any){
     this.supplierService.delete(id).subscribe((data: any) => {
this.mainList.set(this.mainList().filter(x=>x.id!==id));
    });
  }
  edit(id:any){
      this.router.navigate(['/supplier',{ id: btoa(id) },]);
  }
}
