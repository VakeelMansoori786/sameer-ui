import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
    model: MenuItem[] = [];

   ngOnInit() {
  this.model = [
    {
      label: 'Home',
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/'] }
      ]
    },

    {
      label: 'Product',
      items: [
        { label: 'Products', icon: 'pi pi-box', routerLink: ['/product-list'] }
      ]
    },

    {
      label: 'Supplier / Customer',
      items: [
        { label: 'Suppliers', icon: 'pi pi-users', routerLink: ['/supplier-list'] }
      ]
    },

    {
      label: 'Purchase',
      items: [
        { label: 'Purchases', icon: 'pi pi-shopping-cart', routerLink: ['/purchase-list'] }
      ]
    },

    {
      label: 'Sales',
      items: [
        { label: 'Sales', icon: 'pi pi-shopping-bag', routerLink: ['/sale-list'] },
        { label: 'Payment Received', icon: 'pi pi-wallet', routerLink: ['/payment-list'] }
      ]
    },

    {
      label: 'Reports',
      items: [
        { label: 'Statements', icon: 'pi pi-chart-line', routerLink: ['/statements'] }
      ]
    },

    {
      label: 'Common',
      items: [
        { label: 'Expenses', icon: 'pi pi-money-bill', routerLink: ['/expenses'] },
        { label: 'Dropdown', icon: 'pi pi-cog', routerLink: ['/dropdown'] }
      ]
    }
  ];
}
}
