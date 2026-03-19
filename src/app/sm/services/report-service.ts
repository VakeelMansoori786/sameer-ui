import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    
   constructor(private httpClient: HttpClient) {}

   customerLedger(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/reports/customer-ledger`,model)
  }
}
