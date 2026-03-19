import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    
     constructor(private httpClient: HttpClient) {}

   create(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/payments/create`,model)
  }
   getAll() {
   return this.httpClient.get(`${baseApiUrl}/api/payments/read`)
  }
   getOne(id:any) {
   return this.httpClient.get(`${baseApiUrl}/api/payments/get/${id}`)
  }
   update(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/payments/update`,model)
  }
   delete(id:any) {
   return this.httpClient.delete(`${baseApiUrl}/api/payments/${id}`)
  }
  getSearch(query:any) {
   return this.httpClient.get(`${baseApiUrl}/api/payments/search/${query}`)
  }
  
   bulkCreate(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/payments/bulkCreate`,model)
  }
}
