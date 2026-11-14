import org.gradle.api.tasks.testing.Test

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.hcbiu.elcton"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.hcbiu.elcton"
        minSdk = 26
        targetSdk = 34
        versionCode = 11
        versionName = "0.2.9"
        // READY receipts are production behavior in the merged release, never a parallel lane.
        buildConfigField("boolean", "P2P_READY_CANDIDATE", "true")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildFeatures { compose = true; buildConfig = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    // The only QA Kotlin entrypoint is compiled by the real Android unit-test variant.
    sourceSets.getByName("test").java.srcDir(rootProject.file("qa"))
}

// Export the executed Gradle Test classpath, not guessed output/dependency paths.
tasks.register("writeDiagnosticHostClasspath") {
    dependsOn("testDebugUnitTest")
    val destination = layout.buildDirectory.file("diagnostics-http/classpath.txt")
    outputs.file(destination)
    outputs.upToDateWhen { false }
    doLast {
        val actualTest = tasks.named<Test>("testDebugUnitTest").get()
        val file = destination.get().asFile
        file.parentFile.mkdirs()
        check(actualTest.classpath.files.isNotEmpty()) { "Android unit-test classpath is empty" }
        file.writeText(actualTest.classpath.asPath + "\n")
        println("Diagnostic host classpath written to ${file.absolutePath}")
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("com.huawei.hms:wearengine:5.0.3.301")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.06.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
