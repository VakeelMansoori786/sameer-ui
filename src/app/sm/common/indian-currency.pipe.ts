import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianCurrency'
})
export class IndianCurrencyPipe implements PipeTransform {
  transform(value: number | string, fractionDigits: number = 2): string {
    if (value === null || value === undefined || isNaN(+value)) {
      return '';
    }

    const amount = Number(value);

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(amount);

    return `₹${formattedAmount}`;
  }
}
