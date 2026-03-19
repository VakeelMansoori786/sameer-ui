import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { AuthGuard } from './app/sm/guards/auth.guard';
import { LoginComponent } from './app/sm/pages/login/login.component';
import { Product } from './app/sm/pages/products/product/product';
import { Dropdown } from './app/sm/pages/common/dropdown/dropdown';
import { ProductList } from './app/sm/pages/products/product-list/product-list';
import { Supplier } from './app/sm/pages/suppliers/supplier/supplier';
import { SupplierList } from './app/sm/pages/suppliers/supplier-list/supplier-list';
import { SalesComponent } from './app/sm/pages/sales/sales.component';
import { SaleList } from './app/sm/pages/sales/sale-list/sale-list';
import { Invoice } from './app/sm/pages/sales/invoice/invoice';
import { Purchase } from './app/sm/pages/purchases/purchase/purchase';
import { PurchaseList } from './app/sm/pages/purchases/purchase-list/purchase-list';
import { PurchaseOrder } from './app/sm/pages/purchases/purchase-order/purchase-order';
import { Proforma } from './app/sm/pages/sales/proforma/proforma';
import { DeliveryNote } from './app/sm/pages/sales/delivery-note/delivery-note';
import { PaymentReceived } from './app/sm/pages/sales/payment-received/payment-received';
import { PaymentList } from './app/sm/pages/sales/payment-list/payment-list';
import { Statement } from './app/sm/pages/reports/statement/statement';
import { ExpensesComponent } from './app/sm/pages/expenses/expenses.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
         canActivate: [AuthGuard], // Applying AuthGuard to the main layout component
        children: [
            { path: 'dropdown', component: Dropdown },
            { path: 'expenses', component: ExpensesComponent },
            { path: 'product', component: Product },
            { path: 'product-list', component: ProductList },
            
            { path: 'supplier', component: Supplier },
            { path: 'supplier-list', component: SupplierList },
            { path: 'sale', component: SalesComponent },
            { path: 'sale-list', component: SaleList },
            { path: 'payment-received', component: PaymentReceived },
            { path: 'payment-list', component: PaymentList },
            { path: 'invoice', component: Invoice },
            { path: 'proforma', component: Proforma },
            { path: 'delivery-note', component: DeliveryNote },

            
            { path: 'purchase', component: Purchase },
            { path: 'purchase-list', component: PurchaseList },
            { path: 'purchase-order', component: PurchaseOrder },


            { path: 'statements', component: Statement },


            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '/notfound' }
    
];
