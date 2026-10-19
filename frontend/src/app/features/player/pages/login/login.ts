import { Component } from '@angular/core';
import { User } from '../../../../shared/interfaces/user';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {

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
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: [''],
      accept: ['']
    });
  }

  validateLogIn(){
    console.log('Login')
  }

}
