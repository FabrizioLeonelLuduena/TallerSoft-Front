import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastNotificationComponent],
  template: `<router-outlet></router-outlet><app-toast-notification></app-toast-notification>`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `],
})
export class AppComponent {
  title = 'tallersoft-frontend';
}
