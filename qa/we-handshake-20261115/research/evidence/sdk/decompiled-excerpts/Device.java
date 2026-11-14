package com.huawei.wearengine.device;

import android.os.Parcel;
import android.os.Parcelable;
import android.text.TextUtils;
import com.huawei.wearengine.utils.json.DeviceJsonUtil;

/* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/device/Device.class */
public class Device implements Parcelable {
    public static final int DEVICE_CONNECTED = 2;
    public static final int DEVICE_CAPABILITY_SUPPORT = 0;
    public static final int DEVICE_CAPABILITY_NOT_SUPPORT = 1;
    public static final int DEVICE_CAPABILITY_UNKNOWN = 2;
    public static final int ERR_HASH_CODE = -1;
    public static final Parcelable.Creator<Device> CREATOR = new a();
    private static final int DEFAULT_PRODUCT_TYPE = -1;
    private String mName;
    private String mUuid;
    private String mModel;
    private int mProductType = -1;
    private int mConnectState;
    private String mReservedness;

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/device/Device$a.class */
    static class a implements Parcelable.Creator<Device> {
        a() {
        }

        @Override // android.os.Parcelable.Creator
        public Device[] newArray(int i) {
            return (i > 65535 || i < 0) ? new Device[0] : new Device[i];
        }

        @Override // android.os.Parcelable.Creator
        public Device createFromParcel(Parcel parcel) {
            Device device = new Device();
            if (parcel != null) {
                device.setName(parcel.readString());
                device.setUuid(parcel.readString());
                device.setModel(parcel.readString());
                device.setProductType(parcel.readInt());
                device.setConnectState(parcel.readInt());
                device.setReservedness(parcel.readString());
            }
            return device;
        }
    }

    public String getName() {
        return this.mName;
    }

    public void setName(String str) {
        this.mName = str;
    }

    public String getUuid() {
        return this.mUuid;
    }

    public void setUuid(String str) {
        this.mUuid = str;
    }

    public String getModel() {
        return this.mModel;
    }

    public void setModel(String str) {
        this.mModel = str;
    }

    public int getProductType() {
        return this.mProductType;
    }

    public void setProductType(int i) {
        this.mProductType = i;
    }

    public void setConnectState(int i) {
        this.mConnectState = i;
    }

    public boolean isConnected() {
        return this.mConnectState == 2;
    }

    public String getReservedness() {
        String reservedness = DeviceJsonUtil.getReservedness(this.mReservedness);
        return TextUtils.isEmpty(reservedness) ? this.mReservedness : reservedness;
    }

    public void setReservedness(String str) {
        this.mReservedness = str;
    }

    public String getCapability() {
        return DeviceJsonUtil.getCapability(this.mReservedness);
    }

    public String getBasicInfo() {
        return DeviceJsonUtil.getBasicInfo(this.mReservedness);
    }

    public String getIdentify() {
        return DeviceJsonUtil.getIdentify(this.mReservedness);
    }

    public String getSoftwareVersion() {
        return DeviceJsonUtil.getSoftwareVersion(this.mReservedness);
    }

    public boolean isSupportOta() {
        return DeviceJsonUtil.getSupportOta(this.mReservedness);
    }

    public int getP2pCapability() {
        return DeviceJsonUtil.getP2pCapability(this.mReservedness);
    }

    public int getMonitorCapability() {
        return DeviceJsonUtil.getMonitorCapability(this.mReservedness);
    }

    public int getNotifyCapability() {
        return DeviceJsonUtil.getNotifyCapability(this.mReservedness);
    }

    public int getSensorCapability() {
        return DeviceJsonUtil.getSensorCapability(this.mReservedness);
    }

    public String getDeviceCategory() {
        return DeviceJsonUtil.getDeviceCategory(this.mReservedness);
    }

    public String getExtra() {
        return DeviceJsonUtil.getExtra(this.mReservedness);
    }

    public int getDeviceType() {
        return DeviceJsonUtil.getDeviceType(this.mReservedness);
    }

    @Override // android.os.Parcelable
    public void writeToParcel(Parcel parcel, int i) {
        if (parcel == null) {
            return;
        }
        parcel.writeString(this.mName);
        parcel.writeString(this.mUuid);
        parcel.writeString(this.mModel);
        parcel.writeInt(this.mProductType);
        parcel.writeInt(this.mConnectState);
        parcel.writeString(this.mReservedness);
    }

    public void readFromParcel(Parcel parcel) {
        if (parcel == null) {
            return;
        }
        this.mName = parcel.readString();
        this.mUuid = parcel.readString();
        this.mModel = parcel.readString();
        this.mProductType = parcel.readInt();
        this.mConnectState = parcel.readInt();
        this.mReservedness = parcel.readString();
    }

    @Override // android.os.Parcelable
    public int describeContents() {
        return 0;
    }

    public int hashCode() {
        String str = this.mUuid;
        if (str != null) {
            return str.hashCode();
        }
        return -1;
    }

    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof Device)) {
            return false;
        }
        Device device = (Device) obj;
        String str = this.mUuid;
        if (str == null || device.mUuid == null) {
            return false;
        }
        return str.equals(device.getUuid());
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Device{mName='").append(this.mName);
        sb.append("', mUuid='").append(this.mUuid);
        sb.append("', mModel='").append(this.mModel);
        sb.append("', mProductType='").append(this.mProductType);
        sb.append("', mConnectState='").append(this.mConnectState);
        sb.append("', mReservedness='").append(getReservedness());
        sb.append("', mSoftwareVersion='").append(getSoftwareVersion());
        sb.append("', isSupportOta='").append(isSupportOta());
        sb.append("', mP2pCapability='").append(getP2pCapability());
        sb.append("', mMonitorCapability='").append(getMonitorCapability());
        sb.append("', mNotifyCapability='").append(getNotifyCapability());
        sb.append("', mSensorCapability='").append(getSensorCapability());
        sb.append("', mDeviceCategory='").append(getDeviceCategory());
        sb.append("', mDeviceType='").append(getDeviceType());
        sb.append("'}");
        return sb.toString();
    }
}
