import {
    Component,
    Signal,
    TemplateRef,
    EventEmitter,
    effect,
    Input,
    ContentChild,
    Output,
    isSignal,
} from '@angular/core';
import { RemoteComponent } from '../remote-component';

@Component({
    selector: 'contact-table-component',
    imports: [RemoteComponent],
    templateUrl: './table-component.html',
    styleUrl: './table-component.scss',
})
export class ContactTableComponent {
    @Input() value: unknown[] | Signal<unknown[]> = [];
    @Input() columns: unknown[] | Signal<unknown[]> = [];
    @Input() styleClass?: string;
    @Input() tableStyle?: Record<string, unknown>;
    @Input() cellClass?: (row: any, col: any) => string;
    @Input() paginator = true;
    @Input() rows = 10;
    @Input() scrollable = false;
    @Input() showGridlines = false;

    @ContentChild('body', { static: true }) bodyTemplate?: TemplateRef<any>;

    @Output() outputs = new EventEmitter<Record<string, any>>();

    constructor() {
        // reactive effect if signals are passed
        effect(() => {
            if (isSignal(this.value)) this.value = this.value();
            if (isSignal(this.columns)) this.columns = this.columns();
        });
    }

    forwardOutputs(event: Record<string, any>) {
        this.outputs.emit(event);
    }
}
