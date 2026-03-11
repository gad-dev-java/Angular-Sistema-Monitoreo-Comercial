import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/User';
import { AuthService } from '../../services/Auth';
import { StoreService } from '../../services/store';
import { UserDto } from '../../models/User';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';

@Component({
  selector: 'app-user',
  imports: [ReactiveFormsModule],
  templateUrl: './User.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'User.css'
})
export class UserComponent implements OnInit{
  private readonly fb           = inject(FormBuilder);
  private readonly userService  = inject(UserService);
  private readonly authService  = inject(AuthService);
  private readonly storeService = inject(StoreService);

  isSubmitting  = signal(false);
  isLoadingCompany = signal(true);
  errorMsg      = signal<string | null>(null);
  successMsg    = signal<string | null>(null);
  createdUsers  = signal<UserDto[]>([]);
  showPassword  = signal(false);
  companyName   = signal<string | null>(null); // se carga del primer store

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role:     ['ROLE_SUPERVISOR', Validators.required],
  });

  roles = [
    { value: 'ROLE_ADMIN',       label: 'Administrador', desc: 'Gestiona empresas, locales y usuarios' },
    { value: 'ROLE_GERENTE',     label: 'Gerente',       desc: 'Gestiona objetivos y alertas' },
    { value: 'ROLE_SUPERVISOR',  label: 'Supervisor',    desc: 'Registra ventas y ve KPIs' },
  ];

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoadingCompany.set(false); return; }

    // Obtiene el nombre de la empresa desde el primer store
    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        const name = res.data[0]?.companyName ?? null;
        this.companyName.set(name);
        this.isLoadingCompany.set(false);
      },
      error: () => this.isLoadingCompany.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const company = this.companyName();
    if (!company) { this.errorMsg.set('No se pudo determinar la empresa.'); return; }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);

    const { name, email, password, role } = this.form.getRawValue();

    this.userService.create({
      name: name!, email: email!, password: password!,
      role: role!, companyName: company,
    }).subscribe({
      next: (res) => {
        this.createdUsers.update(list => [res.data, ...list]);
        this.form.reset({ role: 'ROLE_SUPERVISOR' });
        this.isSubmitting.set(false);
        this.toast('Usuario creado correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getRoleLabel(role: string): string {
    return this.roles.find(r => r.value === role)?.label ?? role;
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 4000);
  }
}
