import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LocalStore } from './local-store';
import { baseApiUrl } from '@/app/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
token:any;
  isAuthenticated:any;
  signingIn:any;
  return:any;
  user:any;

  jwtToken="token";
  appUser="user";
  isLogging="isLogging";

  constructor(private httpClient: HttpClient,
     private router:Router, private ls:LocalStore) {}

   login(model:any) {
     return this.httpClient.post(`${baseApiUrl}/api/auth/login`,model)
    }
 
public makeLogin(returnUrl:any){
  
   if(this.isLoggedIn()){
     this.router.navigateByUrl(returnUrl)
   }
 }
 public getMenuList(){
  
  return this.ls.getItem('menu')
}

 public signOut(){
   this.setUserAndToken(null,null,false);
   this.ls.clear();
   
 }
 isLoggedIn():Boolean{
if(this.getJwtToken()) return true;
else return false;
 }
 getJwtToken(){
   return this.ls.getItem(this.jwtToken)
 }
 getUser(){
   return this.ls.getItem(this.appUser)
 }
 
 setUserAndToken(token:any,user:any,isAuthenticated:any){

   this.ls.setItem(this.jwtToken,token);
   this.ls.setItem(this.appUser,user);
   this.ls.setItem(this.isLogging,isAuthenticated);
 }

 

 getSession(name:any){
  return this.ls.getItem(name)
 }
 setSession(key:any,value:any){
   this.ls.setItem(key,value)
 }
 removeSession(key:any){
  this.ls.removeItem(key)
 }
}