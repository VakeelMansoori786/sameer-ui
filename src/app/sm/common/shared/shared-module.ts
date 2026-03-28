import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {  SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { IndianCurrencyPipe } from '../indian-currency.pipe';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';

@NgModule({
    declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RippleModule,
    CheckboxModule,
    ToastModule,
    TooltipModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    ConfirmPopupModule,
    ConfirmDialogModule,
    TextareaModule,
    AutoCompleteModule,
    DialogModule,
    DatePickerModule
  ],
  exports: [
    // Export modules so other modules can use them
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RippleModule,
    CheckboxModule,
    ToastModule,
    TooltipModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    ConfirmPopupModule,
    ConfirmDialogModule,
    TextareaModule,
    AutoCompleteModule,
    DialogModule,
    DatePickerModule,
SkeletonModule
    
  ]
})
export class SharedModule {}
