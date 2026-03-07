import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LocalStore } from '../services/local-store';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> => {
  const authService = inject(AuthService);
  const ls = inject(LocalStore);
  const router = inject(Router);

  const token = ls.getItem('token');
  const isLoggedIn = authService.isLoggedIn();

  // Clone request with Authorization header if user is logged in
  const authReq = isLoggedIn
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      debugger
      if (error.status === 400 && error?.error?.message==="Invalid token.") {
        // Clear token and redirect to login
        ls.setItem('token', null);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};