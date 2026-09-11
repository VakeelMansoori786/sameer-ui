import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { ReportService } from '@/app/sm/services/report-service';
import { Router } from '@angular/router';


@Component({
    selector: 'app-sale-purchase',
      imports: [SharedModule],
    templateUrl: './sale-purchase.html',
    styleUrl: './sale-purchase.scss', // corrected
  providers: [MessageService, ConfirmationService]
})
export class SalePurchase {
    
  fromDate: any;
  toDate: any;  
  list = signal<any[]>([]);
    constructor(
      private reportService: ReportService,private router: Router,
      private confirm: ConfirmationService,
      private toast: MessageService,
      private common: CommonService
    ) {}
    
  ngOnInit() {
 const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.loadData();
  }
    loadData() {
    const payload = {
      from: this.common.formatDate(this.fromDate),
      to: this.common.formatDate(this.toDate)
    };
    this.reportService.vatReturn(payload).subscribe((res: any) => {
      this.list.set(res);
    });
  }
  detail(type: string) {
if(type==='sale'){
this.router.navigate(['/sale-list'], {
  queryParams: {
    from: this.common.formatDate(this.fromDate),
    to: this.common.formatDate(this.toDate)
  }
});
}
if(type==='purchase'){
this.router.navigate(['/purchase-list'], {
  queryParams: {
    from: this.common.formatDate(this.fromDate),
    to: this.common.formatDate(this.toDate)
  }
});
}
  }
}
