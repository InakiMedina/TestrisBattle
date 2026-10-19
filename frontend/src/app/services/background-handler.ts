import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class BackgroundHandler {
  changeBackground(route: string): void {
    document.body.style.backgroundImage = `url("${route}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
  }

}