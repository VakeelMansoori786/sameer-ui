import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class SaleService {

       constructor(private httpClient: HttpClient) {}
       
   create(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/sales/create`,model)
  }
   getAll() {
   return this.httpClient.get(`${baseApiUrl}/api/sales/read`)
  }
   getOne(id:any) {
   return this.httpClient.get(`${baseApiUrl}/api/sales/get/${id}`)
  }
   update(model:any) {
   return this.httpClient.put(`${baseApiUrl}/api/sales/update`,model)
  }
   delete(id:any) {
   return this.httpClient.delete(`${baseApiUrl}/api/sales/${id}`)
  }
  
}
