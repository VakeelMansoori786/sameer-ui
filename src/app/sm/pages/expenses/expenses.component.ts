import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedModule } from '@/app/sm/common/shared/shared-module';
import { CommonService } from '@/app/sm/services/common-service';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { ExpenseService } from '../../services/expense-service';

@Component({
  selector: 'app-expenses',
  imports: [SharedModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss'], // corrected
  providers: [MessageService, ConfirmationService]
})
export class ExpensesComponent {

  form!: FormGroup;
  list = signal<any[]>([]);
  categories = signal<any[]>([]);
  categorySummary = signal<any[]>([]);
  loading = signal(false);
  editMode = false;
  fromDate: any;
  toDate: any;
  totalExpense: number = 0;
  isVisible = false;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private confirm: ConfirmationService,
    private toast: MessageService,
    private common: CommonService
  ) {}

  ngOnInit() {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.initForm();
    this.loadCategories();
    this.applyFilter();
  }

  initForm() {
    this.form = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      category_id: [null, Validators.required],
      amount: [null, Validators.required],
      expense_date: [new Date(), Validators.required],
      description: [''],
      is_vat_applicable: [false] // VAT toggle
    });
  }

  loadData() {
    const payload = {
      from: this.common.formatDate(this.fromDate),
      to: this.common.formatDate(this.toDate)
    };
    this.expenseService.getAll(payload).subscribe((res: any) => {
      this.list.set(res);
    });
  }

  loadCategories() {
    const model = { table: 'sm_expense_categories' };
    this.common.GetDropdrown(model).subscribe((data: any) => {
      this.categories.set(data);
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = {
      id: this.form.value.id,
      title: this.form.value.title,
      category_id: this.form.value.category_id,
      amount: this.form.value.amount,
      expense_date: this.common.formatDate(this.form.value.expense_date),
      description: this.form.value.description,
      is_vat_applicable: this.form.value.is_vat_applicable
    };

    this.loading.set(true);

    if (this.editMode) {
      this.expenseService.update(data).subscribe(() => {
        this.toast.add({ severity: 'success', summary: 'Updated' });
        this.reset();
        this.loadData();
        this.loading.set(false);
        this.isVisible = false;
      });
    } else {
      this.expenseService.create(data).subscribe(() => {
        this.toast.add({ severity: 'success', summary: 'Created' });
        this.reset();
        this.loadData();
        this.loading.set(false);
        this.isVisible = false;
      });
    }
  }

  edit(row: any) {
    this.form.patchValue({
      ...row,
      expense_date: row.expense_date ? new Date(row.expense_date.split('T')[0]) : null
    });
    this.editMode = true;
    this.isVisible = true;
  }

  delete(id: any) {
    this.confirm.confirm({
      message: 'Delete this expense?',
      accept: () => {
        this.expenseService.delete(id).subscribe(() => {
          this.list.set(this.list().filter(x => x.id !== id));
          this.toast.add({ severity: 'success', summary: 'Deleted' });
        });
      }
    });
  }

  reset() {
    this.form.reset({ expense_date: new Date(), is_vat_applicable: false });
    this.editMode = false;
  }

  resetFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.loadData();
  }

  applyFilter() {
    const data = {
      from: this.common.formatDate(this.fromDate),
      to: this.common.formatDate(this.toDate)
    };

    this.expenseService.filter(data).subscribe((res: any) => {
      this.list.set(res);
    });

    this.expenseService.summary(data).subscribe((res: any) => {
      this.categorySummary.set(res);
      this.totalExpense = res.reduce(
        (sum: number, item: { category: string; total: string }) =>
          sum + Number(item.total),
        0
      );
    });
  }

  exportExcel() {
    const data = this.list();
    if (!data || data.length === 0) return;

    const headers = ['Date', 'Title', 'Category', 'Amount', 'VAT'];
    const rows = data.map((x: any) => [
      x.expense_date,
      x.title,
      x.category_name,
      x.amount,
      x.is_vat_applicable ? 'Yes' : 'No'
    ]);

    let csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
  }

  add() {
    this.isVisible = true;
    this.reset();
  }

  getCardColor(i: number) {
    return ['bg-blue-100 dark:bg-blue-400/10', 'bg-orange-100 dark:bg-orange-400/10', 'bg-cyan-100 dark:bg-cyan-400/10', 'bg-purple-100 dark:bg-purple-400/10'][i % 4];
  }

  getCardIcon(i: number) {
    return ['pi-home text-blue-500', 'pi-shopping-cart text-orange-500', 'pi-briefcase text-cyan-500', 'pi-wallet text-purple-500'][i % 4];
  }

}