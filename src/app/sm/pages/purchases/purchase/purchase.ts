import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { ProductService } from '@/app/sm/services/product.service';
import { PurchaseService } from '@/app/sm/services/purchase.service';


@Component({
    selector: 'app-purchase',
    imports: [SharedModule],
    templateUrl: './purchase.html',
    styleUrl: './purchase.scss',
  providers: [MessageService, ConfirmationService]
})
export class Purchase {
    purchaseForm!: FormGroup;

productsList = signal<any[]>([]);
suppliersList = signal<any[]>([]);
filteredProducts: any[] = [];

id = signal<string>('0');
 statusList = signal<any[]>([
  {name:'Purchase Order (PO)',value:'PO'},
  {name:'Purchase',value:'Purchase'}
 ]);
 paymentTypeList = signal<any[]>([
  {name:'cash',value:'cash'},
  {name:'credit',value:'credit'},
  {name:'cheque',value:'cheque'},
  {name:'bank',value:'bank'}
 ]);
constructor(
  private cd: ChangeDetectorRef,
  private router: Router,
  private route: ActivatedRoute,
  private fb: FormBuilder,
  private supplierService: SupplierService,
  private productService: ProductService,
  private purchaseService: PurchaseService,
  private messageService: MessageService
) {}

ngOnInit(): void {

  this.purchaseForm = this.fb.group({
    supplier_id: ['', Validators.required],
    purchase_date: [new Date().toISOString().substring(0,10), Validators.required],
    total: [0],
    discount: [0],
    grand_total: [0],
    vat_enabled: [true],
    vat_amount: [0],
    status: ['', Validators.required],
    payment_type: ['', Validators.required],
    items: this.fb.array([])
  });

  this.addItem();
  this.getSupplierList();

  const routeId = this.route.snapshot.paramMap.get('id');
  if(routeId){
    this.id.set(atob(routeId));
    this.getPurchase();
  }
}
getPurchase(){
     if(this.id()!='0'){
    this.purchaseService.getOne(this.id()).subscribe((data: any) => {

      if(data){

        const purchase = data.purchase;
        const purchase_detail = data.purchase_detail;

        this.purchaseForm.patchValue({
          supplier_id: purchase[0].supplier_id,
          purchase_date: new Date(purchase[0].purchase_date).toISOString().substring(0,10),
          total: purchase[0].total,
          discount: purchase[0].discount,
          vat_amount: purchase[0].vat,
          status: purchase[0].status,
          payment_type: purchase[0].payment_type,
          grand_total: purchase[0].grand_total
        });

        // clear existing items
        this.items.clear();

        // add items
        purchase_detail.forEach((item:any)=>{
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
get items(): FormArray {
  return this.purchaseForm.get('items') as FormArray;
}

getSupplierList(){
  this.supplierService.getAll().subscribe((data:any)=>{
    this.suppliersList.set(data);
  });
}

addItem(){
  this.items.push(this.fb.group({
    product: [null, Validators.required],
    product_id: [null],
    qty: [1, Validators.required],
    price: [0, Validators.required],
    total: [0]
  }));
}

searchProduct(event:any){

  const query = event.query;

  if(!query || query.length < 2){
    this.filteredProducts = [];
    return;
  }

  this.productService.getSearch(query).subscribe((res:any)=>{
    this.filteredProducts = res;
    this.cd.detectChanges();
  });
}

onProductSelect(event:any,index:number){
debugger
  const product = event.value;
  const row = this.items.at(index);

  row.patchValue({
    product_id: product.id,
    price: product.sale_price
  });

  this.calculateRow(index);
}

calculateRow(index:number){

  const row = this.items.at(index);

  const qty = +row.value.qty || 0;
  const price = +row.value.price || 0;

  const total = qty * price;

  row.patchValue({total},{emitEvent:false});

  this.calculateTotals();
}

calculateTotals(){

  let total = 0;

  this.items.controls.forEach(row=>{
    total += +row.value.total || 0;
  });

  this.purchaseForm.patchValue({total},{emitEvent:false});

  this.calculateGrandTotal();
}

calculateGrandTotal(){

  const total = +this.purchaseForm.value.total || 0;
  const discount = +this.purchaseForm.value.discount || 0;

  const afterDiscount = total - discount;

  let vatAmount = 0;

  if(this.purchaseForm.value.vat_enabled){
    vatAmount = afterDiscount * 0.05;
  }

  const grand_total = afterDiscount + vatAmount;

  this.purchaseForm.patchValue({
    vat_amount: vatAmount.toFixed(2),
    grand_total: grand_total.toFixed(2)
  },{emitEvent:false});
}

removeItem(index:number){
  this.items.removeAt(index);
  this.calculateTotals();
}

async onSubmit(){

  if(!this.purchaseForm.valid){
    this.purchaseForm.markAllAsTouched();
    return;
  }

  const items = this.items.value;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];

    // 👉 If product_id missing → create product
    if (!item.product_id) {

      const newProductPayload = {
        name: item.product?.name || item.product, // typed value
        sale_price: item.price,
        purchase_price: item.price,
        stock: 0,
        unit_id:12
      };

      const res: any = await this.productService.create(newProductPayload).toPromise();

      // assign new ID
      item.product_id = res[0].product_id; // adjust based on API
    }
  }

  
  const cleanedItems = this.items.value.map((item:any)=>({
    product_id: item.product_id || item.product?.id,
    qty: item.qty,
    unit: item.unit,
    price: Number(item.price),
    total: Number(item.total)
  }));

  const payload = {
    id:this.id(),
    supplier_id: this.purchaseForm.value.supplier_id,
    total: this.purchaseForm.value.total,
    discount: this.purchaseForm.value.discount,
    vat: this.purchaseForm.value.vat_amount,
    grand_total: this.purchaseForm.value.grand_total,
    purchase_date: this.purchaseForm.value.purchase_date,
    status: this.purchaseForm.value.status,
    payment_type: this.purchaseForm.value.payment_type,
    items: cleanedItems
  };

  if(this.id()!='0'){
    this.purchaseService.update(payload).subscribe(()=>{
      this.messageService.add({severity:'success',summary:'Saved'});
        this.router.navigate(['/purchase-order',{ id: btoa(this.id()) }]);
    });
  }
  else{
    this.purchaseService.create(payload).subscribe((data: any)=>{
      this.messageService.add({severity:'success',summary:'Saved'});
       this.router.navigate(['/purchase-order',{ id: btoa(data[0].purchase_id) },]);
    });
  }

}
}
