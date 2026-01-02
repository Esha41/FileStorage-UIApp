import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

interface TestUser {
  username: string;
  password: string;
  role: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  // Hardcoded users from backend
  testUsers: TestUser[] = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'Admin'
    },
    {
      username: 'user',
      password: 'user123',
      role: 'User'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  fillCredentials(user: TestUser): void {
    this.loginForm.patchValue({
      username: user.username,
      password: user.password
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { username, password } = this.loginForm.value;

    try {
      if (this.authService.isAuthenticated()) {
        this.authService.logout();
      }

      // Generate mock JWT (no real backend needed)
      const { token, user } = this.authService.login(username, password);
      
      if (token) {
        this.router.navigate(['/storage']);
      } else {
        this.errorMessage = 'Login failed. Please try again.';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred during login. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
