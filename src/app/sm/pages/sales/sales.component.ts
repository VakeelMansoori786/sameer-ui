import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { SaleService } from '../../services/sale.service';
import { ProductSaleComponent } from '../products/product-sale/product-sale';

@Component({
  selector: 'app-sales',
  imports: [SharedModule,ProductSaleComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class SalesComponent {
  private readonly vatRate = 0.05;

  salesForm!: FormGroup;
  productsList = signal<any[]>([]);
  customersList = signal<any[]>([]);
  statusList = signal<any[]>([
    { name: 'Proforma' },
    { name: 'Invoice' },
    { name: 'Delivery' },
    { name: 'Paid' },
  ]);
  filteredProducts: any[] = [];
  id = signal<string>('0');
  customerId = signal<number>(0);
  productId = signal<number>(0);

  constructor(
    private cd: ChangeDetectorRef,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private productService: ProductService,
    private saleService: SaleService,
  ) {}

  ngOnInit(): void {
    this.salesForm = this.fb.group({
      customer_id: ['', Validators.required],
      sale_date: [new Date().toISOString().substring(0, 10), Validators.required],
      total: [0],
      discount: [0],
      grand_total: [0],
      vat_enabled: [true],
      vat_inclusive: [false],
      vat_amount: [0],
      status: ['', Validators.required],
      items: this.fb.array([])
    });

    this.addItem();
    this.getCustomerList();

    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id.set(atob(routeId));
      this.getSale();
    }
  }

  get items(): FormArray {
    return this.salesForm.get('items') as FormArray;
  }

  getCustomerList() {
    this.supplierService.getAll().subscribe((data: any) => {
      this.customersList.set(data);
    });
  }

  getSale() {
    if (this.id() != '0') {
      this.saleService.getOne(this.id()).subscribe((data: any) => {
        if (data) {
          const sale = data.sale;
          const sale_detail = data.sale_detail;

          this.salesForm.patchValue({
            customer_id: sale[0].customer_id,
            sale_date: new Date(sale[0].sale_date).toISOString().substring(0, 10),
            total: sale[0].total,
            discount: sale[0].discount,
            vat_amount: sale[0].vat,
            vat_inclusive: !!sale[0].vat_inclusive,
            status: sale[0].status,
            grand_total: sale[0].grand_total
          });

          // clear existing items
          this.items.clear();

          // add items
          sale_detail.forEach((item: any) => {
            const grossTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);

            this.items.push(this.fb.group({
              product: item.product,
              product_id: item.product_id,
              qty: item.qty,
              unit: item.unit,
              price: item.price,
              discount: item.discount,
              gross_total: grossTotal,
              total: item.total
            }));
          });

          this.calculateTotals();
        }
      });
    }
  }

  addItem() {
    this.items.push(this.fb.group({
      product: [null],
      product_id: [null],
      qty: [1, Validators.required],
      unit: ['', Validators.required],
      price: [0, Validators.required],
      discount: [0],
      gross_total: [0],
      total: [0]
    }));
  }

  searchProduct(event: any) {
    const query = event.query;

    if (!query || query.length < 2) {
      this.filteredProducts = [];
      return;
    }

    this.productService.getSearch(query)
      .subscribe((res: any) => {
        this.filteredProducts = res;
        this.cd.detectChanges();
      });
  }

  onProductSelect(event: any, index: number) {
    const product = event.value;
    const row = this.items.at(index);

    row.patchValue({
      product_id: product.id,
      price: product.sale_price
    });

    this.calculateRow(index);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  setPrice(index: number) {
    const productId = this.items.at(index).value.product_id;
    const product = this.productsList().find(p => p.id === productId);

    if (product) {
      this.items.at(index).patchValue({
        price: product.sale_price
      });
      this.calculateRow(index);
    }
  }

  calculateRow(index: number, isPriceChange: boolean = false) {
    const row = this.items.at(index);
    const qty = +row.value.qty || 0;
    const price = +row.value.price || 0;
    const discount = +row.value.discount || 0;

    const grossTotal = qty * price;
    const total = grossTotal - discount;

    row.patchValue({
      gross_total: grossTotal,
      total
    }, { emitEvent: false });

    this.calculateTotals(isPriceChange);
  }

  calculateTotals(isPriceChange: boolean = false) {
    let grossTotal = 0;
    let discount = 0;

    this.items.controls.forEach(row => {
      grossTotal += +row.value.gross_total || 0;
      discount += +row.value.discount || 0;
    });

    this.salesForm.patchValue({ discount }, { emitEvent: false });

    this.calculateGrandTotal(isPriceChange);
  }

  calculateGrandTotal(isPriceChange: boolean = false) {
    const grossTotal = this.getGrossTotal();
    const discount = +this.salesForm.value.discount || 0;
    const vatEnabled = this.salesForm.value.vat_enabled;
    const vatInclusive = this.salesForm.value.vat_inclusive;

    let vatAmount = 0;
    let subtotal = Math.max(grossTotal - discount, 0);
    let grandTotal = subtotal;

    if (vatEnabled && vatInclusive) {
      grandTotal = grossTotal;
      vatAmount = Math.max(grandTotal - discount, 0) * this.vatRate / (1 + this.vatRate);
      subtotal = Math.max(grandTotal - discount - vatAmount, 0);
    } else if (vatEnabled) {
      vatAmount = subtotal * this.vatRate;
      grandTotal = subtotal + vatAmount;
    }

    this.allocateItemTotals(subtotal,isPriceChange);

    this.salesForm.patchValue({
      total: subtotal.toFixed(2),
      vat_amount: vatAmount.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    }, { emitEvent: false });
  }

  private getGrossTotal(): number {
    return this.items.controls.reduce((sum, row) => sum + (+row.value.gross_total || 0), 0);
  }

private allocateItemTotals(taxableAmount: number, isPriceChange: boolean = false) {
  const grossTotal = this.getGrossTotal();

  if (!grossTotal) {
    return;
  }

  let allocatedTotal = 0;

  this.items.controls.forEach((row, index) => {

    const rowGrossTotal = +row.value.gross_total || 0;
    const qty = +row.value.qty || 0;
    const discount = +row.value.discount || 0;

    const isLastRow = index === this.items.length - 1;

    const allocated = isLastRow
      ? Number((taxableAmount - allocatedTotal).toFixed(2))
      : Number((taxableAmount * rowGrossTotal / grossTotal).toFixed(2));

    allocatedTotal += allocated;

    // Recalculate price
    const price = qty > 0
      ? Number(((allocated + discount) / qty).toFixed(2))
      : 0;
if(isPriceChange){
    row.patchValue({
    total: allocated
  }, { emitEvent: false });

}
else{
row.patchValue({
      total: allocated,
      price: price
    }, { emitEvent: false });
}
    

  });
}

  async onSubmit() {
    if (!this.salesForm.valid) {
      this.salesForm.markAllAsTouched();
      return;
    }

    const items = this.items.value;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      // If product_id missing, create product.
      if (!item.product_id) {
        const newProductPayload = {
          name: item.product?.name || item.product,
          sale_price: item.price,
          purchase_price: item.price,
          stock: 0,
          unit_id: 12
        };

        const res: any = await this.productService.create(newProductPayload).toPromise();

        // assign new ID
        item.product_id = res[0].product_id; // adjust based on API
      }
    }

    const cleanedItems = items.map((item: any) => ({
      product_id: item.product_id,
      qty: item.qty,
      unit: item.unit,
      price: Number(item.price),
      discount: Number(item.discount),
      total: Number(item.total)
    }));

    const payload = {
      id: this.id(),
      customer_id: this.salesForm.value.customer_id,
      total: this.salesForm.value.total,
      discount: this.salesForm.value.discount,
      vat: this.salesForm.value.vat_amount,
      vat_inclusive: this.salesForm.value.vat_inclusive,
      grand_total: this.salesForm.value.grand_total,
      sale_date: this.salesForm.value.sale_date,
      status: this.salesForm.value.status,
      items: cleanedItems
    };

    if (this.id() != '0') {
      this.saleService.update(payload).subscribe((data: any) => {
        this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
        
        const type = payload.status?.toLowerCase();
        if (type === 'invoice' || type === 'paid') {
          this.router.navigate(['/invoice', { id: btoa(this.id()) },]);
        }
        if (type === 'proforma') {
          this.router.navigate(['/proforma', { id: btoa(this.id()) },]);
        }
        if (type === 'delivery-note') {
          this.router.navigate(['/delivery-note', { id: btoa(this.id()) },]);
        }
      });
    } else {
      this.saleService.create(payload).subscribe((data: any) => {
        this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
        const type = payload.status?.toLowerCase();
        if (type === 'invoice' || type === 'paid') {
          this.router.navigate(['/invoice', { id: btoa(data[0].sale_id) },]);
        }
        if (type === 'proforma') {
          this.router.navigate(['/proforma', { id: btoa(data[0].sale_id) },]);
        }
        if (type === 'delivery-note') {
          this.router.navigate(['/delivery-note', { id: btoa(data[0].sale_id) },]);
        }
      });
    }
  }

  GetReport(type: string) {
    if (type === 'invoice') {
      this.salesForm.patchValue({
        status: 'Invoice'
      });
      this.onSubmit();

      this.router.navigate(['/invoice', { id: btoa(this.id()) },]);
    }
    if (type === 'proforma') {
      this.router.navigate(['/proforma', { id: btoa(this.id()) },]);
    }
    if (type === 'delivery-note') {
      this.router.navigate(['/delivery-note', { id: btoa(this.id()) },]);
    }
  }
  dialogVisible = signal(false);

showProductHistory(index: number) {
  const row = this.items.at(index).value;

  if (!row.product_id) {
    return;
  }

  this.customerId.set(this.salesForm.value.customer_id||0);
  this.productId.set(row.product_id);

  this.dialogVisible.set(true);
}
}
