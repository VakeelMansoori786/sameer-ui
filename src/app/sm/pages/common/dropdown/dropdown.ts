import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-dropdown',
   
       imports: [SharedModule],
    templateUrl: './dropdown.html',
    styleUrl: './dropdown.scss',
    providers: [MessageService,ConfirmationService]
})
export class Dropdown {
      mainForm!: FormGroup;
    tableList = signal<any[]>([]);
  mainList = signal<any[]>([]);
  loading = signal(false);
 constructor(private fb: FormBuilder,private commonService:CommonService,private confirmationService:ConfirmationService,private messageService:MessageService) {}
  ngOnInit(): void {
    this.mainForm = this.fb.group({
      table: [null, Validators.required],
      name: ['', Validators.required]
    });
    this.GetAllDropdown();
  }
  GetAllDropdown() {
    this.commonService.GetAllDropdrown().subscribe((data: any) => {
      this.tableList.set(data);
    });
  }
  Add(){
 if (!this.mainForm.valid) {
      this.mainForm.markAllAsTouched();
      this.messageService.add({
        key: 'tst',
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields'
      });
      return;
    }
    
  this.loading.set(true);

  const model = {
    table: this.mainForm.value.table,
    name: this.mainForm.value.name,

  };
 this.commonService.AddDropdrownValue(model).subscribe({
    
      next: (data:any) => {
            this.loading.set(false);
       this.messageService.add({ 
          key: 'tst',
          severity: 'success', 
          summary: 'success', 
          detail: data.message
        });
        this.mainForm.patchValue({
          name:''
        });
        this.GetDropdownTable();
      },
      error: err => {
                  this.loading.set(false);
        this.messageService.add({ 
          key: 'tst',
          severity: 'error', 
          summary: 'error', 
          detail: err.error.message || 'Check error' 
        });
      }
     
    });
  }
    GetDropdownTable() {
      const model={
        table:this.mainForm.value.table
      }
    this.commonService.GetDropdrown(model).subscribe((data: any) => {
      this.mainList.set(data);
    });
  }
 
  Delete(id: number) {
    
        this.confirmationService.confirm({
            target:  new EventTarget(),
             message: 'Are you sure you want to delete?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
              const model={
                id:id,
                table:this.mainForm.value.table
              }
               this.commonService.DeleteDropdrownValue(model).subscribe({
    
      next: (data:any) => {
           this.loading.set(false);
       this.messageService.add({ 
          key: 'tst',
          severity: 'success', 
          summary: 'success', 
          detail: data.message
        });
this.mainList.set(this.mainList().filter((x:any)=>x.id!==id));
      },
      error: err => {
           this.loading.set(false);
        this.messageService.add({ 
          key: 'tst',
          severity: 'error', 
          summary: 'error', 
          detail: err.error.message || 'Check error' 
        });
      }
     
    });
            },
            reject: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Rejected',
                    detail: 'You have rejected'
                });
            }
        });
    }
}
