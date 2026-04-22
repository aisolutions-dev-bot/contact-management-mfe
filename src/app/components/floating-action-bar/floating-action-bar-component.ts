import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RemoteComponent } from '../remote-component';
import { environment } from '../../../environments/environment';

export interface ActionButton {
  label: string;
  icon?: string;
  action: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
  outlined?: boolean;
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
}

@Component({
  selector: 'app-floating-action-bar',
  standalone: true,
  imports: [RemoteComponent],
  templateUrl: './floating-action-bar-component.html',
  styleUrl: './floating-action-bar-component.scss',
})
export class FloatingActionBarComponent {

  @Input() buttons: ActionButton[] = [
    {
      label: 'Cancel',
      icon: 'pi pi-times',
      action: 'cancel',
      severity: 'secondary',
      outlined: true,
    },
    {
      label: 'Save',
      icon: 'pi pi-check',
      action: 'save',
      severity: 'primary',
    },
  ];

  @Input() visible: boolean = true;
  @Input() loading: boolean = false;
  @Input() alignment: 'start' | 'center' | 'end' = 'end';

  @Output() actionClicked = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly remoteEntry = environment.uiMfeUrl;
  protected readonly exposedModule = './FloatingActionBar';
  protected readonly exportName = 'FloatingActionBarComponent';

  forwardOutputs(event: Record<string, any>): void {
    if ('actionClicked' in event) {
      this.actionClicked.emit(event['actionClicked']);
    }
    if ('save' in event) {
        this.save.emit();
    }
    if ('cancel' in event) {
        this.cancel.emit();
    }
  }
}