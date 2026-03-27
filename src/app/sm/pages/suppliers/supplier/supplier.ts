import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { SupplierService } from '@/app/sm/services/supplier.service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './supplier.html',
  styleUrl: './supplier.scss',
  providers: [MessageService, ConfirmationService]
})
export class Supplier {
  mainForm!: FormGroup;

  id = signal<string>('0');

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private commonService: CommonService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.mainForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      telephone: [''], // ✅ NEW
      email: [''],
      address: [''],
      trn: [''],
      contact_person: [''], // ✅ NEW
      credit_limit: [null] // ✅ NEW
    });

    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id.set(atob(routeId));
      this.getSupplier();
    }
  }

  onSubmit() {
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      return;
    }

    const model={ 
      id:this.id(), 
      name:this.mainForm.value.name,
       phone:this.mainForm.value.phone,
        email:this.mainForm.value.email, 
        address:this.mainForm.value.address,
         trn:this.mainForm.value.trn, 
         contact_person:this.mainForm.value.contact_person, 
         credit_limit:this.mainForm.value.credit_limit, 
        }

    if (this.id() !== '0') {
      this.supplierService.update(model).subscribe(() => {
        this.messageService.add({
          key: 'tst',
          severity: 'success',
          summary: 'Success',
          detail: 'Supplier updated successfully'
        });
        this.router.navigate(['/supplier-list']);
      });
    } else {
      this.supplierService.create(model).subscribe(() => {
        this.messageService.add({
          key: 'tst',
          severity: 'success',
          summary: 'Success',
          detail: 'Supplier created successfully'
        });
        this.router.navigate(['/supplier-list']);
      });
    }
  }

  get f() {
    return this.mainForm.controls as { [key: string]: any };
  }

  getSupplier() {
    if (this.id() !== '0') {
      this.supplierService.getOne(this.id()).subscribe((data: any) => {
        if (data.length > 0) {
          this.mainForm.patchValue({
            name: data[0].name,
            phone: data[0].phone,
            telephone: data[0].telephone, // ✅ NEW
            email: data[0].email,
            address: data[0].address,
            trn: data[0].trn,
            contact_person: data[0].contact_person, // ✅ NEW
            credit_limit: data[0].credit_limit // ✅ NEW
          });
        }
      });
    }
  }

  Reset() {
    this.mainForm.reset({
      credit_limit: 0
    });
  }
}