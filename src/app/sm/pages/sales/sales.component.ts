
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-sales',
      imports: [SharedModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
    providers: [MessageService,ConfirmationService]
})
export class SalesComponent {
salesForm!: FormGroup;
 productsList = signal<any[]>([]);
 customersList = signal<any[]>([]);
 statusList = signal<any[]>([
  {name:'Proforma'},
  {name:'Invoice'},
  {name:'Delivery'},
  {name:'Paid'},
 ]);
 filteredProducts: any[] = [];
 id=signal<string>('0');
constructor(private cd: ChangeDetectorRef,private router:Router,private confirmationService:ConfirmationService,private messageService:MessageService,private route: ActivatedRoute,private fb: FormBuilder,private supplierService:SupplierService,private productService:ProductService,private saleService:SaleService,) {}
 ngOnInit(): void {
   
  this.salesForm = this.fb.group({
    customer_id: ['', Validators.required],
    sale_date: [new Date().toISOString().substring(0,10), Validators.required],
    total: [0],
    discount: [0],
    grand_total: [0],
   vat_enabled: [true],   // ✅ VAT toggle
   vat_amount: [0],       // ✅ VAT value
   status: ['', Validators.required],       // ✅ VAT value
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

getSale(){
  if(this.id()!='0'){
    this.saleService.getOne(this.id()).subscribe((data: any) => {

      if(data){

        const sale = data.sale;
        const sale_detail = data.sale_detail;

        this.salesForm.patchValue({
          customer_id: sale[0].customer_id,
          sale_date: new Date(sale[0].sale_date).toISOString().substring(0,10),
          total: sale[0].total,
          discount: sale[0].discount,
          vat_amount: sale[0].vat,
          status: sale[0].status,
          grand_total: sale[0].grand_total
        });

        // clear existing items
        this.items.clear();

        // add items
        sale_detail.forEach((item:any)=>{
          this.items.push(this.fb.group({
            product:item.product,
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            total: item.total
          }));
        });

      }

    });
  }
}
addItem() {
  this.items.push(this.fb.group({
    product: [null, Validators.required],  // full product object
    product_id: [null, Validators.required],                    // store id separately
    qty: [1, Validators.required],
    price: [0, Validators.required],
    discount: [0, Validators.required],
    total: [0, Validators.required]
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

const product=event.value;
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

calculateRow(index: number) {
  const row = this.items.at(index);
  const qty = +row.value.qty || 0;
  const price = +row.value.price || 0;
  const discount = +row.value.discount || 0;

  const total = (qty * price) - discount;

  row.patchValue({ total }, { emitEvent: false });

  this.calculateTotals();
}

calculateTotals() {
  let total = 0;
let discount=0;
  this.items.controls.forEach(row => {
    total += +row.value.total || 0;
    discount += +row.value.discount || 0;
  });

  this.salesForm.patchValue({ total,discount }, { emitEvent: false });

  this.calculateGrandTotal();
}

calculateGrandTotal() {

  const total = +this.salesForm.value.total || 0;
  const discount = +this.salesForm.value.discount || 0;
  const vatEnabled = this.salesForm.value.vat_enabled;

  const afterDiscount = total - discount;

  let vatAmount = 0;

  if (vatEnabled) {
    vatAmount = afterDiscount * 0.05; // ✅ 5% UAE VAT
  }

  const grand_total = afterDiscount + vatAmount;

  this.salesForm.patchValue({
    vat_amount: vatAmount.toFixed(2),
    grand_total: grand_total.toFixed(2)
  }, { emitEvent: false });
}
onSubmit() {
  
   if (!this.salesForm.valid) {
      this.salesForm.markAllAsTouched();
      return;
    }
 const cleanedItems = this.items.value.map((item: any) => ({
    product_id: item.product_id || item.product?.id,
    qty: item.qty,
    price: Number(item.price),
    discount: Number(item.discount),
    total: Number(item.total)
  }));
  const payload = {
    id:this.id(),
    customer_id: this.salesForm.value.customer_id,
    total: this.salesForm.value.total,
    discount: this.salesForm.value.discount,
     vat: this.salesForm.value.vat_amount,
    grand_total: this.salesForm.value.grand_total,
    sale_date: this.salesForm.value.sale_date,
    status: this.salesForm.value.status,
    items: cleanedItems
  };

if(this.id()!='0'){
 this.saleService.update(payload).subscribe((data: any) => {
      this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
  debugger
      const type=payload.status?.toLowerCase()
        if(type==='invoice'){
          this.router.navigate(['/invoice',{ id: btoa(this.id()) },]);
  }
  if(type==='proforma'){
          this.router.navigate(['/proforma',{ id: btoa(this.id()) },]);
  }
  if(type==='delivery-note'){
          this.router.navigate(['/delivery-note',{ id: btoa(this.id()) },]);
  }
    });
}
else{
 this.saleService.create(payload).subscribe((data: any) => {
      this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
    const type=payload.status?.toLowerCase()
      if(type==='invoice'){
          this.router.navigate(['/invoice',{ id: btoa(data[0].sale_id) },]);
  }
  if(type==='proforma'){
          this.router.navigate(['/proforma',{ id: btoa(data[0].sale_id) },]);
  }
  if(type==='delivery-note'){
          this.router.navigate(['/delivery-note',{ id: btoa(data[0].sale_id) },]);
  }
       //  this.router.navigate(['/invoice',{ id: btoa(data[0].v_last_id) },]);
    });
}

}
GetReport(type:string){
  if(type==='invoice'){
          this.router.navigate(['/invoice',{ id: btoa(this.id()) },]);
  }
  if(type==='proforma'){
          this.router.navigate(['/proforma',{ id: btoa(this.id()) },]);
  }
  if(type==='delivery-note'){
          this.router.navigate(['/delivery-note',{ id: btoa(this.id()) },]);
  }
}
}
