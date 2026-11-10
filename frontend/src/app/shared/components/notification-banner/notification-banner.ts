import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';

@Component({
  selector: 'app-notification-banner',
  templateUrl: './notification-banner.html',
  styleUrl: './notification-banner.scss',
})
export class NotificationBanner {
  protected readonly notifications = inject(NotificationService);
}
