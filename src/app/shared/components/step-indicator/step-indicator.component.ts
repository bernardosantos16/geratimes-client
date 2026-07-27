import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepIndicatorStep {
  key: string;
  label: string;
}

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: 'step-indicator.component.html',
  styleUrls: ['step-indicator.component.scss'],
})
export class StepIndicatorComponent {
  @Input({ required: true }) steps!: StepIndicatorStep[];
  @Input({ required: true }) currentStep!: string;

  isDone(stepKey: string): boolean {
    const currentIndex = this.steps.findIndex((s) => s.key === this.currentStep);
    const stepIndex = this.steps.findIndex((s) => s.key === stepKey);
    return currentIndex !== -1 && stepIndex < currentIndex;
  }
}
