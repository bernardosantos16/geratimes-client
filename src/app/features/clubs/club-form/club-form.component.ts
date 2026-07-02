import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:  'club-form.component.html',
  styleUrls: ['club-form.component.scss'],
})
export class ClubFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clubsService = inject(ClubsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly isEdit = signal(false);
  readonly serverError = signal('');
  private editId: string | null = null;

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(1)]],
    nickname: ['', [Validators.minLength(3), Validators.maxLength(24)]],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.isEdit.set(true);
      this.clubsService.getClubById(this.editId).subscribe({
        next: (club) => this.form.patchValue(club),
        error: () => { this.toast.error('Clube não encontrado.'); this.router.navigate(['/clubs']); },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');

    const dto = this.form.getRawValue() as any;
    const obs = this.isEdit()
      ? this.clubsService.updateClub(this.editId!, dto)
      : this.clubsService.createClub(dto);

    obs.subscribe({
      next: (club) => {
        this.toast.success(this.isEdit() ? 'Clube atualizado!' : 'Clube criado!');
        this.router.navigate(['/clubs', club.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(err.error?.detail ?? 'Erro ao salvar clube.');
      },
    });
  }
}
