import { Component, Input, Output, EventEmitter, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';

export interface SaveMemberEvent {
  name: string;
  rating: number;
  timesMvp: number;
  timesChampion: number;
}

@Component({
  selector: 'app-edit-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SquareRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'edit-member-modal.component.html',
  styleUrls: ['edit-member-modal.component.scss'],
})
export class EditMemberModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;

  @Input({ required: true }) member!: ClubMemberResponseDTO;
  @Input() isDirector = false;
  @Output() save = new EventEmitter<SaveMemberEvent>();
  @Output() delete = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    rating: [1, [Validators.min(1), Validators.max(5)]],
    timesMvp: [0, [Validators.min(0)]],
    timesChampion: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.form.patchValue({
      name: this.member.name,
      rating: this.member.rating ?? 1,
      timesMvp: this.member.timesMvp ?? 0,
      timesChampion: this.member.timesChampion ?? 0,
    });
  }

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
