import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/Auth';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'dashboard.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  user = this.authService.getUser();

  kpis = [
    { label: 'Locales Activos',    value: '12',  delta: '▲ 2 este mes',      trend: 'up',   accent: 'blue'  },
    { label: 'Cumplimiento Prom.', value: '74%', delta: '▲ +8% vs anterior', trend: 'up',   accent: 'green' },
    { label: 'Alertas Activas',    value: '3',   delta: '● 1 crítica',        trend: 'warn', accent: 'warn'  },
    { label: 'Locales en Riesgo',  value: '2',   delta: '▼ PC < 50%',         trend: 'down', accent: 'red'   },
  ];

  alerts = [
    { title: 'Chorrillos — PC crítico',        time: 'Hace 12 min', type: 'critical' },
    { title: 'Surco — bajo rendimiento',        time: 'Hace 1 h',   type: 'warning'  },
    { title: 'Barranco — sin registro ventas',  time: 'Hace 3 h',   type: 'warning'  },
    { title: 'La Molina — meta alcanzada',      time: 'Hace 5 h',   type: 'ok'       },
  ];

  stores = [
    { name: 'La Molina',  meta: 'S/ 50,000', ventas: 'S/ 50,200', pc: 100, pt: 97, status: 'ok'       },
    { name: 'Miraflores', meta: 'S/ 80,000', ventas: 'S/ 57,600', pc: 72,  pt: 97, status: 'progress' },
    { name: 'San Isidro', meta: 'S/ 60,000', ventas: 'S/ 36,000', pc: 60,  pt: 97, status: 'warning'  },
    { name: 'Surco',      meta: 'S/ 45,000', ventas: 'S/ 21,150', pc: 47,  pt: 97, status: 'warning'  },
    { name: 'Chorrillos', meta: 'S/ 35,000', ventas: 'S/ 8,750',  pc: 25,  pt: 97, status: 'critical' },
  ];

  bars = [
    { label: 'Miraflores', metaH: 80, actualH: 72 },
    { label: 'San Isidro', metaH: 80, actualH: 60 },
    { label: 'Surco',      metaH: 80, actualH: 38 },
    { label: 'La Molina',  metaH: 80, actualH: 80 },
    { label: 'Barranco',   metaH: 80, actualH: 55 },
    { label: 'Chorrillos', metaH: 80, actualH: 28 },
  ];

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ok: 'Cumplido', progress: 'En Progreso',
      warning: 'Warning', critical: 'Critical',
    };
    return map[status] ?? status;
  }

  getProgressClass(pc: number): string {
    if (pc >= 80) return 'fill-ok';
    if (pc >= 50) return 'fill-warn';
    return 'fill-crit';
  }

  getUserInitials(): string {
    const email = this.user?.email ?? '';
    return email.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
