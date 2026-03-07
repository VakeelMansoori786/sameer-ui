import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

   constructor(private httpClient: HttpClient) {}

   create(model:any) {
   return this.httpClient.post(`${baseApiUrl}/api/suppliers/create`,model)
  }
   getAll() {
   return this.httpClient.get(`${baseApiUrl}/api/suppliers/read`)
  }
   getOne(id:any) {
   return this.httpClient.get(`${baseApiUrl}/api/suppliers/get/${id}`)
  }
   update(model:any) {
   return this.httpClient.put(`${baseApiUrl}/api/suppliers/update`,model)
  }
   delete(id:any) {
   return this.httpClient.delete(`${baseApiUrl}/api/suppliers/delete/${id}`)
  }
}
