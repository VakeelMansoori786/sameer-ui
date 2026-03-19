import { baseApiUrl } from '@/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExpenseService {

  constructor(private http: HttpClient) {}
  create(data:any){
    return this.http.post(`${baseApiUrl}/api/expenses/create`, data);
  }

  update(data:any){
    return this.http.put(`${baseApiUrl}/api/expenses/update`, data);
  }

  delete(id:any){
    return this.http.delete(`${baseApiUrl}/api/expenses/delete/${id}`);
  }

  getAll(model:any){
    return this.http.post(`${baseApiUrl}/api/expenses/read`,model);
  }

  getOne(id:any){
    return this.http.get(`${baseApiUrl}/api/expenses/get/${id}`);
  }

  filter(data:any){
    return this.http.post(`${baseApiUrl}/api/expenses/filter`, data);
  }

  summary(data:any){
    return this.http.post(`${baseApiUrl}/api/expenses/summary`, data);
  }

}