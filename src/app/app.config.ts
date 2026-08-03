import {ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter, withComponentInputBinding, withViewTransitions} from '@angular/router';
import {provideHttpClient, withInterceptors, withXsrfConfiguration} from '@angular/common/http';

import {routes} from './app.routes';
import {authInterceptor} from '@core/interceptors/auth.interceptor';
import {IconRegistryService} from "@core/services/icon-registry.service";
import {DeviceService} from "@core/services/device.service";
import { MATERIAL_ICONS } from "@core/data/icon.data";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
        inject(DeviceService);
    }),
    provideAppInitializer(() => {
        const registry = inject(IconRegistryService);
        MATERIAL_ICONS.forEach(icon => {
            registry.register(icon.name, icon.svg);
        });
    }),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),
  ],
};
