import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { ReportService } from '@/app/sm/services/report-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
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
}