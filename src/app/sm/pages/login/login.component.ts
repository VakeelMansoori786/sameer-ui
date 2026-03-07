
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { LocalStore } from '../../services/local-store';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';
import { SharedModule } from '../../common/shared/shared-module';
@Component({
  selector: 'app-login',
   standalone: true,
    imports: [SharedModule, AppFloatingConfigurator],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
    providers: [MessageService]
})
export class LoginComponent  implements OnInit {
  model: any = {};
  list:any = {};
    loading = false;
    returnUrl: any;
    mainForm :any;
    errorMessage = '';
    constructor(
      private fb:FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private ls:LocalStore,
        private authService: AuthService,
        private messageService: MessageService
      ) { }

    ngOnInit() {
      this.mainForm=this.fb.group({
  
        Username:['',Validators.required],
        Password:['',Validators.required]
       
      
      });
      
  if(this.authService.isLoggedIn()){
    this.router.navigateByUrl("/");
    
  }

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }
 get f() {
    return this.mainForm.controls;
  }
   login(model: any) {
  

  if (!this.mainForm.valid) {
    this.mainForm.markAllAsTouched();
    this.messageService.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'Please enter all the required fields.' 
    });
    return;
  }

  this.loading = true;

  const request = {
    username: model.Username,
    password: model.Password
  };
  this.authService.login(request).subscribe({
    
      next: (userData:any) => {
          this.loading = false;
        this.router.navigate(['/dashboard'])
          this.authService.setUserAndToken(userData.token, userData, true);
        this.authService.makeLogin(this.returnUrl);
      },
      error: err => {
          this.loading = false;
        this.messageService.add({ 
          key: 'tst',
          severity: 'error', 
          summary: 'Login Failed', 
          detail: err.error.message || 'Check credentials' 
        });
      }
     
    });
 
}

  
}
