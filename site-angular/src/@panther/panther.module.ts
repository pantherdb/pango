import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { PANTHER_CONFIG, PantherConfigService } from './services/config.service';
import { PantherMatchMediaService } from './services/match-media.service';
import { PantherSplashScreenService } from './services/splash-screen.service';

@NgModule({
    providers: [
        PantherConfigService,
        PantherMatchMediaService,
        PantherSplashScreenService,
    ]
})
export class PantherModule {
    constructor(@Optional() @SkipSelf() parentModule: PantherModule) {
        if (parentModule) {
            throw new Error('PantherModule is already loaded. Import it in the AppModule only!');
        }
    }

    static forRoot(config): ModuleWithProviders<PantherModule> {
        return {
            ngModule: PantherModule,
            providers: [
                {
                    provide: PANTHER_CONFIG,
                    useValue: config
                }
            ]
        };
    }
}
