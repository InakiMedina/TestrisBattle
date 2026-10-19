import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../../shared/interfaces/user';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-signin',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})

export class Signin {
  private router = inject(Router);

  form: FormGroup;

  user: User = {
    name: '',
    email: '',
    password: '',
    confirm: '',
    accept: false
  }

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required, Validators.minLength(8)]],
      accept: [false, Validators.requiredTrue]
    },{
      validators: () => this.matchPasswords()
    });
  }

  validateSignIn(){
    console.log('Login')
  }

  onSignin(){
    this.router.navigate(['/home']);
  }

  matchPasswords() {
    if(!this.form)
      return null;
    const { password, confirm } = this.form.getRawValue();
    if (password === confirm) {
      return null;
    } else {
      return { mismatch: true };
    }
  }

}
