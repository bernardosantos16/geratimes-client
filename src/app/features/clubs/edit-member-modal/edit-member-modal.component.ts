import { Component, Input, Output, EventEmitter, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ClubRolePipe } from '@shared/pipes/app.pipes';

export interface SaveMemberEvent {
  name: string;
  rating: number;
  timesMvp: number;
  timesChampion: number;
}

@Component({
  selector: 'app-edit-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SquareRatingComponent, SvgIconComponent, ClubRolePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'edit-member-modal.component.html',
  styleUrls: ['edit-member-modal.component.scss'],
})
export class EditMemberModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;

  @Input({ required: true }) member!: ClubMemberResponseDTO;
  @Input() isDirector = false;
  @Input() canPromote = false;
  @Input() canDemote = false;
  @Output() save = new EventEmitter<SaveMemberEvent>();
  @Output() delete = new EventEmitter<void>();
  @Output() promote = new EventEmitter<void>();
  @Output() demote = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    rating: [1, [Validators.min(1), Validators.max(5)]],
    timesMvp: [0, [Validators.min(0)]],
    timesChampion: [0, [Validators.min(0)]],
  });

  get initials(): string {
    const parts = (this.member?.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  ngOnInit(): void {
    this.form.patchValue({
      name: this.member.name,
      rating: this.member.rating ?? 1,
      timesMvp: this.member.timesMvp ?? 0,
      timesChampion: this.member.timesChampion ?? 0,
    });
  }

  adjustStat(field: 'timesMvp' | 'timesChampion', delta: number): void {
    const control = this.form.controls[field];
    control.patchValue(Math.max(0, (control.value ?? 0) + delta));
  }

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
