import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '../../services/Notification';
import { NotificationDto } from '../../models/Notification';
import { HttpErrorResponse } from '@angular/common/http';
import { parseApiError } from '../../utils/parseApiError';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'alert.css'
})
export class AlertComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notifService = inject(NotificationService);

  notifications  = signal<NotificationDto[]>([]);
  isLoading      = signal(false);
  isMarkingId    = signal<number | null>(null);
  errorMsg       = signal<string | null>(null);
  successMsg     = signal<string | null>(null);
  storeIdInput   = signal('');
  filterType     = signal<'ALL' | 'CRITICAL' | 'WARNING' | 'OK'>('ALL');

  // ── Computed ────────────────────────────────────────────────────
  filtered = computed(() => {
    const type = this.filterType();
    if (type === 'ALL') return this.notifications();
    return this.notifications().filter(n => n.type === type);
  });

  criticalCount = computed(() =>
    this.notifications().filter(n => n.type === 'CRITICAL').length
  );

  warningCount = computed(() =>
    this.notifications().filter(n => n.type === 'WARNING').length
  );

  okCount = computed(() =>
    this.notifications().filter(n => n.type === 'OK').length
  );

  // ── Cargar notificaciones por storeId ──────────────────────────
  loadByStore(): void {
    const id = parseInt(this.storeIdInput());
    if (isNaN(id) || id <= 0) {
      this.errorMsg.set('Ingresa un ID de local válido.');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.notifService.getUnreadByStore(id).subscribe({
      next: (res) => {
        this.notifications.set(res.data);
        this.isLoading.set(false);
        if (res.data.length === 0) {
          this.successMsg.set('No hay alertas sin leer para este local.');
          setTimeout(() => this.successMsg.set(null), 3000);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMsg.set(parseApiError(err));
      },
    });
  }

  // ── Marcar como leída ──────────────────────────────────────────
  markAsRead(notif: NotificationDto): void {
    if (notif.read) return;
    this.isMarkingId.set(notif.idNotification);

    this.notifService.markAsRead(notif.idNotification).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.idNotification === notif.idNotification ? { ...n, read: true } : n)
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
    const unread = this.notifications().filter(n => !n.read);
    if (unread.length === 0) return;

    unread.forEach(n => {
      this.notifService.markAsRead(n.idNotification).subscribe({
        next: () => {
          this.notifications.update(list =>
            list.map(x => x.idNotification === n.idNotification ? { ...x, read: true } : x)
          );
        },
      });
    });
    this.toast(`${unread.length} alertas marcadas como leídas.`);
  }

  // ── Helpers ────────────────────────────────────────────────────
  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'type-critical',
      WARNING:  'type-warning',
      OK:       'type-ok',
    };
    return map[type] ?? 'type-warning';
  }

  getPipClass(type: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'pip-critical',
      WARNING:  'pip-warning',
      OK:       'pip-ok',
    };
    return map[type] ?? 'pip-warning';
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
