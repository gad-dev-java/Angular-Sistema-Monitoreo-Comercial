import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/Auth';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { parseApiError } from '../../utils/parseApiError';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:'login.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ─── Estado ───────────────────────────────────────────────────────────────
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ─── Helpers de validación ────────────────────────────────────────────────

  get emailControl() {
    return this.form.get('email')!;
  }

  get passwordControl() {
    return this.form.get('password')!;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field)!;
    return control.invalid && (control.dirty || control.touched);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(parseApiError(err));
      },
    });
  }
}
