import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MonitoringService } from '../../services/Monitoring';
import { StoreService } from '../../services/store';
import { AuthService } from '../../services/Auth';
import { StoreDto } from '../../models/Store';
import { StoreKpi } from '../../models/Monitoring';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';

@Component({
  selector: 'app-kpi',
  imports: [ReactiveFormsModule],
  templateUrl: './kpi.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'kpi.css'
})
export class KpiComponent {
  private readonly fb               = inject(FormBuilder);
  private readonly monitoringService = inject(MonitoringService);
  private readonly storeService     = inject(StoreService);
  private readonly authService      = inject(AuthService);

  stores          = signal<StoreDto[]>([]);
  kpis            = signal<StoreKpi[]>([]);
  isLoadingStores = signal(true);
  isLoadingKpi    = signal<number | null>(null); // storeId que está cargando
  errorMsg        = signal<string | null>(null);

  // ── Computed ────────────────────────────────────────────────
  avgPc = computed(() => {
    const list = this.kpis();
    if (!list.length) return 0;
    return list.reduce((s, x) => s + x.pc, 0) / list.length;
  });

  avgPt = computed(() => {
    const list = this.kpis();
    if (!list.length) return 0;
    return list.reduce((s, x) => s + x.pt, 0) / list.length;
  });

  criticalCount = computed(() => this.kpis().filter(k => k.status === 'critical').length);
  okCount       = computed(() => this.kpis().filter(k => k.status === 'ok').length);

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoadingStores.set(false); return; }

    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        this.stores.set(res.data);
        this.isLoadingStores.set(false);
        // Auto-carga KPI de todos los locales
        
        res.data.forEach(store => this.loadKpi(store));
      },
      error: () => this.isLoadingStores.set(false),
    });
  }

  loadKpi(store: StoreDto): void {
    this.isLoadingKpi.set(store.idStore);
    this.monitoringService.getKpi(store.idStore).subscribe({
      next: (res) => {
        const pc = Number(res.data.performanceCompliance);
        const pt = Number(res.data.timeElapsedPercentage);
        const entry: StoreKpi = {
          storeId: store.idStore,
          label:   store.name,
          pc, pt,
          status: pc >= 80 ? 'ok' : pc >= 50 ? 'warning' : 'critical',
        };
        // Reemplaza si ya existe, agrega si no
        this.kpis.update(list => {
          const idx = list.findIndex(k => k.storeId === store.idStore);
          if (idx >= 0) { const copy = [...list]; copy[idx] = entry; return copy; }
          return [...list, entry];
        });
        this.isLoadingKpi.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingKpi.set(null);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  refreshAll(): void {
    this.kpis.set([]);
    this.stores().forEach(store => this.loadKpi(store));
  }

  // ── Helpers ────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    return { ok: 'Cumpliendo', warning: 'En riesgo', critical: 'Crítico' }[status] ?? status;
  }

  getProgressClass(pc: number): string {
    if (pc >= 80) return 'fill-ok';
    if (pc >= 50) return 'fill-warn';
    return 'fill-crit';
  }

  getBarClass(pc: number): string {
    if (pc >= 80) return 'bar-ok';
    if (pc >= 50) return 'bar-warn';
    return 'bar-crit';
  }

  refreshStore(storeId: number, label: string): void {
    const store = this.stores().find(s => s.idStore === storeId);
    if (store) this.loadKpi(store);
  }

  isLagging(k: StoreKpi): boolean { return k.pc < k.pt; }

  fmt(val: number): string { return val.toFixed(1) + '%'; }
 }
