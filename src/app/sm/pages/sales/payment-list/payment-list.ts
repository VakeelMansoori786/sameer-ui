import { IndianCurrencyPipe } from '@/app/sm/common/indian-currency.pipe';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { PaymentService } from '@/app/sm/services/payment-service';
import { SaleService } from '@/app/sm/services/sale.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-payment-list',
           imports: [SharedModule],
    templateUrl: './payment-list.html',
    styleUrl: './payment-list.scss',
    providers: [MessageService,ConfirmationService]
})
export class PaymentList {
  paymentForm!: FormGroup;
     mainList = signal<any[]>([]);
  loading = signal(false);
  isVisible=false;
  paymentModes = [{ name: 'Cash' }, { name: 'Bank' }, { name: 'Card' }, { name: 'Cheque' }];
  constructor(private router: Router,private paymentService:PaymentService,private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
      this.paymentForm = this.fb.group({
      id: ['', Validators.required],
      customer_id: [''],
      customer_name: [''],
      amount: [null, Validators.required],
      payment_date: [new Date().toISOString().substring(0,10), Validators.required],
      payment_method: ['', Validators.required],
  cheque_number: [''],
  cheque_date: [''],
      note: ['']
    });
    this.getAll();
  }
    getAll() {
        this.loading.set(true);
    this.paymentService.getAll().subscribe((data: any) => {
      this.mainList.set(data);
           this.loading.set(false);
    });
  }

 delete(id: any) {

  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this payment?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptButtonStyleClass: 'p-button-danger',
    accept: () => {

      this.paymentService.delete(id).subscribe((data: any) => {

        this.mainList.set(this.mainList().filter(x => x.id !== id));

        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Payment deleted successfully'
        });

      });

    }
  });

}
   invoice(id:any){
      this.router.navigate(['/payment-received',{ id: btoa(id) },]);
  }
  addPayment(){
       this.router.navigate(['/payment-received',{ },]);
  }
  
getPayment(id:any){

  this.isVisible=true;
  this.paymentService.getOne(id).subscribe((data:any) => {
if(data.length>0){
this.paymentForm.patchValue({
  id:data[0].id,
  customer_id:data[0].customer_id,
  customer_name:data[0].customer_name,
  amount:data[0].amount,
  payment_date: new Date(data[0].payment_date).toISOString().substring(0,10),
  payment_method:data[0].payment_method,
  cheque_number:data[0].cheque_number,
  cheque_date:new Date(data[0].cheque_date).toISOString().substring(0,10),
  note:data[0].note,
})
}
  });
}
  savePayment() {

  if (this.paymentForm.invalid) {
    this.paymentForm.markAllAsTouched();
    return;
  }



  const body = {
    id: this.paymentForm.value.id,
    customer_id: this.paymentForm.value.customer_id,
    payment_date: this.paymentForm.value.payment_date,
    payment_method: this.paymentForm.value.payment_method,
    cheque_number: this.paymentForm.value.cheque_number,
    cheque_date:this.paymentForm.value.payment_method==='Cash'?null: this.paymentForm.value.cheque_date,
    note: this.paymentForm.value.note,
    total_received: this.paymentForm.value.amount,
    payments: null
  };

  this.paymentService.update(body).subscribe(() => {
    this.messageService.add({
      key: 'tst',
      severity: 'success',
      summary: 'Success',
      detail: 'Payment done successfully'
    });
   this.getAll();
   this.isVisible=false;
  });

}
}

