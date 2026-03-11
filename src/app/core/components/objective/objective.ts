import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ObjectiveService } from '../../services/Objective';
import { CreateSalesObjectiveRequest, SalesObjectiveDto } from '../../models/Objective';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';
import { StoreService } from '../../services/store';
import { AuthService } from '../../services/Auth';
import { StoreDto } from '../../models/Store';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (start && end && end <= start) {
    return { endBeforeStart: true };
  }
  return null;
}

@Component({
  selector: 'app-objective',
  imports: [ReactiveFormsModule],
  templateUrl: './objective.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'objective.css',
})
export class ObjectiveComponent {
  private readonly fb = inject(FormBuilder);
  private readonly objectiveService = inject(ObjectiveService);
  private readonly storeService = inject(StoreService);
  private readonly authService = inject(AuthService);

  stores = signal<StoreDto[]>([]);
  selectedStore = signal<StoreDto | null>(null);
  objectives = signal<SalesObjectiveDto[]>([]);
  isLoadingStores = signal(true);
  isLoadingObj = signal(false);
  isSaving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal = signal(false);
  filterPeriod = signal<string>('ALL');
  searchTerm = signal('');

  readonly periodTypes = [
    { label: 'Mensual', value: 'MENSUAL' },
    { label: 'Trimestral', value: 'TRIMESTRAL' },
    { label: 'Semestral', value: 'SEMESTRAL' },
    { label: 'Anual', value: 'ANUAL' },
  ];

  today = new Date().toISOString().split('T')[0];

  form = this.fb.group(
    {
      nameStore: ['', [Validators.required]],
      targetAmount: [
        null as number | null,
        [Validators.required, Validators.min(0.01), Validators.max(99999999.99)],
      ],
      periodType: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    },
    { validators: endAfterStart },
  );

  filtered = computed(() => {
    let list = this.objectives();
    const period = this.filterPeriod();
    if (period !== 'ALL') list = list.filter((o) => o.periodType === period);
    const term = this.searchTerm().toLowerCase();
    if (term) list = list.filter((o) => o.nameStore.toLowerCase().includes(term));
    return list;
  });

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) {
      this.isLoadingStores.set(false);
      return;
    }

    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        this.stores.set(res.data);
        this.isLoadingStores.set(false);
        if (res.data.length === 1) this.selectStore(res.data[0]);
      },
      error: () => this.isLoadingStores.set(false),
    });
  }

  selectStore(store: StoreDto): void {
    this.selectedStore.set(store);
    this.objectives.set([]);
    this.isLoadingObj.set(true);
    this.errorMsg.set(null);

    this.objectiveService.getByStore(store.idStore).subscribe({
      next: (res) => {
        this.objectives.set(res.data);
        this.isLoadingObj.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingObj.set(false);
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
    if (this.selectedStore()) {
      this.form.patchValue({ nameStore: this.selectedStore()!.name });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const v = this.form.value;
    const request: CreateSalesObjectiveRequest = {
      nameStore: v.nameStore!,
      targetAmount: parseFloat(String(v.targetAmount)),
      periodType: v.periodType!,
      startDate: v.startDate!,
      endDate: v.endDate!,
    };

    this.objectiveService.create(request).subscribe({
      next: (res) => {
        this.objectives.update((list) => [res.data, ...list]);
        this.isSaving.set(false);
        this.closeModal();
        this.toast('Objetivo registrado.');
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  getDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / 86400000);
  }

  getDaysLeftClass(days: number): string {
    if (days < 0) return 'expired';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'warn';
    return 'ok';
  }

  getPeriodLabel(type: string): string {
    return this.periodTypes.find((p) => p.value === type)?.label ?? type;
  }

  getPeriodClass(type: string): string {
    const map: Record<string, string> = {
      MENSUAL: 'chip-blue',
      TRIMESTRAL: 'chip-green',
      SEMESTRAL: 'chip-warn',
      ANUAL: 'chip-purple',
    };
    return map[type] ?? 'chip-blue';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}
