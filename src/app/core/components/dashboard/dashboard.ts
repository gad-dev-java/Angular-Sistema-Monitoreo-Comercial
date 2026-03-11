import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/Auth';
import { StoreDto } from '../../models/Store';
import { StoreService } from '../../services/store';
import { MonitoringService } from '../../services/Monitoring';
import { NotificationService } from '../../services/Notification';
import { NotificationDto } from '../../models/Notification';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { MonitoringKpiResponse } from '../../models/Monitoring';

interface StoreRow {
  store: StoreDto;
  pc: number;
  pt: number;
  status: 'ok' | 'progress' | 'warning' | 'critical';
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'dashboard.css',
})
export class DashboardComponent implements OnInit{
  private readonly authService         = inject(AuthService);
  private readonly storeService        = inject(StoreService);
  private readonly monitoringService   = inject(MonitoringService);
  private readonly notificationService = inject(NotificationService);

  user = this.authService.getUser();

  // ── Signals ─────────────────────────────────────────────────
  isLoading = signal(true);
  storeRows = signal<StoreRow[]>([]);
  alerts    = signal<NotificationDto[]>([]);

  // ── Computed KPIs ────────────────────────────────────────────
  totalStores   = computed(() => this.storeRows().length);
  avgPc         = computed(() => {
    const rows = this.storeRows();
    if (!rows.length) return 0;
    return rows.reduce((s, r) => s + r.pc, 0) / rows.length;
  });
  riskCount     = computed(() => this.storeRows().filter(r => r.pc < 50).length);
  unreadAlerts  = computed(() => this.alerts().filter(a => !a.isRead).length);

  // ── Bar chart (top 6 locales) ────────────────────────────────
  bars = computed(() =>
    this.storeRows().slice(0, 6).map(r => ({
      label:   r.store.name,
      metaH:   80,
      actualH: Math.min(Math.round((r.pc / 100) * 80), 80),
    }))
  );

  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoading.set(false); return; }

    this.storeService.getByCompany(companyId).pipe(
      switchMap(res => {
        const stores = res.data;
        if (!stores.length) return of({ stores, kpis: [] as MonitoringKpiResponse[], notifs: [] as NotificationDto[] });

        const kpiRequests = stores.map(s =>
          this.monitoringService.getKpi(s.idStore).pipe(
            catchError(() => of({ data: { performanceCompliance: 0, timeElapsedPercentage: 0 } as any }))
          )
        );

        const notifRequest = this.notificationService.getUnreadByStore(stores[0].idStore).pipe(
          catchError(() => of({ data: [] as NotificationDto[] }))
        );

        return forkJoin([forkJoin(kpiRequests), notifRequest]).pipe(
          map(([kpiRes, notifRes]) => ({
            stores,
            kpis:   kpiRes.map((r: any) => r.data as MonitoringKpiResponse),
            notifs: (notifRes as any).data as NotificationDto[],
          }))
        );
      }),
      catchError(() => of({ stores: [] as StoreDto[], kpis: [] as MonitoringKpiResponse[], notifs: [] as NotificationDto[] }))
    ).subscribe(({ stores, kpis, notifs }) => {
      const rows: StoreRow[] = stores.map((store, i) => {
        const pc = Number(kpis[i]?.performanceCompliance ?? 0);
        const pt = Number(kpis[i]?.timeElapsedPercentage ?? 0);
        return { store, pc, pt, status: this.getStatus(pc) };
      });
      this.storeRows.set(rows);
      this.alerts.set(notifs.slice(0, 5));
      this.isLoading.set(false);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  getStatus(pc: number): 'ok' | 'progress' | 'warning' | 'critical' {
    if (pc >= 100) return 'ok';
    if (pc >= 70)  return 'progress';
    if (pc >= 50)  return 'warning';
    return 'critical';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ok: 'Cumplido', progress: 'En Progreso', warning: 'Riesgo', critical: 'Crítico',
    };
    return map[status] ?? status;
  }

  getProgressClass(pc: number): string {
    if (pc >= 80) return 'fill-ok';
    if (pc >= 50) return 'fill-warn';
    return 'fill-crit';
  }

  fmt(val: number): string { return val.toFixed(1) + '%'; }

  getCurrentPeriod(): string {
    const now   = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week  = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    const month = now.toLocaleString('es-PE', { month: 'long' }).toUpperCase();
    return `${month} ${now.getFullYear()} · SEMANA ${week}`;
  }
}
