import { Component, OnInit, OnDestroy } from '@angular/core';
import { RemoteComponent } from '../remote-component';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'contact-tabs-router',
    standalone: true,
    imports: [CommonModule, RemoteComponent],
    templateUrl: './contact-tabs-router.html',
    styleUrl: './contact-tabs-router.scss',
})
export class ContactTabsRouter implements OnInit, OnDestroy {
    uiMfeUrl = environment.uiMfeUrl;

    // Need to make the tabs dynamically loaded based on customer's subscription
    // in future
    tabs: Record<string, { label: string; icon?: string }> = {
        //'/contact/dashboard': { label: 'Dashboard' },
        '/contact/client': { label: 'Client Master' },
        '/contact/staff': { label: 'Staff Master' },
    };

    activeRoute = '';
    private sub?: Subscription;

    constructor(private router: Router) {}

    ngOnInit() {
        // Set initial route
        this.setActiveRoute(this.router.url);

        // Keep route in sync when navigating tabs
        this.sub = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((event) => {
                this.setActiveRoute(event.urlAfterRedirects);
            });
    }
    private setActiveRoute(url: string): void {
        // Find the longest registered tab route that the current URL starts with
        const matchingRoute = Object.keys(this.tabs)
            .filter((tabRoute) => url.startsWith(tabRoute))
            .sort((a, b) => b.length - a.length)[0]; // Sort descending by length to prefer '/booking/admin/assign' over '/booking'

        // If a match is found, use the base tab route; otherwise, use the full URL.
        this.activeRoute = matchingRoute || url;
    }

    handleTabChange(event: Record<string, any>) {
        const newRoute = event['tabChange'];
        this.activeRoute = newRoute;
        this.router.navigateByUrl(newRoute);
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
}
