import { NgModule, Optional, SkipSelf } from '@angular/core';
import { NativeScriptHttpClientModule, NativeScriptModule, throwIfAlreadyLoaded } from '@nativescript/angular';

@NgModule({
  imports: [NativeScriptModule, NativeScriptHttpClientModule]
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
