import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SaleService } from "../../services/sale";
import { CreateSaleRequest, SaleDto } from "../../models/Sale";
import { HttpErrorResponse } from "@angular/common/http";
import { parseApiError } from "../../utils/parseApiError";
import { StoreDto } from "../../models/Store";
import { StoreService } from "../../services/store";
import { AuthService } from "../../services/Auth";


@Component({
  selector: 'app-sale',
  imports: [ReactiveFormsModule],
  templateUrl: './sale.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'sale.css'
})
export class SaleComponent {
  private readonly fb           = inject(FormBuilder);
  private readonly saleService  = inject(SaleService);
  private readonly storeService = inject(StoreService);
  private readonly authService  = inject(AuthService);

  stores         = signal<StoreDto[]>([]);
  selectedStore  = signal<StoreDto | null>(null);
  sales          = signal<SaleDto[]>([]);
  isLoadingStores = signal(true);
  isLoadingSales  = signal(false);
  isSaving        = signal(false);
  errorMsg        = signal<string | null>(null);
  successMsg      = signal<string | null>(null);
  showModal       = signal(false);
  searchTerm      = signal('');

  form = this.fb.group({
    storeName:   ['', [Validators.required]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.sales();
    return this.sales().filter(s =>
      s.storeName.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  });

  totalAmount = computed(() =>
    this.sales().reduce((sum, s) => sum + s.amount, 0)
  );

  totalFiltered = computed(() =>
    this.filtered().reduce((sum, s) => sum + s.amount, 0)
  );

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoadingStores.set(false); return; }

    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        this.stores.set(res.data);
        this.isLoadingStores.set(false);
        // Auto-selecciona el primero si solo hay uno
        if (res.data.length === 1) this.selectStore(res.data[0]);
      },
      error: () => this.isLoadingStores.set(false),
    });
  }

  selectStore(store: StoreDto): void {
    this.selectedStore.set(store);
    this.sales.set([]);
    this.isLoadingSales.set(true);
    this.errorMsg.set(null);

    this.saleService.getByStore(store.idStore).subscribe({
      next: (res) => {
        this.sales.set(res.data);
        this.isLoadingSales.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingSales.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }

  openCreate(): void {
    this.form.reset();
    // Pre-rellena storeName con el local seleccionado
    if (this.selectedStore()) {
      this.form.patchValue({ storeName: this.selectedStore()!.name });
    }
    this.errorMsg.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form.reset();
    this.errorMsg.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const v = this.form.value;
    const request: CreateSaleRequest = {
      storeName:   v.storeName!,
      amount:      parseFloat(String(v.amount)),
      description: v.description!,
    };

    this.saleService.create(request).subscribe({
      next: (res) => {
        const sale = { ...res.data, createdAt: res.data.createdAt ?? new Date().toISOString() };
        this.sales.update(list => [sale, ...list]);
        this.isSaving.set(false);
        this.closeModal();
        this.toast('Venta registrada correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  getStoreInitial(name: string): string {
    return name.substring(0, 2).toUpperCase();
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}
