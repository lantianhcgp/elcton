package com.huawei.wearengine.utils.json;

import com.huawei.wearengine.common.a;

/* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/utils/json/DeviceJsonUtil.class */
public class DeviceJsonUtil {
    static final String DEVICE_RESERVEDNESS = "device_reservedness";
    static final String DEVICE_CAPABILITY = "device_capability";
    static final String DEVICE_BASIC_INFO = "device_basic_info";
    static final String DEVICE_IDENTIFY = "device_identify";
    static final String DEVICE_WEAR_ENGINE_DEVICE_ID = "device_wear_engine_device_id";
    static final String DEVICE_SOFT_VERSION = "device_soft_version";
    static final String DEVICE_IS_SUPPORT_OTA = "device_is_support_ota";
    static final String DEVICE_EXTRA = "device_extra";
    static final String DEVICE_P2P_CAPABILITY = "device_p2p_capability";
    static final String DEVICE_MONITOR_CAPABILITY = "device_monitor_capability";
    static final String DEVICE_NOTIFY_CAPABILITY = "device_notify_capability";
    static final String DEVICE_SENSOR_CAPABILITY = "device_sensor_capability";
    static final String DEVICE_CATEGORY = "device_category";
    static final String DEVICE_TYPE = "device_type";
    static final int DEFAULT_DEVICE_TYPE = -1;

    private DeviceJsonUtil() {
    }

    public static String getReservedness(String str) {
        return a.b(str, "getReservedness", DEVICE_RESERVEDNESS);
    }

    public static String getCapability(String str) {
        return a.b(str, "getCapability", DEVICE_CAPABILITY);
    }

    public static String getBasicInfo(String str) {
        return a.b(str, "getBasicInfo", DEVICE_BASIC_INFO);
    }

    public static String getIdentify(String str) {
        return a.b(str, "getIdentify", DEVICE_IDENTIFY);
    }

    public static String getWearEngineDeviceId(String str) {
        return a.b(str, "getWearEngineDeviceId", DEVICE_WEAR_ENGINE_DEVICE_ID);
    }

    public static String getSoftwareVersion(String str) {
        return a.b(str, "getSoftwareVersion", DEVICE_SOFT_VERSION);
    }

    public static boolean getSupportOta(String str) {
        return a.a(str, "getSupportOTA", DEVICE_IS_SUPPORT_OTA);
    }

    public static String getExtra(String str) {
        return a.b(str, "getExtra", DEVICE_EXTRA);
    }

    public static int getP2pCapability(String str) {
        return a.a(str, "getP2pCapability", DEVICE_P2P_CAPABILITY, 2);
    }

    public static int getMonitorCapability(String str) {
        return a.a(str, "getMonitorCapability", DEVICE_MONITOR_CAPABILITY, 2);
    }

    public static int getNotifyCapability(String str) {
        return a.a(str, "getNotifyCapability", DEVICE_NOTIFY_CAPABILITY, 2);
    }

    public static int getSensorCapability(String str) {
        return a.a(str, "getSensorCapability", DEVICE_SENSOR_CAPABILITY, 2);
    }

    public static String getDeviceCategory(String str) {
        return a.b(str, "getDeviceCategory", DEVICE_CATEGORY);
    }

    public static int getDeviceType(String str) {
        if (com.huawei.wearengine.utils.a.a("powerMode")) {
            return a.a(str, "getDeviceType", DEVICE_TYPE, -1);
        }
        return -1;
    }
}
