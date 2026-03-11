import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReportService } from '../../services/report';
import { AuthService } from '../../services/Auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-report',
  imports: [],
  templateUrl: './report.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'report.css'
})
export class ReportComponent {
  private readonly reportService = inject(ReportService);
  private readonly authService   = inject(AuthService);

  isExporting = signal(false);
  errorMsg    = signal<string | null>(null);
  successMsg  = signal<string | null>(null);

  user = this.authService.getUser();

  exportExcel(): void {
    this.isExporting.set(true);
    this.errorMsg.set(null);

    this.reportService.exportExcel().subscribe({
      next: (blob: Blob) => {
        // Descarga automática del archivo
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `reporte_cumplimiento_empresa${this.user?.idCompany ?? ''}_${this.getDateStr()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.isExporting.set(false);
        this.toast('Reporte exportado correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.isExporting.set(false);
        this.errorMsg.set('Error al exportar el reporte. Intenta nuevamente.');
      },
    });
  }

  getDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private toast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 4000);
  }
 }
