const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withPosturaService(config) {
  return withAndroidManifest(config, config => {
    const manifest = config.modResults;

    if (!manifest.application || !manifest.application[0]) return config;

    const app = manifest.application[0];
    app.service = app.service || [];

    app.service.push({
      $: {
        "android:name": "com.anonymous.posturapp.PosturaService",
        "android:exported": "false",
        "android:stopWithTask": "false"
      }
    });

    return config;
  });
};
