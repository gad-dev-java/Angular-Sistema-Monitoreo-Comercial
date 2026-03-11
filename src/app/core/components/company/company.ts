import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

  companies   = signal<CompanyDto[]>([]);
  isLoading   = signal(true);
  isSaving    = signal(false);
  isDeleting  = signal<number | null>(null);
  errorMsg    = signal<string | null>(null);
  successMsg  = signal<string | null>(null);
  showModal   = signal(false);
  showDeleteId = signal<number | null>(null);
  editingId   = signal<number | null>(null);
  searchTerm  = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    ruc:  ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.companies();
    return this.companies().filter(c =>
      c.name.toLowerCase().includes(term) || c.ruc.includes(term)
    );
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading.set(true);
    this.companyService.getAll().subscribe({
      next: (res) => {
        this.companies.set(res.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

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
    this.errorMsg.set(null);
    this.editingId.set(null);
  }

  confirmDelete(id: number): void {
    this.showDeleteId.set(id);
  }

  cancelDelete(): void {
    this.showDeleteId.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const { name, ruc } = this.form.value;
    const id = this.editingId();

    const obs = id
      ? this.companyService.update(id, { name: name!, ruc: ruc! } as UpdateCompanyRequest)
      : this.companyService.create({ name: name!, ruc: ruc! } as CreateCompanyRequest);

    obs.subscribe({
      next: (res) => {
        if (id) {
          this.companies.update(list => list.map(c => c.idCompany === id ? res.data : c));
          this.toast('Empresa actualizada.');
        } else {
          this.companies.update(list => [res.data, ...list]);
          this.toast('Empresa creada.');
        }
        this.isSaving.set(false);
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

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
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
 }
