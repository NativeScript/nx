import { Application, Color, Device, isIOS } from '@nativescript/core';

export function setStatusBarColor(color: 'light' | 'dark', tintColor?: string /* android only */) {
  if (isIOS) {
    // ios status-bar background color is set via the .action-bar class
    UIApplication.sharedApplication.setStatusBarStyleAnimated(color === 'light' ? UIStatusBarStyle.LightContent : UIStatusBarStyle.DarkContent, false);
  } else {
    const sdkVersion = parseInt(Device.sdkVersion);
    if (sdkVersion >= 21) {
      // android status-bar background color is set via additional programmatic api access
      // api level 21+ can programmatically change the status bar
      const activity: android.app.Activity = Application.android.foregroundActivity || Application.android.startActivity;
      activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
      activity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
      activity.getWindow().setStatusBarColor(new Color(tintColor).android);
      if (sdkVersion >= 23) {
        // api level 23+ can programmatically change the text color of the status bar
        // see here: https://developer.android.com/reference/android/view/View#SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        activity.getWindow().getDecorView().setSystemUiVisibility((<any>android.view.View).SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
      }
    }
  }
}