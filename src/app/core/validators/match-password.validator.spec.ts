import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { matchPasswordValidator } from './match-password.validator';

describe('matchPasswordValidator', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    });
    fb = TestBed.inject(FormBuilder);
  });

  it('should return null when passwords match', () => {
    const group = fb.group(
      { password: ['abc123'], confirmPassword: ['abc123'] },
      { validators: matchPasswordValidator('password', 'confirmPassword') },
    );

    expect(group.valid).toBe(true);
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(false);
  });

  it('should return passwordMismatch error when passwords differ', () => {
    const group = fb.group(
      { password: ['abc123'], confirmPassword: ['xyz789'] },
      { validators: matchPasswordValidator('password', 'confirmPassword') },
    );

    expect(group.hasError('passwordMismatch')).toBe(true);
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
  });

  it('should return null when controls do not exist', () => {
    const group = fb.group(
      { password: ['abc123'] },
      { validators: matchPasswordValidator('password', 'nonexistent') },
    );

    expect(group.hasError('passwordMismatch')).toBe(false);
  });

  it('should skip validation when confirmPassword has other errors', () => {
    const group = fb.group(
      {
        password: ['abc123'],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: matchPasswordValidator('password', 'confirmPassword') },
    );

    // confirmPassword has 'required' error, so mismatch should be skipped
    expect(group.get('confirmPassword')?.hasError('required')).toBe(true);
    expect(group.hasError('passwordMismatch')).toBe(false);
  });
});
