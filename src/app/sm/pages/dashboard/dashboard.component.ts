import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ProductService } from '@/app/sm/services/product.service';
import { ChartModule } from 'primeng/chart';

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
  imports: [SharedModule,ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class DashboardComponent implements OnInit {

  // ✅ SIGNAL STATE
  loading = signal(false);

  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);

  recentSale = signal<any[]>([]);
  paymentDue = signal<any>(null);
  paymentDueList = signal<any[]>([]);
  monthSaleList = signal<any[]>([]);
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

  isVisible = false;
  chartData: any;
chartOptions: any;
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
   // yesterday.setDate(today.getDate() - 1);

    this.toDate.set(today);
    this.fromDate.set(yesterday);

    this.GetData();
  }

  // ================= MAIN API =================
 GetData() {
  this.loading.set(true);

  const from = this.commonService.formatDate(this.fromDate());
  const to = this.commonService.formatDate(this.toDate());
  let purpose = '';

  forkJoin({
    sales: this.commonService.GetTableRange({
      table: 'SALESUMCOUNT',
      from,
      to,
      purpose
    }),

    cash: this.commonService.GetTableRange({
      table: 'CASHDAILY',
      from,
      to,
      purpose
    }),

    purchase: this.commonService.GetTableRange({
      table: 'PURCHASESUMCOUNT',
      from,
      to,
      purpose
    }),

    recentSale: this.commonService.GetTableRange({
      table: 'SALE',
      from,
      to,
      purpose
    }),

    paymentDueList: this.commonService.GetTableRange({
      table: 'PAYMENTDUE',
      from,
      to,
      purpose
    }),

    monthSaleList: this.commonService.GetTableRange({
      table: 'MONTHSALE',
      from,
      to,
      purpose
    })

  }).subscribe({

    next: (res: any) => {

      // =========================================================
      // SALES
      // =========================================================
      if (res.sales?.length > 0) {

        this.sale.set({
          count: Number(res.sales[0].count || 0),
          total: Number(res.sales[0].total || 0)
        });

      } else {

        this.sale.set({
          count: 0,
          total: 0
        });

      }


      // =========================================================
      // CASH
      // =========================================================
      if (res.cash?.length > 0) {

        const d = res.cash[0];

        this.cash.set({

          card: Number(d.card_flow || 0),

          bank: Number(d.bank_flow || 0),

          cheque: Number(d.cheque_flow || 0),

          total_cash_in: Number(d.cash_flow || 0),

          total_cash_out: Number(d.total_cash_out || 0),

          available_cash: Number(d.cash_balance || 0)

        });

      } else {

        this.resetCash();

      }


      // =========================================================
      // PURCHASE
      // =========================================================
      if (res.purchase?.length > 0) {

        this.purchase.set({

          count: Number(res.purchase[0].count || 0),

          total: Number(res.purchase[0].total || 0)

        });

      } else {

        this.purchase.set({

          count: 0,

          total: 0

        });

      }


      // =========================================================
      // RECENT SALES
      // =========================================================
      if (res.recentSale?.length > 0) {

        this.recentSale.set(res.recentSale);

      } else {

        this.recentSale.set([]);

      }


      // =========================================================
      // SALES ANALYSIS
      // =========================================================
      if (res.monthSaleList?.length > 0) {

        this.monthSaleList.set(res.monthSaleList);

        const documentStyle =
          getComputedStyle(document.documentElement);

        const textColor =
          documentStyle.getPropertyValue('--text-color');

        const textMutedColor =
          documentStyle.getPropertyValue('--text-color-secondary');

        const borderColor =
          documentStyle.getPropertyValue('--surface-border');

        const primaryColor =
          documentStyle.getPropertyValue('--p-primary-500');

        const primaryLightColor =
          documentStyle.getPropertyValue('--p-primary-200');


        // ---------------------------------------------------------
        // CHART DATA
        // Sales Amount = BAR
        // Sale Count   = LINE
        // ---------------------------------------------------------
        this.chartData = {

          labels: this.monthSaleList().map(
            (d: any) => d.sale_day
          ),

          datasets: [

            // SALES AMOUNT
            {
              type: 'bar',

              label: 'Sales Amount',

              data: this.monthSaleList().map(
                (d: any) => Number(d.total_sales || 0)
              ),

              backgroundColor: primaryColor,

              borderColor: primaryColor,

              borderWidth: 0,

              borderRadius: 3,

              barThickness: 22,

              maxBarThickness: 28,

              yAxisID: 'y'
            },


            // SALE COUNT
            {
              type: 'line',

              label: 'Sale Count',

              data: this.monthSaleList().map(
                (d: any) => Number(d.sale_count || 0)
              ),

              borderColor: textMutedColor,

              backgroundColor: textMutedColor,

              borderWidth: 2,

              pointRadius: 3,

              pointHoverRadius: 5,

              pointBackgroundColor: textMutedColor,

              pointBorderColor: textMutedColor,

              tension: 0.3,

              fill: false,

              yAxisID: 'y1'
            }

          ]

        };


        // =========================================================
        // CHART OPTIONS
        // =========================================================
        this.chartOptions = {

          responsive: true,

          maintainAspectRatio: false,

          interaction: {

            mode: 'index',

            intersect: false

          },


          plugins: {

            legend: {

              position: 'top',

              align: 'start',

              labels: {

                color: textColor,

                usePointStyle: true,

                pointStyle: 'rectRounded',

                boxWidth: 8,

                boxHeight: 8,

                padding: 18,

                font: {

                  family: 'Segoe UI',

                  size: 12

                }

              }

            },


            tooltip: {

              mode: 'index',

              intersect: false,

              padding: 10,

              backgroundColor: '#ffffff',

              titleColor: textColor,

              bodyColor: textColor,

              borderColor: borderColor,

              borderWidth: 1,

              displayColors: true,

              callbacks: {

                label: (context: any) => {

                  const label =
                    context.dataset.label || '';

                  const value =
                    context.parsed.y ?? 0;


                  if (label === 'Sales Amount') {

                    return ` Sales Amount: AED ${Number(value)
                      .toLocaleString('en-AE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`;

                  }


                  if (label === 'Sale Count') {

                    return ` Sale Count: ${Number(value)
                      .toLocaleString('en-AE', {
                        maximumFractionDigits: 0
                      })}`;

                  }


                  return ` ${label}: ${value}`;

                }

              }

            }

          },


          scales: {

            // =====================================================
            // X AXIS
            // =====================================================
            x: {

              grid: {

                display: false

              },

              ticks: {

                color: textMutedColor,

                font: {

                  family: 'Segoe UI',

                  size: 11

                },

                maxRotation: 0,

                autoSkip: true,

                maxTicksLimit: 15

              },

              border: {

                color: borderColor

              }

            },


            // =====================================================
            // LEFT Y AXIS - SALES AMOUNT
            // =====================================================
            y: {

              position: 'left',

              beginAtZero: true,

              grid: {

                color: borderColor,

                drawBorder: false

              },

              border: {

                display: false

              },

              ticks: {

                color: textMutedColor,

                padding: 8,

                font: {

                  family: 'Segoe UI',

                  size: 11

                },

                callback: (value: any) => {

                  const numberValue =
                    Number(value);

                  if (numberValue >= 1000000) {

                    return `AED ${(numberValue / 1000000)
                      .toFixed(1)}M`;

                  }

                  if (numberValue >= 1000) {

                    return `AED ${(numberValue / 1000)
                      .toFixed(0)}K`;

                  }

                  return `AED ${numberValue}`;

                }

              },

              title: {

                display: true,

                text: 'Sales Amount (AED)',

                color: textMutedColor,

                font: {

                  family: 'Segoe UI',

                  size: 11,

                  weight: 'normal'

                }

              }

            },


            // =====================================================
            // RIGHT Y AXIS - SALE COUNT
            // =====================================================
            y1: {

              position: 'right',

              beginAtZero: true,

              grid: {

                drawOnChartArea: false

              },

              border: {

                display: false

              },

              ticks: {

                color: textMutedColor,

                padding: 8,

                stepSize: 1,

                font: {

                  family: 'Segoe UI',

                  size: 11

                },

                callback: (value: any) => {

                  return Number(value).toLocaleString('en-AE');

                }

              },

              title: {

                display: true,

                text: 'Sale Count',

                color: textMutedColor,

                font: {

                  family: 'Segoe UI',

                  size: 11,

                  weight: 'normal'

                }

              }

            }

          }

        };

      } else {

        this.monthSaleList.set([]);

        this.chartData = {

          labels: [],

          datasets: []

        };

        this.chartOptions = {};

      }


      // =========================================================
      // PAYMENT DUE LIST
      // =========================================================
      if (res.paymentDueList?.length > 0) {

        this.paymentDueList.set(
          res.paymentDueList
        );


        const totalDue =
          res.paymentDueList.reduce(
            (sum: number, item: any) => {

              return sum +
                Number(
                  item.due_amount || 0
                );

            },
            0
          );


        this.paymentDue.set(totalDue);

      } else {

        this.paymentDueList.set([]);

        this.paymentDue.set(0);

      }

    },


    // ===========================================================
    // ERROR
    // ===========================================================
    error: (error: any) => {

      console.error(
        'Dashboard GetData Error:',
        error
      );


      this.sale.set({

        count: 0,

        total: 0

      });


      this.purchase.set({

        count: 0,

        total: 0

      });


      this.recentSale.set([]);

      this.monthSaleList.set([]);

      this.paymentDueList.set([]);

      this.paymentDue.set(0);

      this.resetCash();

      this.chartData = {

        labels: [],

        datasets: []

      };

      this.chartOptions = {};

    },


    // ===========================================================
    // COMPLETE
    // ===========================================================
    complete: () => {

      this.loading.set(false);

    }

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
    edit(id:any){
      this.router.navigate(['/sale',{ id: btoa(id) },]);
  }
  
   invoice(id:any){
      this.router.navigate(['/invoice',{ id: btoa(id) },]);
  }
    showDue() {
    this.isVisible = true;
  
  }
  payment(customerId:any){
      
 this.router.navigate(['/payment-received',{ customer: btoa(customerId) },]);
  }
  GetDataByCustomer(customerId: any) {
  
    this.router.navigate(['/sale-list'], {
  queryParams: {
    purpose: customerId
   
  }
});
  }
}