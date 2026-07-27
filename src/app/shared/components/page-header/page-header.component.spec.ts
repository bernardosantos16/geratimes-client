import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from './page-header.component';
import { provideRouter } from '@angular/router';

@Component({ template: `<app-page-header [title]="'Título'" backLink="/clubs"><button>Action</button></app-page-header>` })
class TestHostComponent {}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should render title in h1', () => {
    component.title = 'Gerar Times';
    fixture.detectChanges();
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent.trim()).toBe('Gerar Times');
  });

  it('should render subtitle when provided', () => {
    component.subtitle = 'Subtítulo da página';
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.subtitle'));
    expect(sub.nativeElement.textContent.trim()).toBe('Subtítulo da página');
  });

  it('should not render subtitle when empty', () => {
    component.subtitle = '';
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.subtitle'));
    expect(sub).toBeNull();
  });

  it('should render eyebrow when provided', () => {
    component.eyebrow = 'Sortear';
    fixture.detectChanges();
    const eyebrow = fixture.debugElement.query(By.css('.eyebrow'));
    expect(eyebrow.nativeElement.textContent.trim()).toBe('Sortear');
  });

  it('should render back button with routerLink when backLink is set', () => {
    component.backLink = '/clubs';
    fixture.detectChanges();
    const backBtn = fixture.debugElement.query(By.css('.back-btn'));
    expect(backBtn).toBeTruthy();
  });

  it('should not render back button when backLink is null', () => {
    component.backLink = null;
    fixture.detectChanges();
    const backBtn = fixture.debugElement.query(By.css('.back-btn'));
    expect(backBtn).toBeNull();
  });
});
