import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ObjectiveService } from '../../services/Objective';
import { CreateSalesObjectiveRequest, SalesObjectiveDto } from '../../models/Objective';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end   = group.get('endDate')?.value;
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
  styleUrl: 'objective.css'
})
export class ObjectiveComponent {
  private readonly fb = inject(FormBuilder);
  private readonly objectiveService = inject(ObjectiveService);

  objectives = signal<SalesObjectiveDto[]>([]);
  isSaving   = signal(false);
  errorMsg   = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  showModal  = signal(false);
  searchTerm = signal('');
  filterPeriod = signal('ALL');

  periodTypes = [
    { value: 'MENSUAL',   label: 'Mensual'   },
    { value: 'TRIMESTRAL',label: 'Trimestral'},
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'ANUAL',     label: 'Anual'     },
  ];

  today = new Date().toISOString().split('T')[0];

  form: FormGroup = this.fb.group({
    nameStore:    ['', [Validators.required]],
    targetAmount: [null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
    periodType:   ['', [Validators.required]],
    startDate:    ['', [Validators.required]],
    endDate:      ['', [Validators.required]],
  }, { validators: endAfterStart });

  filtered = computed(() => {
    let list = this.objectives();
    const term = this.searchTerm().toLowerCase();
    if (term) list = list.filter(o => o.nameStore.toLowerCase().includes(term));
    if (this.filterPeriod() !== 'ALL') list = list.filter(o => o.periodType === this.filterPeriod());
    return list;
  });

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
    const request: CreateSalesObjectiveRequest = {
      nameStore:    v.nameStore,
      targetAmount: parseFloat(v.targetAmount),
      periodType:   v.periodType,
      startDate:    v.startDate,
      endDate:      v.endDate,
    };

    this.objectiveService.create(request).subscribe({
      next: (res) => {
        this.objectives.update(list => [res.data, ...list]);
        this.isSaving.set(false);
        this.closeModal();
        this.toast('Objetivo creado correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  // ── Helpers de display ──────────────────────────────────────────
  getPeriodLabel(value: string): string {
    return this.periodTypes.find(p => p.value === value)?.label ?? value;
  }

  getPeriodClass(value: string): string {
    const map: Record<string, string> = {
      MENSUAL: 'chip-blue', TRIMESTRAL: 'chip-green',
      SEMESTRAL: 'chip-warn', ANUAL: 'chip-purple',
    };
    return map[value] ?? 'chip-blue';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  getDaysLeft(endDate: string): number {
    const end  = new Date(endDate + 'T00:00:00');
    const now  = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysLeftClass(days: number): string {
    if (days < 0)  return 'expired';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'ok';
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
 }
