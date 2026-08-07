import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CommonService {
     constructor(private httpClient: HttpClient) {}

     GetAllDropdrown() {
   return this.httpClient.get(`${baseApiUrl}/api/setting/get-all-table`)
  }
   AddDropdrownValue(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/setting/add-dropdown`,model)
  }
    DeleteDropdrownValue(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/setting/delete-dropdown`,model)
  }
  GetDropdrown(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/setting/get-dropdown`,model)
  }

  GetTableRange(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/setting/table_range`,model)
  }
  formatDate(date:any){
  if(!date) return null;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');

  return `${year}-${month}-${day}`;
}formatDateDDMMYYY(date:any){
  if(!date) return null;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');

  return `${day}-${month}-${year}`;
}
  amountToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertLessThan1000(num: number): string {
    let word = '';

    if (num >= 100) {
      word += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 20) {
      word += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num > 0) {
      word += ones[num] + ' ';
    }

    return word.trim();
  }

  function convert(num: number): string {
    if (num === 0) return 'Zero';

    const parts = [
      { value: 1000000000, name: 'Billion' },
      { value: 1000000, name: 'Million' },
      { value: 1000, name: 'Thousand' }
    ];

    let words = '';

    for (const part of parts) {
      if (num >= part.value) {
        words +=
          convertLessThan1000(Math.floor(num / part.value)) +
          ' ' +
          part.name +
          ' ';
        num %= part.value;
      }
    }

    if (num > 0) {
      words += convertLessThan1000(num);
    }

    return words.trim();
  }

  const dirhams = Math.floor(amount);
  const fils = Math.round((amount - dirhams) * 100);

  let result = `AED ${convert(dirhams)}`;

  if (fils > 0) {
    result += ` and ${convert(fils)} Fils`;
  }

  return result + ' Only';
}
}
