import { Component, inject } from '@angular/core';
import { ErrorFeedbackService } from '@services/error-feedback.service';

@Component({
  selector: 'app-error-toast',
  templateUrl: './error-toast.html',
})
export class ErrorToast
{
  private readonly errorFeedback = inject(ErrorFeedbackService);

  protected readonly message = this.errorFeedback.message;

  protected onDismiss(): void
  {
    this.errorFeedback.dismiss();
  }
}
