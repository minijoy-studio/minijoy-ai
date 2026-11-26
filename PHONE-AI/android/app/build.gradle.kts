plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "ai.minijoy.phone"
    compileSdk = 35
    defaultConfig {
        applicationId = "ai.minijoy.phone"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
}
