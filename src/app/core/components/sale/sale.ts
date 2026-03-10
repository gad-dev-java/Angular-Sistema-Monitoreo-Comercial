import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SaleService } from "../../services/sale";
import { CreateSaleRequest, SaleDto } from "../../models/Sale";
import { HttpErrorResponse } from "@angular/common/http";
import { parseApiError } from "../../utils/parseApiError";


@Component({
  selector: 'app-sale',
  imports: [ReactiveFormsModule],
  templateUrl: './sale.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'sale.css'
})
export class SaleComponent {
  private readonly fb = inject(FormBuilder);
  private readonly saleService = inject(SaleService);

  sales      = signal<SaleDto[]>([]);
  isSaving   = signal(false);
  errorMsg   = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal  = signal(false);
  searchTerm = signal('');

  form: FormGroup = this.fb.group({
    storeName:   ['', [Validators.required]],
    amount:      [null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
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

  // Totales calculados
  totalAmount = computed(() =>
    this.sales().reduce((sum, s) => sum + s.amount, 0)
  );

  totalFiltered = computed(() =>
    this.filtered().reduce((sum, s) => sum + s.amount, 0)
  );

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }

  openCreate(): void {
    this.form.reset();
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
      storeName:   v.storeName,
      amount:      parseFloat(v.amount),
      description: v.description,
    };

    this.saleService.create(request).subscribe({
      next: (res) => {
        // Agrega con timestamp local si el backend no lo devuelve
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
