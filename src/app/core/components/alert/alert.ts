import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '../../services/Notification';
import { NotificationDto } from '../../models/Notification';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';
import { catchError, forkJoin, of } from 'rxjs';
import { StoreService } from '../../services/store';
import { AuthService } from '../../services/Auth';
import { StoreDto } from '../../models/Store';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'alert.css'
})
export class AlertComponent implements OnInit{
  private readonly notifService = inject(NotificationService);
  private readonly storeService = inject(StoreService);
  private readonly authService  = inject(AuthService);

  notifications = signal<NotificationDto[]>([]);
  stores        = signal<StoreDto[]>([]);
  isLoading     = signal(true);
  isMarkingId   = signal<number | null>(null);
  errorMsg      = signal<string | null>(null);
  successMsg    = signal<string | null>(null);
  filterType    = signal<'ALL' | 'CRITICAL' | 'WARNING' | 'OK'>('ALL');
  filterStore   = signal<number | null>(null);

  // ── Computed ─────────────────────────────────────────────────
  filtered = computed(() => {
    let list = this.notifications();
    const type    = this.filterType();
    const storeId = this.filterStore();
    if (type !== 'ALL') list = list.filter(n => n.severityLevel === type);
    if (storeId !== null) {
      const storeName = this.stores().find(s => s.idStore === storeId)?.name ?? '';
      list = list.filter(n => n.nameStore === storeName);
    }
    return list;
  });

  unreadCount   = computed(() => this.notifications().filter(n => !n.isRead).length);
  criticalCount = computed(() => this.notifications().filter(n => n.severityLevel === 'CRITICAL').length);
  warningCount  = computed(() => this.notifications().filter(n => n.severityLevel === 'WARNING').length);
  okCount       = computed(() => this.notifications().filter(n => n.severityLevel === 'OK').length);

  // ── Init ─────────────────────────────────────────────────────
  ngOnInit(): void {
    const companyId = this.authService.getCompanyId();
    if (!companyId) { this.isLoading.set(false); return; }

    this.storeService.getByCompany(companyId).subscribe({
      next: (res) => {
        this.stores.set(res.data);
        this.loadAllNotifications(res.data);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadAllNotifications(stores: StoreDto[]): void {
    if (!stores.length) { this.isLoading.set(false); return; }

    const requests = stores.map(s =>
      this.notifService.getUnreadByStore(s.idStore).pipe(
        catchError(() => of({ data: [] as NotificationDto[] }))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const all = results.flatMap(r => r.data);
        const typeOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, OK: 2 };
        all.sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return (typeOrder[a.severityLevel] ?? 3) - (typeOrder[b.severityLevel] ?? 3);
        });
        this.notifications.set(all);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  refresh(): void {
    this.isLoading.set(true);
    this.notifications.set([]);
    this.loadAllNotifications(this.stores());
  }

  // ── Marcar como leída ─────────────────────────────────────────
  markAsRead(notif: NotificationDto): void {
    if (notif.isRead) return;
    this.isMarkingId.set(notif.idNotification);

    this.notifService.markAsRead(notif.idNotification).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.idNotification === notif.idNotification ? { ...n, isRead: true } : n)
        );
        this.isMarkingId.set(null);
        this.toast('Alerta marcada como leída.');
      },
      error: (err: HttpErrorResponse) => {
        this.isMarkingId.set(null);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  markAllAsRead(): void {
    const unread = this.notifications().filter(n => !n.isRead);
    if (!unread.length) return;

    forkJoin(
      unread.map(n => this.notifService.markAsRead(n.idNotification).pipe(catchError(() => of(null))))
    ).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.toast(`${unread.length} alertas marcadas como leídas.`);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getTypeClass(level: string): string {
    return { CRITICAL: 'type-critical', WARNING: 'type-warning', OK: 'type-ok' }[level] ?? 'type-warning';
  }

  getPipClass(level: string): string {
    return { CRITICAL: 'pip-critical', WARNING: 'pip-warning', OK: 'pip-ok' }[level] ?? 'pip-warning';
  }

  getStoreName(notif: NotificationDto): string {
    return notif.nameStore ?? 'Local desconocido';
  }

  setFilterStore(id: number | null): void { this.filterStore.set(id); }
  setFilterType(t: string): void {
    this.filterType.set(t as 'ALL' | 'CRITICAL' | 'WARNING' | 'OK');
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}
