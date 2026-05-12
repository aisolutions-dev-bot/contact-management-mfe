import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  TemplateRef,
  Signal,
} from '@angular/core';
import { RemoteComponent } from '../remote-component';

@Component({
  selector: 'contact-card',
  standalone: true,
  imports: [RemoteComponent],
  templateUrl: './card-component.html',
  styleUrl: './card-component.scss',
})
export class ContactCardComponent {
  @Input() header?: string | Signal<string | undefined>;
  @Input() title?: string | Signal<string | undefined>;
  @Input() subtitle?: string | Signal<string | undefined>;
  @Input() style?: Record<string, string>;

  @ContentChild('cardHeader') cardHeader?: TemplateRef<unknown>;
  @ContentChild('cardTitle') cardTitle?: TemplateRef<unknown>;
  @ContentChild('cardSubtitle') cardSubtitle?: TemplateRef<unknown>;
  @ContentChild('cardContent') cardContent?: TemplateRef<unknown>;
  @ContentChild('cardFooter') cardFooter?: TemplateRef<unknown>;
  @Output() outputs = new EventEmitter<Record<string, any>>();

  forwardOutputs(event: Record<string, any>) {
    this.outputs.emit(event);
  }
}
