import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(private httpClient: HttpClient) {}
       
   create(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/purchases/create`,model)
  }
   getAll() {
   return this.httpClient.get(`${baseApiUrl}/api/purchases/read`)
  }
   getOne(id:any) {
   return this.httpClient.get(`${baseApiUrl}/api/purchases/get/${id}`)
  }
   update(model:any) {
   return this.httpClient.put(`${baseApiUrl}/api/purchases/update`,model)
  }
   delete(id:any) {
   return this.httpClient.delete(`${baseApiUrl}/api/purchases/${id}`)
  }
  getSearch(query:any) {
   return this.httpClient.get(`${baseApiUrl}/api/products/search/${query}`)
  }
}
