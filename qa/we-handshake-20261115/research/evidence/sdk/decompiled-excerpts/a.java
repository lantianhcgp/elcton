package com.huawei.wearengine.common;

import android.os.ParcelFileDescriptor;
import android.text.TextUtils;
import android.util.Log;
import com.huawei.wearengine.WearEngineException;
import com.huawei.wearengine.p2p.Message;
import com.huawei.wearengine.p2p.MessageParcel;
import com.huawei.wearengine.p2p.MessageParcelExtra;
import com.huawei.wearengine.utils.HexUtil;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.UnsupportedEncodingException;
import org.json.JSONException;
import org.json.JSONObject;

/* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/common/a.class */
public class a {
    public static <T> T a(T t, Object obj) {
        if (t != null) {
            return t;
        }
        a("Preconditions", String.valueOf(obj));
        throw new WearEngineException(5);
    }

    public static void a(String str, int i) {
        try {
            if (TextUtils.isEmpty(str) || str.getBytes("UTF-8").length > i) {
                a("Preconditions", "checkArgumentByteLimit exceeded the maximum length: " + str);
                throw new WearEngineException(5);
            }
        } catch (UnsupportedEncodingException unused) {
            a("Preconditions", "checkArgumentByteLimit UnsupportedEncodingException");
            throw new WearEngineException(5);
        }
    }

    public static int b(String str, String str2) {
        return Log.i("WearEngine_" + str, str2);
    }

    public static int c(String str, String str2) {
        return Log.w("WearEngine_" + str, str2);
    }

    public static int a(String str, String str2) {
        return Log.e("WearEngine_" + str, str2);
    }

    public static MessageParcel a(Message message) {
        File file;
        if (message == null) {
            return null;
        }
        MessageParcel messageParcel = new MessageParcel();
        int type = message.getType();
        messageParcel.setType(type);
        if (type == 1) {
            messageParcel.setData(message.getData());
        } else if (type == 2 && (file = message.getFile()) != null) {
            try {
                messageParcel.setParcelFileDescriptor(ParcelFileDescriptor.open(file, 268435456));
                messageParcel.setFileName(file.getName());
                messageParcel.setDescription(message.getDescription());
                messageParcel.setFileSha256(HexUtil.getFileShaHex(file));
            } catch (FileNotFoundException unused) {
                a("ConvertParcelUtil", "convertToMessageParcel FileNotFoundException");
                throw new WearEngineException(10);
            }
        }
        return messageParcel;
    }

    public static MessageParcelExtra a(Message message, MessageParcel messageParcel) {
        if (message == null) {
            a("ConvertParcelUtil", "convertToMessageParcelExtra message is null");
            return null;
        }
        if (messageParcel == null) {
            a("ConvertParcelUtil", "convertToMessageParcelExtra messageParcel is null");
            return null;
        }
        MessageParcelExtra messageParcelExtra = new MessageParcelExtra();
        messageParcelExtra.setType(messageParcel.getType());
        messageParcelExtra.setData(messageParcel.getData());
        messageParcelExtra.setParcelFileDescriptor(messageParcel.getParcelFileDescriptor());
        messageParcelExtra.setFileName(messageParcel.getFileName());
        messageParcelExtra.setDescription(messageParcel.getDescription());
        messageParcelExtra.setFileSha256(messageParcel.getFileSha256());
        JSONObject jSONObject = new JSONObject();
        try {
            jSONObject.put("message_enable_encrypt", message.isEnableEncrypt());
        } catch (JSONException unused) {
            a("P2pJsonUtil", "buildMessageExJson JSONException");
        }
        messageParcelExtra.setExtendJson(jSONObject.toString());
        return messageParcelExtra;
    }

    public static String a(String str, String str2, String str3, Object obj) {
        JSONObject jSONObject;
        JSONObject jSONObject2;
        JSONObject jSONObject3;
        try {
            if (TextUtils.isEmpty(str)) {
                jSONObject2 = jSONObject;
                jSONObject = new JSONObject();
            } else {
                jSONObject2 = jSONObject3;
                jSONObject3 = new JSONObject(str);
            }
            JSONObject jSONObject4 = jSONObject2;
            jSONObject4.put(str3, obj);
            return jSONObject4.toString();
        } catch (JSONException unused) {
            c("ClientJsonUtil", str2 + " catch JSONException");
            return "";
        }
    }

    public static boolean a(String str, String str2, String str3) {
        if (TextUtils.isEmpty(str)) {
            c("ClientJsonUtil", str2 + " jsonString is empty");
            return false;
        }
        try {
            JSONObject jSONObject = new JSONObject(str);
            if (jSONObject.has(str3)) {
                return jSONObject.getBoolean(str3);
            }
            c("ClientJsonUtil", str2 + " input json not has key");
            return false;
        } catch (JSONException unused) {
            c("ClientJsonUtil", str2 + " catch JSONException");
            return false;
        }
    }

    public static String b(String str, String str2, String str3) {
        if (TextUtils.isEmpty(str)) {
            c("ClientJsonUtil", str2 + " jsonString is empty");
            return "";
        }
        try {
            JSONObject jSONObject = new JSONObject(str);
            if (jSONObject.has(str3)) {
                return jSONObject.getString(str3);
            }
            c("ClientJsonUtil", str2 + " input json not has key");
            return "";
        } catch (JSONException unused) {
            c("ClientJsonUtil", str2 + " catch JSONException");
            return "";
        }
    }

    public static int a(String str, String str2, String str3, int i) {
        if (TextUtils.isEmpty(str)) {
            c("ClientJsonUtil", str2 + " jsonString is empty");
            return i;
        }
        try {
            JSONObject jSONObject = new JSONObject(str);
            if (jSONObject.has(str3)) {
                return jSONObject.getInt(str3);
            }
            c("ClientJsonUtil", str2 + " input json not has key");
            return i;
        } catch (JSONException unused) {
            c("ClientJsonUtil", str2 + " catch JSONException");
            return i;
        }
    }
}
