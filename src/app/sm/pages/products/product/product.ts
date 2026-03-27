
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-product',
    imports: [SharedModule],
    templateUrl: './product.html',
    styleUrl: './product.scss',
    providers: [MessageService,ConfirmationService]
})
export class Product {
     mainForm!: FormGroup;

  // Example categories for dropdown
  categoriesList  = signal<any[]>([]);
  unitsList  = signal<any[]>([]);
  id=signal<string>('0');
     constructor(private router:Router,private confirmationService:ConfirmationService,private messageService:MessageService,private route: ActivatedRoute,private fb: FormBuilder,private commonService:CommonService,private productService:ProductService) {}

  ngOnInit(): void {
 this.mainForm = this.fb.group({
  name: ['', Validators.required],
  size: ['', Validators.required], // ✅ NEW
  category: [null, Validators.required],
  purchase_price: [null, [Validators.required, Validators.min(0)]],
  sale_price: [null, [Validators.required, Validators.min(0)]],
  stock: [null, [Validators.required, Validators.min(0)]],
  unit: [null, Validators.required]
});
    this.getCategories();
    this.getUnits();
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id.set(atob(routeId));
      this.getproduct();
    }
  }

  onSubmit() {
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      return;
    }
const model = {
  id: this.id(),
  name: this.mainForm.value.name,
  size: this.mainForm.value.size, // ✅ NEW
  category_id: this.mainForm.value.category,
  purchase_price: this.mainForm.value.purchase_price,
  sale_price: this.mainForm.value.sale_price,
  stock: this.mainForm.value.stock,
  unit_id: this.mainForm.value.unit,
};
if(this.id()!='0'){
 this.productService.update(model).subscribe((data: any) => {
      this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Product saved successfully' });
      this.router.navigate(['/product-list']);
    });
}
else{
 this.productService.create(model).subscribe((data: any) => {
      this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Product saved successfully' });
      this.router.navigate(['/product-list']);
    });
}
  }

   get f() {
    return this.mainForm.controls as { [key: string]: any };
  }
  getproduct(){
    if(this.id()!='0'){
        this.productService.getOne(this.id()).subscribe((data: any) => {
   if(data.length>0){
    this.mainForm.patchValue({
  name: data[0].name,
  size: data[0].size, // ✅ NEW
  category: data[0].category_id,
  purchase_price: data[0].purchase_price,
  sale_price: data[0].sale_price,
  stock: data[0].stock,
  unit: data[0].unit_id,
});
   }
    });
    }
  }

  getCategories() {
      const model={
        table:'sm_category'
      }
    this.commonService.GetDropdrown(model).subscribe((data: any) => {
      this.categoriesList.set(data);
    });
  }
    getUnits() {
      const model={
        table:'sm_units'
      }
    this.commonService.GetDropdrown(model).subscribe((data: any) => {
      this.unitsList.set(data);
    });
  }
  Reset(){
    this.mainForm.reset();
  }
}