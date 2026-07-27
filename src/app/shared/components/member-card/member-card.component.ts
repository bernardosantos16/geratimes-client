import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { SquareRatingComponent } from '@shared/components/square-rating/square-rating.component';
import { ClubRolePipe } from '@shared/pipes/app.pipes';

@Component({
    selector: 'app-member-card',
    standalone: true,
    imports: [CommonModule, SquareRatingComponent, ClubRolePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'member-card.component.html',
    styleUrls: ['member-card.component.scss'],
})
export class MemberCardComponent {
    @Input({ required: true }) member!: ClubMemberResponseDTO;
    @Input() clickable = false;
    @Input() showRating = false;
    @Output() selected = new EventEmitter<ClubMemberResponseDTO>();
}
