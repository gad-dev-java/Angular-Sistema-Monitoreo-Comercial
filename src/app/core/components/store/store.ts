import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreService } from '../../services/store';
import { CreateStoreRequest, StoreDto, UpdateStoreRequest } from '../../models/Store';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';
import { AuthService } from '../../services/Auth';

const PERU_CITIES = [
  'Lima','Miraflores','San Isidro','Surco','La Molina','Barranco',
  'San Borja','Lince','Jesús María','Magdalena','Pueblo Libre',
  'Arequipa','Cusco','Trujillo','Chiclayo','Piura','Iquitos',
  'Huancayo','Pucallpa','Tacna','Ica','Cajamarca','Puno','Ayacucho',
];

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
  private readonly authService  = inject(AuthService);

  readonly cities = PERU_CITIES;
  stores     = signal<StoreDto[]>([]);
  isLoading  = signal(true);
  isSaving   = signal(false);
  errorMsg   = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal  = signal(false);
  editingId  = signal<number | null>(null);
  searchTerm = signal('');

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    address:     ['', [Validators.required]],
    city:        ['', [Validators.required]],
    companyName: ['', [Validators.required]],
  });

  filteredStores = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.stores();
    return this.stores().filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.city?.toLowerCase().includes(term) ||
      s.companyName?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoading.set(false); return; }
    this.loadStores(companyId);
  }

  loadStores(companyId: number): void {
    this.isLoading.set(true);
    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        this.stores.set(res.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  getCityInitial(city: string): string {
    return city ? city.charAt(0).toUpperCase() : '?';
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
    this.errorMsg.set(null);
    this.editingId.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const v = this.form.value;
    const id = this.editingId();

    const obs = id
      ? this.storeService.update(id, v as UpdateStoreRequest)
      : this.storeService.create(v as CreateStoreRequest);

    obs.subscribe({
      next: (res) => {
        if (id) {
          this.stores.update(list => list.map(s => s.idStore === id ? res.data : s));
          this.toast('Local actualizado.');
        } else {
          this.stores.update(list => [res.data, ...list]);
          this.toast('Local creado.');
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

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}
