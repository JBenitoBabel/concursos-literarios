import { Directive, ElementRef, inject, input, output, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appInViewport]',
  standalone: true,
})
export class InViewportDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  enterThreshold = input(80);
  exitThreshold = input(40);

  scrolledChange = output<boolean>();

  private isScrolled = false;

  ngOnInit(): void {
    this.isScrolled = window.scrollY > this.enterThreshold();
    this.setupObserver(!this.isScrolled);
    this.scrolledChange.emit(this.isScrolled);
  }

  private setupObserver(forEnter: boolean): void {
    const sentinel = this.elementRef.nativeElement;
    if (!sentinel) return;

    this.observer?.disconnect();

    sentinel.style.top = forEnter ? `${this.enterThreshold()}px` : `${this.exitThreshold()}px`;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (forEnter && !entry.isIntersecting) {
          this.isScrolled = true;
          this.scrolledChange.emit(true);
          this.setupObserver(false);
        } else if (!forEnter && entry.isIntersecting) {
          this.isScrolled = false;
          this.scrolledChange.emit(false);
          this.setupObserver(true);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );

    this.observer.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}