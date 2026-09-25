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

  ngOnInit(): void {
    const sentinel = this.elementRef.nativeElement;
    const isInitiallyScrolled = window.scrollY > this.enterThreshold();

    this.observer = new IntersectionObserver(
      ([entry]) => {
        const isScrolled = !entry.isIntersecting;
        sentinel.style.top = `${isScrolled ? this.exitThreshold() : this.enterThreshold()}px`;
        this.scrolledChange.emit(isScrolled);
      },
      {
        root: null,
        rootMargin: `0px`,
        threshold: 0,
      }
    );

    sentinel.style.top = `${isInitiallyScrolled ? this.exitThreshold() : this.enterThreshold()}px`;
    this.scrolledChange.emit(isInitiallyScrolled);
    this.observer.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}