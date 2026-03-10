import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../services/store';
import { CreateStoreRequest, StoreDto, UpdateStoreRequest } from '../../models/Store';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';

@Component({
  selector: 'app-store',
  imports: [ReactiveFormsModule],
  templateUrl: './store.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'store.css'
})
export class StoreComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);

  stores     = signal<StoreDto[]>([]);
  isSaving   = signal(false);
  errorMsg   = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal  = signal(false);
  editingId  = signal<number | null>(null);
  searchTerm = signal('');

  cities = ['Lima', 'Miraflores', 'San Isidro', 'Surco', 'La Molina',
            'Barranco', 'Chorrillos', 'San Borja', 'Arequipa', 'Trujillo',
            'Cusco', 'Piura', 'Chiclayo'];

  form: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    address:     ['', [Validators.required, Validators.minLength(5)]],
    city:        ['', [Validators.required]],
    companyName: ['', [Validators.required]],
  });

  get filteredStores(): StoreDto[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.stores();
    return this.stores().filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      s.companyName.toLowerCase().includes(term)
    );
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

  openEdit(store: StoreDto): void {
    this.editingId.set(store.idStore);
    this.form.patchValue({
      name: store.name, address: store.address,
      city: store.city, companyName: store.companyName,
    });
    this.errorMsg.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form.reset();
    this.editingId.set(null);
    this.errorMsg.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMsg.set(null);
    const value = this.form.value;
    const id = this.editingId();

    if (id !== null) {
      this.storeService.update(id, value as UpdateStoreRequest).subscribe({
        next: (res) => {
          this.stores.update(list => list.map(s => s.idStore === id ? res.data : s));
          this.isSaving.set(false);
          this.closeModal();
          this.toast('Local actualizado correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.errorMsg.set(parseApiError(err));
        },
      });
    } else {
      this.storeService.create(value as CreateStoreRequest).subscribe({
        next: (res) => {
          this.stores.update(list => [...list, res.data]);
          this.isSaving.set(false);
          this.closeModal();
          this.toast('Local creado correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.errorMsg.set(parseApiError(err));
        },
      });
    }
  }

  getCityInitial(city: string): string {
    return city.substring(0, 2).toUpperCase();
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}
