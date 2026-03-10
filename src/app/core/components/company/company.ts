import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyDto, CreateCompanyRequest, UpdateCompanyRequest } from '../../models/Company';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';
import { CompanyService } from '../../services/Company';

@Component({
  selector: 'app-company',
  imports: [ReactiveFormsModule],
  templateUrl: './company.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'company.css',
})
export class CompanyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);

  companies = signal<CompanyDto[]>([]);
  isSaving   = signal(false);
  isDeleting = signal<number | null>(null);
  errorMsg   = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal    = signal(false);
  editingId    = signal<number | null>(null);
  showDeleteId = signal<number | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    ruc:  ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
  });

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.errorMsg.set(null);
    this.showModal.set(true);
  }

  openEdit(company: CompanyDto): void {
    this.editingId.set(company.idCompany);
    this.form.patchValue({ name: company.name, ruc: company.ruc });
    this.errorMsg.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form.reset();
    this.editingId.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSaving.set(true);
    this.errorMsg.set(null);
    const value = this.form.value;
    const id = this.editingId();

    if (id !== null) {
      this.companyService.update(id, value as UpdateCompanyRequest).subscribe({
        next: (res) => {
          this.companies.update(list => list.map(c => c.idCompany === id ? res.data : c));
          this.isSaving.set(false);
          this.closeModal();
          this.toast('Empresa actualizada correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.errorMsg.set(parseApiError(err));
        },
      });
    } else {
      this.companyService.create(value as CreateCompanyRequest).subscribe({
        next: (res) => {
          this.companies.update(list => [...list, res.data]);
          this.isSaving.set(false);
          this.closeModal();
          this.toast('Empresa creada correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.errorMsg.set(parseApiError(err));
        },
      });
    }
  }

  confirmDelete(id: number): void { this.showDeleteId.set(id); }
  cancelDelete(): void { this.showDeleteId.set(null); }

  onDelete(id: number): void {
    this.isDeleting.set(id);
    this.companyService.delete(id).subscribe({
      next: () => {
        this.companies.update(list => list.filter(c => c.idCompany !== id));
        this.isDeleting.set(null);
        this.showDeleteId.set(null);
        this.toast('Empresa eliminada.');
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(null);
        this.showDeleteId.set(null);
        this.toast(parseApiError(err));
      },
    });
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
 }
