import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-product-list',
       imports: [SharedModule],
    templateUrl: './product-list.html',
    styleUrl: './product-list.scss',
    providers: [MessageService,ConfirmationService]
})
export class ProductList {
    
  mainList = signal<any[]>([]);
  loading = signal(false);
  constructor(private router: Router,private productService:ProductService,private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}

    ngOnInit(): void {
   
    this.getAll();
  }
    getAll() {
        this.loading.set(true);
    this.productService.getAll().subscribe((data: any) => {
      this.mainList.set(data);
           this.loading.set(false);
    });
  }
  delete(id:any){
     this.productService.delete(id).subscribe((data: any) => {
this.mainList.set(this.mainList().filter(x=>x.id!==id));
    });
  }
  edit(id:any){
      this.router.navigate(['/product',{ id: btoa(id) },]);
  }
}
