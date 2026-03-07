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
}
