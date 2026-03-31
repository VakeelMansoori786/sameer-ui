import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';

// ================= INTERFACES =================
interface SaleModel {
  count: number;
  total: number;
}

interface CashModel {
  card: number;
  bank: number;
  cheque: number;
  total_cash_in: number;
  total_cash_out: number;
  available_cash: number;
}

interface PurchaseModel {
  count: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class DashboardComponent implements OnInit {

  // ✅ SIGNAL STATE
  loading = signal(false);

  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);

  sale = signal<SaleModel>({ count: 0, total: 0 });

  cash = signal<CashModel>({
    card: 0,
    bank: 0,
    cheque: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    available_cash: 0
  });

  purchase = signal<PurchaseModel>({ count: 0, total: 0 });

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private commonService: CommonService,
    private productService: ProductService
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    this.toDate.set(today);
    this.fromDate.set(yesterday);

    this.GetData();
  }

  // ================= MAIN API =================
  GetData() {
    this.loading.set(true);

    const from = this.commonService.formatDate(this.fromDate());
    const to = this.commonService.formatDate(this.toDate());

    forkJoin({
      sales: this.commonService.GetTableRange({
        table: 'SALESUMCOUNT',
        from,
        to
      }),
      cash: this.commonService.GetTableRange({
        table: 'CASHDALIY',
        from,
        to
      }),
      purchase: this.commonService.GetTableRange({
        table: 'PURCHASESUMCOUNT',
        from,
        to
      })
    }).subscribe({
      next: (res: any) => {

        // ✅ SALES
        if (res.sales?.length > 0) {
          this.sale.set({
            count: res.sales[0].count || 0,
            total: res.sales[0].total || 0
          });
        } else {
          this.sale.set({ count: 0, total: 0 });
        }

        // ✅ CASH
        if (res.cash?.length > 0) {
          const d = res.cash[0];
          this.cash.set({
            card: d.card || 0,
            bank: d.bank || 0,
            cheque: d.cheque || 0,
            total_cash_in: d.total_cash_in || 0,
            total_cash_out: d.total_cash_out || 0,
            available_cash: d.availble_cash || 0
          });
        } else {
          this.resetCash();
        }

        // ✅ PURCHASE
        if (res.purchase?.length > 0) {
          this.purchase.set({
            count: res.purchase[0].count || 0,
            total: res.purchase[0].total || 0
          });
        } else {
          this.purchase.set({ count: 0, total: 0 });
        }
      },
      error: () => {
        this.sale.set({ count: 0, total: 0 });
        this.purchase.set({ count: 0, total: 0 });
        this.resetCash();
      },
      complete: () => this.loading.set(false)
    });
  }

  // ================= HELPERS =================
  private resetCash() {
    this.cash.set({
      card: 0,
      bank: 0,
      cheque: 0,
      total_cash_in: 0,
      total_cash_out: 0,
      available_cash: 0
    });
  }
}