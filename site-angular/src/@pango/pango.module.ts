import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { PANGO_CONFIG, PangoConfigService } from './services/config.service';
import { PangoMatchMediaService } from './services/match-media.service';
import { PangoSplashScreenService } from './services/splash-screen.service';

@NgModule({
    providers: [
        PangoConfigService,
        PangoMatchMediaService,
        PangoSplashScreenService,
    ]
})
export class PangoModule {
    constructor(@Optional() @SkipSelf() parentModule: PangoModule) {
        if (parentModule) {
            throw new Error('PangoModule is already loaded. Import it in the AppModule only!');
        }
    }

    static forRoot(config): ModuleWithProviders<PangoModule> {
        return {
            ngModule: PangoModule,
            providers: [
                {
                    provide: PANGO_CONFIG,
                    useValue: config
                }
            ]
        };
    }
}
