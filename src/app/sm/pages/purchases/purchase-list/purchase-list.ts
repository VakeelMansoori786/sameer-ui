import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PurchaseService } from '@/app/sm/services/purchase.service';

@Component({
selector: 'app-purchase-list',
imports: [SharedModule],
templateUrl: './purchase-list.html',
styleUrl: './purchase-list.scss',
providers: [MessageService, ConfirmationService]
})
export class PurchaseList {

mainList = signal<any[]>([]);
loading = signal(false);

constructor(
private router: Router,
private purchaseService: PurchaseService,
private confirmationService: ConfirmationService,
private messageService: MessageService
) {}

ngOnInit(): void {
this.getAll();
}

getAll() {
this.loading.set(true);

this.purchaseService.getAll().subscribe((data: any) => {
this.mainList.set(data);
this.loading.set(false);
});
}

edit(id:any){
this.router.navigate(['/purchase',{ id: btoa(id) }]);
}

delete(id:any){

this.purchaseService.delete(id).subscribe(() => {
this.mainList.set(this.mainList().filter(x=>x.id !== id));
});

}

report(id:any){
this.router.navigate(['/purchase-order',{ id: btoa(id) }]);
}

}