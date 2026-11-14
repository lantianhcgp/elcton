package com.huawei.wearengine.p2p;

import android.text.TextUtils;
import com.huawei.hmf.tasks.Task;
import com.huawei.hmf.tasks.Tasks;
import com.huawei.wearengine.WearEngineException;
import com.huawei.wearengine.device.Device;
import java.io.File;
import java.util.Timer;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient.class */
public final class P2pClient {
    private static volatile P2pClient f;
    private String b = "";
    private String c = "";
    private Timer d = null;
    private ExecutorService e = new ThreadPoolExecutor(1, 1, 0, TimeUnit.MILLISECONDS, new LinkedBlockingQueue());
    private P2pServiceProxy a = P2pServiceProxy.getInstance();

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$a.class */
    class a implements Callable<Void> {
        final /* synthetic */ Peer a;
        final /* synthetic */ FileIdentification b;
        final /* synthetic */ CancelFileTransferCallBack c;

        a(Peer peer, FileIdentification fileIdentification, CancelFileTransferCallBack cancelFileTransferCallBack) {
            this.a = peer;
            this.b = fileIdentification;
            this.c = cancelFileTransferCallBack;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            com.huawei.wearengine.common.a.a(this.a, "Peer can not be null!");
            Device device = this.a.getDevice();
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(device, "Device can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "fileIdentification can not be null!");
            com.huawei.wearengine.common.a.a(this.c, "CancelFileTransferCallBack can not be null!");
            int iA = P2pClient.a(P2pClient.this, device, new IdentityInfo(packageName, strA), new IdentityInfo(this.a.getPkgName(), this.a.getFingerPrint()), this.b, this.c);
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$b.class */
    class b implements Callable<Void> {
        final /* synthetic */ Device a;
        final /* synthetic */ Receiver b;

        b(Device device, Receiver receiver) {
            this.a = device;
            this.b = receiver;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "Receiver can not be null!");
            int iA = P2pClient.a(P2pClient.this, this.a, this.b, new IdentityInfo(packageName, strA), new IdentityInfo(P2pClient.this.b, P2pClient.this.c));
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$c.class */
    class c implements Callable<Void> {
        final /* synthetic */ Peer a;
        final /* synthetic */ Receiver b;

        c(Peer peer, Receiver receiver) {
            this.a = peer;
            this.b = receiver;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            com.huawei.wearengine.common.a.a(this.a, "Peer can not be null!");
            Device device = this.a.getDevice();
            com.huawei.wearengine.common.a.a(device, "Device can not be null!");
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "Receiver can not be null!");
            int iA = P2pClient.a(P2pClient.this, device, this.b, new IdentityInfo(packageName, strA), new IdentityInfo(this.a.getPkgName(), this.a.getFingerPrint()));
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$d.class */
    class d implements Callable<Void> {
        final /* synthetic */ Receiver a;

        d(Receiver receiver) {
            this.a = receiver;
        }

        @Override // java.util.concurrent.Callable
        public Void call() {
            com.huawei.wearengine.common.a.a(this.a, "Receiver can not be null!");
            int iIdentityHashCode = System.identityHashCode(this.a);
            final P2pClient p2pClient = P2pClient.this;
            if (p2pClient == null) {
                throw null;
            }
            int iUnregisterReceiver = P2pClient.this.a.unregisterReceiver(new ReceiverCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.17
                @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
                public void onReceiveMessage(byte[] bArr) {
                }

                @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
                public void onReceiveFileMessage(MessageParcel messageParcel) {
                }
            }, iIdentityHashCode);
            if (iUnregisterReceiver == 0) {
                return null;
            }
            throw new WearEngineException(iUnregisterReceiver);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$e.class */
    class e implements Callable<Boolean> {
        final /* synthetic */ Device a;
        final /* synthetic */ String b;

        e(Device device, String str) {
            this.a = device;
            this.b = str;
        }

        @Override // java.util.concurrent.Callable
        public Boolean call() {
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            if (!TextUtils.isEmpty(this.b)) {
                return Boolean.valueOf(P2pClient.this.a.getDeviceAppVersionCode(this.a, com.huawei.wearengine.utils.b.a().getPackageName(), this.b) != -1);
            }
            com.huawei.wearengine.common.a.a("Preconditions", "targetPkgName can not be null!");
            throw new WearEngineException(5);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$f.class */
    class f implements Callable<Integer> {
        final /* synthetic */ Device a;
        final /* synthetic */ String b;

        f(Device device, String str) {
            this.a = device;
            this.b = str;
        }

        @Override // java.util.concurrent.Callable
        public Integer call() {
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            if (TextUtils.isEmpty(this.b)) {
                com.huawei.wearengine.common.a.a("Preconditions", "targetPkgName can not be null!");
                throw new WearEngineException(5);
            }
            return Integer.valueOf(P2pClient.this.a.getDeviceAppVersionCode(this.a, com.huawei.wearengine.utils.b.a().getPackageName(), this.b));
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$g.class */
    class g implements Callable<Void> {
        final /* synthetic */ Device a;
        final /* synthetic */ PingCallback b;

        g(Device device, PingCallback pingCallback) {
            this.a = device;
            this.b = pingCallback;
        }

        @Override // java.util.concurrent.Callable
        public Void call() {
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "PingCallback can not be null!");
            final P2pClient p2pClient = P2pClient.this;
            final PingCallback pingCallback = this.b;
            if (p2pClient == null) {
                throw null;
            }
            P2pPingCallback.Stub stub = new P2pPingCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.2
                @Override // com.huawei.wearengine.p2p.P2pPingCallback.Stub, com.huawei.wearengine.p2p.P2pPingCallback
                public void onResult(int i) {
                    pingCallback.onPingResult(i);
                }
            };
            int iPing = P2pClient.this.a.ping(this.a, com.huawei.wearengine.utils.b.a().getPackageName(), P2pClient.this.b, stub);
            if (iPing == 0) {
                return null;
            }
            throw new WearEngineException(iPing);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$h.class */
    class h implements Callable<Void> {
        final /* synthetic */ Device a;
        final /* synthetic */ Message b;
        final /* synthetic */ SendCallback c;

        h(Device device, Message message, SendCallback sendCallback) {
            this.a = device;
            this.b = message;
            this.c = sendCallback;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "Message can not be null!");
            com.huawei.wearengine.common.a.a(this.c, "SendCallback can not be null!");
            String str = "doSend srcPkgName: " + packageName + " srcFingerPrint:" + strA;
            int iA = P2pClient.a(P2pClient.this, this.a, new IdentityInfo(packageName, strA), new IdentityInfo(P2pClient.this.b, P2pClient.this.c), this.b, this.c);
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$i.class */
    class i implements Callable<Void> {
        final /* synthetic */ Peer a;
        final /* synthetic */ Message b;
        final /* synthetic */ SendCallback c;

        i(Peer peer, Message message, SendCallback sendCallback) {
            this.a = peer;
            this.b = message;
            this.c = sendCallback;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            com.huawei.wearengine.common.a.a(this.a, "Peer can not be null!");
            Device device = this.a.getDevice();
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(device, "Device can not be null!");
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "Message can not be null!");
            com.huawei.wearengine.common.a.a(this.c, "SendCallback can not be null!");
            String str = "doSend srcPkgName: " + packageName + " srcFingerPrint:" + strA;
            int iA = P2pClient.a(P2pClient.this, device, new IdentityInfo(packageName, strA), new IdentityInfo(this.a.getPkgName(), this.a.getFingerPrint()), this.b, this.c);
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$j.class */
    class j implements Callable<Void> {
        final /* synthetic */ Device a;
        final /* synthetic */ String b;
        final /* synthetic */ String c;
        final /* synthetic */ Message d;
        final /* synthetic */ SendCallback e;

        j(Device device, String str, String str2, Message message, SendCallback sendCallback) {
            this.a = device;
            this.b = str;
            this.c = str2;
            this.d = message;
            this.e = sendCallback;
        }

        @Override // java.util.concurrent.Callable
        public Void call() {
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            com.huawei.wearengine.common.a.a(this.b, (Object) "srcPkgName can not be null!");
            com.huawei.wearengine.common.a.a(this.c, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.d, "Message can not be null!");
            com.huawei.wearengine.common.a.a(this.e, "SendCallback can not be null!");
            String str = "doSend srcPkgName: " + this.b + " srcFingerPrint:" + this.c;
            int iB = P2pClient.b(P2pClient.this, this.a, new IdentityInfo(this.b, this.c), new IdentityInfo(P2pClient.this.b, P2pClient.this.c), this.d, this.e);
            if (iB == 0) {
                return null;
            }
            throw new WearEngineException(iB);
        }
    }

    /* JADX INFO: loaded from: classes.jar:com/huawei/wearengine/p2p/P2pClient$k.class */
    class k implements Callable<Void> {
        final /* synthetic */ Device a;
        final /* synthetic */ FileIdentification b;
        final /* synthetic */ CancelFileTransferCallBack c;

        k(Device device, FileIdentification fileIdentification, CancelFileTransferCallBack cancelFileTransferCallBack) {
            this.a = device;
            this.b = fileIdentification;
            this.c = cancelFileTransferCallBack;
        }

        @Override // java.util.concurrent.Callable
        public Void call() throws Throwable {
            String packageName = com.huawei.wearengine.utils.b.a().getPackageName();
            com.huawei.wearengine.common.a.a(packageName, (Object) "srcPkgName can not be null!");
            String strA = com.huawei.wearengine.utils.b.a(com.huawei.wearengine.utils.b.a(), packageName);
            com.huawei.wearengine.common.a.a(strA, (Object) "srcFingerPrint can not be null!");
            com.huawei.wearengine.common.a.a(this.a, "Device can not be null!");
            com.huawei.wearengine.common.a.a(this.b, "fileIdentification can not be null!");
            com.huawei.wearengine.common.a.a(this.c, "CancelFileTransferCallBack can not be null!");
            int iA = P2pClient.a(P2pClient.this, this.a, new IdentityInfo(packageName, strA), new IdentityInfo(P2pClient.this.b, P2pClient.this.c), this.b, this.c);
            if (iA == 0) {
                return null;
            }
            throw new WearEngineException(iA);
        }
    }

    private P2pClient() {
    }

    /* JADX WARN: Multi-variable type inference failed */
    /* JADX WARN: Type inference failed for: r0v2, types: [java.lang.Class<com.huawei.wearengine.p2p.P2pClient>] */
    /* JADX WARN: Type inference failed for: r0v3, types: [java.lang.Throwable] */
    /* JADX WARN: Type inference failed for: r0v5 */
    public static P2pClient getInstance() {
        if (f == null) {
            ?? r0 = P2pClient.class;
            synchronized (r0) {
                try {
                    if (f == null) {
                        f = new P2pClient();
                    }
                    r0 = r0;
                } catch (Throwable th) {
                    throw r0;
                }
            }
        }
        return f;
    }

    static int a(P2pClient p2pClient, Device device, IdentityInfo identityInfo, IdentityInfo identityInfo2, Message message, final SendCallback sendCallback) {
        if (p2pClient == null) {
            throw null;
        }
        if ((sendCallback instanceof SendExtraCallback) && !com.huawei.wearengine.utils.a.a("p2p_send_file_transfer_way_report")) {
            com.huawei.wearengine.common.a.a("P2pClient", "query Health version is low");
            throw new WearEngineException(14);
        }
        MessageParcel messageParcelA = com.huawei.wearengine.common.a.a(message);
        MessageParcelExtra messageParcelExtraA = com.huawei.wearengine.common.a.a(message, messageParcelA);
        P2pSendCallback.Stub stub = new P2pSendCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.6
            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendResult(int i2) {
                sendCallback.onSendResult(i2);
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendProgress(long j2) {
                sendCallback.onSendProgress(j2);
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onFileTransferReport(String str) {
                SendCallback sendCallback2 = sendCallback;
                if (sendCallback2 instanceof SendExtraCallback) {
                    ((SendExtraCallback) sendCallback2).onFileTransferReport(str);
                }
            }
        };
        int iSendExtra = p2pClient.a.sendExtra(device, messageParcelExtraA, identityInfo, identityInfo2, stub);
        int iSend = iSendExtra;
        if (iSendExtra == 14) {
            iSend = p2pClient.a.send(device, messageParcelA, identityInfo, identityInfo2, stub);
        }
        return iSend;
    }

    static int b(P2pClient p2pClient, Device device, IdentityInfo identityInfo, IdentityInfo identityInfo2, Message message, final SendCallback sendCallback) {
        if (p2pClient == null) {
            throw null;
        }
        if (message.getType() == 2) {
            com.huawei.wearengine.common.a.a("P2pClient", "reliableSendData Invalid argument");
            return 5;
        }
        if ((sendCallback instanceof SendExtraCallback) && !com.huawei.wearengine.utils.a.a("p2p_send_file_transfer_way_report")) {
            com.huawei.wearengine.common.a.a("P2pClient", "query Health version is low");
            throw new WearEngineException(14);
        }
        if (p2pClient.d == null) {
            p2pClient.d = new Timer();
        }
        String string = UUID.randomUUID().toString();
        com.huawei.wearengine.common.a.b("P2pClient", "reliableSendData sendUuid:" + string);
        final com.huawei.wearengine.p2p.a aVar = new com.huawei.wearengine.p2p.a(string, sendCallback);
        P2pSendCallback.Stub stub = new P2pSendCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.8
            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendResult(int i2) {
                synchronized (aVar.a()) {
                    P2pClient p2pClient2 = P2pClient.this;
                    com.huawei.wearengine.p2p.a aVar2 = aVar;
                    SendCallback sendCallback2 = sendCallback;
                    if (p2pClient2 == null) {
                        throw null;
                    }
                    if (!aVar2.b()) {
                        aVar2.cancel();
                        sendCallback2.onSendResult(i2);
                    }
                }
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendProgress(long j2) {
                sendCallback.onSendProgress(j2);
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onFileTransferReport(String str) {
                SendCallback sendCallback2 = sendCallback;
                if (sendCallback2 instanceof SendExtraCallback) {
                    ((SendExtraCallback) sendCallback2).onFileTransferReport(str);
                }
            }
        };
        MessageParcelExtra messageParcelExtraA = com.huawei.wearengine.common.a.a(message, com.huawei.wearengine.common.a.a(message));
        p2pClient.d.schedule(aVar, 5000L);
        return p2pClient.a.sendInternal(device, messageParcelExtraA, identityInfo, identityInfo2, stub);
    }

    public Task<Void> ping(Device device, PingCallback pingCallback) {
        return Tasks.callInBackground(new g(device, pingCallback));
    }

    public void send(Device device, String str, String str2, Message message, final SendCallback sendCallback) {
        com.huawei.wearengine.common.a.a(device, "Device can not be null!");
        com.huawei.wearengine.common.a.a(str, (Object) "srcPkgName can not be null!");
        com.huawei.wearengine.common.a.a(str2, (Object) "srcFingerPrint can not be null!");
        com.huawei.wearengine.common.a.a(message, "Message can not be null!");
        com.huawei.wearengine.common.a.a(sendCallback, "SendCallback can not be null!");
        String str3 = "doSend srcPkgName: " + str + " srcFingerPrint:" + str2;
        if ((sendCallback instanceof SendExtraCallback) && !com.huawei.wearengine.utils.a.a("p2p_send_file_transfer_way_report")) {
            com.huawei.wearengine.common.a.a("P2pClient", "query Health version is low");
            throw new WearEngineException(14);
        }
        int iSendInternal = this.a.sendInternal(device, com.huawei.wearengine.common.a.a(message, com.huawei.wearengine.common.a.a(message)), new IdentityInfo(str, str2), new IdentityInfo(this.b, this.c), new P2pSendCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.3
            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendResult(int i2) {
                sendCallback.onSendResult(i2);
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onSendProgress(long j2) {
                sendCallback.onSendProgress(j2);
            }

            @Override // com.huawei.wearengine.p2p.P2pSendCallback.Stub, com.huawei.wearengine.p2p.P2pSendCallback
            public void onFileTransferReport(String str4) {
                SendCallback sendCallback2 = sendCallback;
                if (sendCallback2 instanceof SendExtraCallback) {
                    ((SendExtraCallback) sendCallback2).onFileTransferReport(str4);
                }
            }
        });
        if (iSendInternal != 0) {
            throw new WearEngineException(iSendInternal);
        }
    }

    public Task<Void> send(Device device, Message message, SendCallback sendCallback) {
        return Tasks.callInBackground(new h(device, message, sendCallback));
    }

    public Task<Void> send(Peer peer, Message message, SendCallback sendCallback) {
        return Tasks.callInBackground(new i(peer, message, sendCallback));
    }

    public Task<Void> reliableSend(Device device, String str, String str2, Message message, SendCallback sendCallback) {
        return Tasks.callInBackground(this.e, new j(device, str, str2, message, sendCallback));
    }

    public Task<Void> cancelFileTransfer(Device device, FileIdentification fileIdentification, CancelFileTransferCallBack cancelFileTransferCallBack) {
        return Tasks.callInBackground(new k(device, fileIdentification, cancelFileTransferCallBack));
    }

    public Task<Void> cancelFileTransfer(Peer peer, FileIdentification fileIdentification, CancelFileTransferCallBack cancelFileTransferCallBack) {
        return Tasks.callInBackground(new a(peer, fileIdentification, cancelFileTransferCallBack));
    }

    public P2pClient setPeerPkgName(String str) {
        this.b = str;
        return this;
    }

    public P2pClient setPeerFingerPrint(String str) {
        this.c = str;
        return this;
    }

    public void registerReceiver(Device device, String str, String str2, final Receiver receiver) {
        com.huawei.wearengine.common.a.a(device, "Device can not be null!");
        com.huawei.wearengine.common.a.a(str, (Object) "srcPkgName can not be null!");
        com.huawei.wearengine.common.a.a(str2, (Object) "srcFingerPrint can not be null!");
        com.huawei.wearengine.common.a.a(receiver, "Receiver can not be null!");
        ReceiverCallback.Stub stub = new ReceiverCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.12
            @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
            public void onReceiveMessage(byte[] bArr) {
                Message.Builder builder = new Message.Builder();
                builder.setPayload(bArr);
                receiver.onReceiveMessage(builder.build());
            }

            @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
            public void onReceiveFileMessage(MessageParcel messageParcel) {
                P2pClient.a(P2pClient.this, receiver, messageParcel);
            }
        };
        int iRegisterReceiverInternal = this.a.registerReceiverInternal(device, new IdentityInfo(str, str2), new IdentityInfo(this.b, this.c), stub, System.identityHashCode(receiver));
        if (iRegisterReceiverInternal != 0) {
            throw new WearEngineException(iRegisterReceiverInternal);
        }
    }

    public Task<Void> registerReceiver(Device device, Receiver receiver) {
        return Tasks.callInBackground(new b(device, receiver));
    }

    public Task<Void> registerReceiver(Peer peer, Receiver receiver) {
        return Tasks.callInBackground(new c(peer, receiver));
    }

    public Task<Void> unregisterReceiver(Receiver receiver) {
        return Tasks.callInBackground(new d(receiver));
    }

    public Task<Boolean> isAppInstalled(Device device, String str) {
        return Tasks.callInBackground(new e(device, str));
    }

    public Task<Integer> getAppVersion(Device device, String str) {
        return Tasks.callInBackground(new f(device, str));
    }

    static int a(P2pClient p2pClient, Device device, IdentityInfo identityInfo, IdentityInfo identityInfo2, FileIdentification fileIdentification, final CancelFileTransferCallBack cancelFileTransferCallBack) {
        FileIdentificationParcel fileIdentificationParcel;
        if (p2pClient == null) {
            throw null;
        }
        if (fileIdentification == null) {
            com.huawei.wearengine.common.a.a("ConvertParcelUtil", "convertToFileIdentificationParcel fileIdentification is null");
            fileIdentificationParcel = null;
        } else {
            fileIdentificationParcel = fileIdentificationParcel;
            FileIdentificationParcel fileIdentificationParcel2 = new FileIdentificationParcel();
            File file = fileIdentification.getFile();
            if (file != null) {
                fileIdentificationParcel.setFileName(file.getName());
            }
            fileIdentificationParcel.setDescription(fileIdentification.getDescription());
        }
        return p2pClient.a.cancelFileTransfer(device, fileIdentificationParcel, identityInfo, identityInfo2, new P2pCancelFileTransferCallBack.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.11
            @Override // com.huawei.wearengine.p2p.P2pCancelFileTransferCallBack.Stub, com.huawei.wearengine.p2p.P2pCancelFileTransferCallBack
            public void onCancelFileTransferResult(int i2, String str) {
                com.huawei.wearengine.common.a.b("P2pClient", "cancelFileTransfer onCancelFileTransferResult, errCode: " + i2);
                cancelFileTransferCallBack.onCancelFileTransferResult(i2);
            }
        });
    }

    static void a(P2pClient p2pClient, Receiver receiver, MessageParcel messageParcel) {
        if (p2pClient == null) {
            throw null;
        }
        if (messageParcel == null) {
            com.huawei.wearengine.common.a.a("P2pClient", "handleReceiveFile messageParcel is null");
            receiver.onReceiveMessage(new Message.Builder().build());
            return;
        }
        Message.Builder builder = new Message.Builder();
        int type = messageParcel.getType();
        String str = "handleReceiveFile type:" + type;
        if (type != 2) {
            com.huawei.wearengine.common.a.c("P2pClient", "handleReceiveFile type is not file");
        } else {
            builder.setPayload(com.huawei.wearengine.utils.b.a(messageParcel.getFileName(), messageParcel.getParcelFileDescriptor()));
            receiver.onReceiveMessage(builder.build());
        }
    }

    static int a(P2pClient p2pClient, Device device, final Receiver receiver, IdentityInfo identityInfo, IdentityInfo identityInfo2) {
        if (p2pClient == null) {
            throw null;
        }
        return p2pClient.a.registerReceiver(device, identityInfo, identityInfo2, new ReceiverCallback.Stub() { // from class: com.huawei.wearengine.p2p.P2pClient.15
            @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
            public void onReceiveMessage(byte[] bArr) {
                Message.Builder builder = new Message.Builder();
                builder.setPayload(bArr);
                receiver.onReceiveMessage(builder.build());
            }

            @Override // com.huawei.wearengine.p2p.ReceiverCallback.Stub, com.huawei.wearengine.p2p.ReceiverCallback
            public void onReceiveFileMessage(MessageParcel messageParcel) {
                P2pClient.a(P2pClient.this, receiver, messageParcel);
            }
        }, System.identityHashCode(receiver));
    }
}
