import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should render default title and message', () => {
    fixture.detectChanges();
    const h3 = fixture.debugElement.query(By.css('h3'));
    const p = fixture.debugElement.query(By.css('p'));
    expect(h3.nativeElement.textContent.trim()).toBe('Nenhum item encontrado');
    expect(p.nativeElement.textContent.trim()).toBe('Não há dados para exibir no momento.');
  });

  it('should render custom title and message via inputs', () => {
    component.title = 'Sem clubes';
    component.message = 'Crie seu primeiro clube.';
    fixture.detectChanges();

    const h3 = fixture.debugElement.query(By.css('h3'));
    const p = fixture.debugElement.query(By.css('p'));
    expect(h3.nativeElement.textContent.trim()).toBe('Sem clubes');
    expect(p.nativeElement.textContent.trim()).toBe('Crie seu primeiro clube.');
  });

  it('should not render action button when actionLabel is empty', () => {
    component.actionLabel = '';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeNull();
  });

  it('should render action button with label when actionLabel is provided', () => {
    component.actionLabel = 'Criar clube';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent.trim()).toBe('Criar clube');
  });

  it('should emit action event when button is clicked', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.actionLabel = 'Criar clube';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render custom icon text', () => {
    component.icon = '⚽';
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.icon'));
    expect(icon.nativeElement.textContent.trim()).toBe('⚽');
  });
});
