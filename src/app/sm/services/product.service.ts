import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

     constructor(private httpClient: HttpClient) {}

   create(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/products/create`,model)
  }
   getAll() {
   return this.httpClient.get(`${baseApiUrl}/api/products/read`)
  }
   getOne(id:any) {
   return this.httpClient.get(`${baseApiUrl}/api/products/get/${id}`)
  }
   update(model:any) {
   return this.httpClient.put(`${baseApiUrl}/api/products/update`,model)
  }
   delete(id:any) {
   return this.httpClient.delete(`${baseApiUrl}/api/products/delete/${id}`)
  }
  getSearch(query:any) {
   return this.httpClient.get(`${baseApiUrl}/api/products/search/${query}`)
  }

}
