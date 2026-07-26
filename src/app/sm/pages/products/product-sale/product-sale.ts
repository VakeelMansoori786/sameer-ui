import {
    Component,
    effect,
    input,
    signal
} from '@angular/core';

import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { ProductService } from '@/app/sm/services/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-product-sale',
    standalone: true,
    imports: [SharedModule],
    templateUrl: './product-sale.html',
    styleUrl: './product-sale.scss',
    providers: [MessageService, ConfirmationService]
})
export class ProductSaleComponent {

    customer_id = input<number>();
    product_id = input<number>();

    mainList = signal<any[]>([]);
    loading = signal(false);

    constructor(
        private productService: ProductService,
        private messageService: MessageService
    ) {
        effect(() => {
            
            const customerId = this.customer_id();
            const productId = this.product_id();

            if (customerId == null || productId == null) {
                return;
            }

            this.getSaleProduct(customerId, productId);
        });
    }

    getSaleProduct(customerId: number, productId: number): void {
        this.loading.set(true);

        this.productService.getSaleProduct(customerId, productId).subscribe({
            next: (data:any) => {
                this.mainList.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load sale products.'
                });
            }
        });
    }
}