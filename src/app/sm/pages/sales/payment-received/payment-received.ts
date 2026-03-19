import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'; 
import { ConfirmationService, MessageService } from 'primeng/api'; 
import { SharedModule } from '@/app/sm/common/shared/shared-module'; 
import { SupplierService } from '@/app/sm/services/supplier.service'; 
import { Component, signal } from '@angular/core'; 
import { PaymentService } from '@/app/sm/services/payment-service'; 
import { SaleService } from '@/app/sm/services/sale.service';
@Component({
  selector: 'app-payment-received',
  imports: [SharedModule],
  templateUrl: './payment-received.html',
  styleUrls: ['./payment-received.scss'],
  providers: [MessageService, ConfirmationService]
})
export class PaymentReceived  {

  paymentForm!: FormGroup;
  customersList = signal<any[]>([]);
  paymentModes = [{ name: 'Cash' }, { name: 'Bank' }, { name: 'Card' }, { name: 'Cheque' }];

  summary = { received: 0, used: 0, refund: 0, excess: 0 };

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private saleService: SaleService,
    private paymentService: PaymentService,private confirmationService:ConfirmationService,
    private messageService:MessageService,
  ) {}

  ngOnInit() {
    this.paymentForm = this.fb.group({
      customer_id: ['', Validators.required],
      pending_amount: [{ value: 0, disabled: true }],
      amount_received: [null, Validators.required],
      payment_date: [new Date().toISOString().substring(0,10), Validators.required],
      payment_method: ['', Validators.required],
  cheque_number: [''],
  cheque_date: [''],
      note: [''],
      invoices: this.fb.array([])
    });

    this.getCustomers();
  }

  get invoices(): FormArray {
    return this.paymentForm.get('invoices') as FormArray;
  }

  getCustomers() {
    this.supplierService.getAll().subscribe((res: any) => {
      this.customersList.set(res);
    });
  }

  loadInvoices() {
    const customer = this.paymentForm.value.customer_id;
    if (!customer) return;

    this.saleService.getUnpaidInvoices(customer).subscribe((res: any) => {
      this.invoices.clear();
      let totalPending = 0;

      res.forEach((inv: any) => {
        totalPending += Number(inv.balance_amount || 0);
        this.invoices.push(this.fb.group({
          sale_id: [inv.id],
          invoice_no: [inv.invoice_no],
          sale_date: [inv.sale_date],
          balance_amount: [inv.balance_amount],
          pay_amount: [0],
          grand_total: [inv.grand_total]  // added for table display
        }));
      });

      this.paymentForm.patchValue({ pending_amount: totalPending });
      this.updateTotals();
    });
  }

  calculateDistribution() {
    let received = Number(this.paymentForm.value.amount_received || 0);
    let remaining = received;

    this.invoices.controls.forEach((row: any) => {
      const balance = Number(row.value.balance_amount || 0);
      const pay = remaining > 0 ? Math.min(balance, remaining) : 0;
      row.patchValue({ pay_amount: pay }, { emitEvent: false });
      remaining -= pay;
    });

    this.updateTotals();
  }

  updateTotals() {
    const used = this.invoices.controls.reduce(
      (sum, row: any) => sum + Number(row.value.pay_amount || 0),
      0
    );
    const received = Number(this.paymentForm.value.amount_received || 0);

    this.summary = {
      received,
      used,
      refund: 0,
      excess: received - used
    };
  }

  savePayment() {

  if (this.paymentForm.invalid) {
    this.paymentForm.markAllAsTouched();
    return;
  }

  const payments = this.invoices.value
    .filter((x: any) => x.pay_amount > 0)
    .map((x: any) => ({
      sale_id: x.sale_id,
      amount: x.pay_amount
    }));

  const body = {
    customer_id: this.paymentForm.value.customer_id,
    payment_date: this.paymentForm.value.payment_date,
    payment_method: this.paymentForm.value.payment_method,
    cheque_number: this.paymentForm.value.cheque_number,
    cheque_date: this.paymentForm.value.cheque_date,
    note: this.paymentForm.value.note,
    total_received: this.paymentForm.value.amount_received,
    payments: payments
  };

  this.paymentService.create(body).subscribe(() => {
    this.messageService.add({
      key: 'tst',
      severity: 'success',
      summary: 'Success',
      detail: 'Payment done successfully'
    });
    this.paymentForm.reset();
  });

}
}