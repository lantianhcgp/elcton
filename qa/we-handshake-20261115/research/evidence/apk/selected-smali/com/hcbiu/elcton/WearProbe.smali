.class public final Lcom/hcbiu/elcton/WearProbe;
.super Ljava/lang/Object;
.source "WearProbe.kt"

# interfaces
.implements Lcom/hcbiu/elcton/SyncTransport;


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/hcbiu/elcton/WearProbe$NativeRegistration;
    }
.end annotation

.annotation system Ldalvik/annotation/SourceDebugExtension;
    value = "SMAP\nWearProbe.kt\nKotlin\n*S Kotlin\n*F\n+ 1 WearProbe.kt\ncom/hcbiu/elcton/WearProbe\n+ 2 fake.kt\nkotlin/jvm/internal/FakeKt\n+ 3 _Strings.kt\nkotlin/text/StringsKt___StringsKt\n+ 4 _Arrays.kt\nkotlin/collections/ArraysKt___ArraysKt\n*L\n1#1,232:1\n1#2:233\n1083#3,2:234\n12285#4,2:236\n*S KotlinDebug\n*F\n+ 1 WearProbe.kt\ncom/hcbiu/elcton/WearProbe\n*L\n202#1:234,2\n159#1:236,2\n*E\n"
.end annotation

.annotation runtime Lkotlin/Metadata;
    d1 = {
        "\u0000\u00b6\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\u0010\t\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010%\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0008\u0003\n\u0002\u0018\u0002\n\u0002\u0008\u0002\n\u0002\u0010\u0000\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u0006\n\u0002\u0018\u0002\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u0007\n\u0002\u0010\u000b\n\u0002\u0008\t\n\u0002\u0018\u0002\n\u0002\u0008\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u000c\n\u0002\u0018\u0002\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u0003\n\u0002\u0010 \n\u0002\u0008\u0002\n\u0002\u0010\u0008\n\u0002\u0008\u0003\u0008\u0007\u0018\u00002\u00020\u0001:\u0001[B=\u0008\u0016\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00070\u0005\u0012\u0018\u0010\u0008\u001a\u0014\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u000b\u0012\u0004\u0012\u00020\u00070\t\u00a2\u0006\u0002\u0010\u000cB\u0015\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\r\u001a\u00020\u000e\u00a2\u0006\u0002\u0010\u000fJ\u000e\u00101\u001a\u00020\u00072\u0006\u0010\u0010\u001a\u00020\u0012J\u001c\u00102\u001a\u0002032\u0008\u0008\u0002\u00104\u001a\u0002032\n\u0008\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u0012J\u0006\u00105\u001a\u00020\u0007J0\u00106\u001a\u00020\u00072\u0012\u00107\u001a\u000e\u0012\u0004\u0012\u000203\u0012\u0004\u0012\u00020\u00070\u00052\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J\u0006\u00109\u001a\u00020\u0007J\u0006\u0010:\u001a\u00020\u0007J\u000e\u0010;\u001a\u0002032\u0006\u0010<\u001a\u00020=J\u000e\u0010;\u001a\u0002032\u0006\u0010>\u001a\u00020\nJ\u001c\u0010?\u001a\u00020\n2\n\u0010@\u001a\u00060Aj\u0002`B2\u0006\u0010C\u001a\u00020\nH\u0002J\u000e\u0010D\u001a\u00020\u00072\u0006\u0010\u0010\u001a\u00020\u0012J\u0008\u0010E\u001a\u00020\u0007H\u0002J8\u0010F\u001a\u00020\u00072\u0006\u0010<\u001a\u00020=2\u0012\u00107\u001a\u000e\u0012\u0004\u0012\u000203\u0012\u0004\u0012\u00020\u00070\u00052\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J\u0012\u0010G\u001a\u0004\u0018\u00010\u00152\u0006\u0010<\u001a\u00020=H\u0002J&\u0010H\u001a\u0002032\u0006\u0010I\u001a\u00020\n2\u0006\u0010J\u001a\u0002032\u0006\u0010K\u001a\u00020\n2\u0006\u0010L\u001a\u00020\u000bJF\u0010M\u001a\u00020\u00072\u0006\u0010<\u001a\u00020=2\u0012\u0010N\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u00052\u000c\u00107\u001a\u0008\u0012\u0004\u0012\u00020\u00070O2\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J\u0010\u0010P\u001a\u00020\u00072\u0006\u0010Q\u001a\u00020RH\u0002J\u0006\u0010S\u001a\u000203J0\u0010T\u001a\u0002032\u0012\u00107\u001a\u000e\u0012\u0004\u0012\u000203\u0012\u0004\u0012\u00020\u00070\u00052\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J6\u0010U\u001a\u00020\u00072\u0018\u00107\u001a\u0014\u0012\n\u0012\u0008\u0012\u0004\u0012\u00020=0V\u0012\u0004\u0012\u00020\u00070\u00052\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J@\u0010W\u001a\u00020\u00072\u0006\u0010<\u001a\u00020=2\u0006\u0010I\u001a\u00020\n2\u0012\u0010X\u001a\u000e\u0012\u0004\u0012\u00020Y\u0012\u0004\u0012\u00020\u00070\u00052\u0012\u00108\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00070\u0005H\u0016J\u0008\u0010Z\u001a\u00020\u0007H\u0016R\u0014\u0010\u0010\u001a\u0008\u0012\u0004\u0012\u00020\u00120\u0011X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\u0013\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u00150\u0014X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u0016\u001a\u00020\u00178F\u00a2\u0006\u0006\u001a\u0004\u0008\u0018\u0010\u0019R\u000e\u0010\u001a\u001a\u00020\u001bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R \u0010\u0008\u001a\u0014\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u000b\u0012\u0004\u0012\u00020\u00070\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001c\u001a\u00020\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001d\u001a\u00020\u001eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001f\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R#\u0010 \u001a\n \"*\u0004\u0018\u00010!0!8BX\u0082\u0084\u0002\u00a2\u0006\u000c\n\u0004\u0008%\u0010&\u001a\u0004\u0008#\u0010$R\u0010\u0010\'\u001a\u0004\u0018\u00010(X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010)\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0014\u0010*\u001a\u0008\u0012\u0004\u0012\u00020\u00170+X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010,\u001a\u00020\u00068F\u00a2\u0006\u0006\u001a\u0004\u0008-\u0010.R\u001a\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00070\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010/\u001a\u00020\nX\u0082D\u00a2\u0006\u0002\n\u0000R\u000e\u00100\u001a\u00020\nX\u0082D\u00a2\u0006\u0002\n\u0000\u00a8\u0006\\"
    }
    d2 = {
        "Lcom/hcbiu/elcton/WearProbe;",
        "Lcom/hcbiu/elcton/SyncTransport;",
        "context",
        "Landroid/content/Context;",
        "update",
        "Lkotlin/Function1;",
        "Lcom/hcbiu/elcton/SyncEngine$State;",
        "",
        "importCandidate",
        "Lkotlin/Function2;",
        "",
        "",
        "(Landroid/content/Context;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function2;)V",
        "diagnostics",
        "Lcom/hcbiu/elcton/DiagnosticRuntime;",
        "(Landroid/content/Context;Lcom/hcbiu/elcton/DiagnosticRuntime;)V",
        "activity",
        "Ljava/lang/ref/WeakReference;",
        "Landroid/app/Activity;",
        "devices",
        "",
        "Lcom/huawei/wearengine/device/Device;",
        "engine",
        "Lcom/hcbiu/elcton/SyncEngine;",
        "getEngine",
        "()Lcom/hcbiu/elcton/SyncEngine;",
        "handler",
        "Landroid/os/Handler;",
        "latestDiagnostic",
        "lock",
        "",
        "nativeGeneration",
        "p2p",
        "Lcom/huawei/wearengine/p2p/P2pClient;",
        "kotlin.jvm.PlatformType",
        "getP2p",
        "()Lcom/huawei/wearengine/p2p/P2pClient;",
        "p2p$delegate",
        "Lkotlin/Lazy;",
        "registration",
        "Lcom/hcbiu/elcton/WearProbe$NativeRegistration;",
        "scanGeneration",
        "sharedEngine",
        "Lkotlin/Lazy;",
        "state",
        "getState",
        "()Lcom/hcbiu/elcton/SyncEngine$State;",
        "watchFingerprint",
        "watchPackage",
        "attach",
        "authorizeAndScan",
        "",
        "interactive",
        "cancel",
        "checkPermission",
        "success",
        "failure",
        "clearActivity",
        "close",
        "connect",
        "device",
        "Lcom/hcbiu/elcton/SyncDevice;",
        "deviceId",
        "describe",
        "e",
        "Ljava/lang/Exception;",
        "Lkotlin/Exception;",
        "phase",
        "detach",
        "identify",
        "installed",
        "native",
        "publishSnapshot",
        "text",
        "force",
        "datasetId",
        "revision",
        "register",
        "message",
        "Lkotlin/Function0;",
        "release",
        "receiver",
        "Lcom/huawei/wearengine/p2p/Receiver;",
        "requestExport",
        "requestPermission",
        "scan",
        "",
        "send",
        "result",
        "",
        "unregister",
        "NativeRegistration",
        "app_debug"
    }
    k = 0x1
    mv = {
        0x1,
        0x9,
        0x0
    }
    xi = 0x30
.end annotation


# static fields
.field public static final $stable:I


# instance fields
.field private activity:Ljava/lang/ref/WeakReference;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/lang/ref/WeakReference<",
            "Landroid/app/Activity;",
            ">;"
        }
    .end annotation
.end field

.field private final context:Landroid/content/Context;

.field private final devices:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Lcom/huawei/wearengine/device/Device;",
            ">;"
        }
    .end annotation
.end field

.field private final diagnostics:Lcom/hcbiu/elcton/DiagnosticRuntime;

.field private final handler:Landroid/os/Handler;

.field private importCandidate:Lkotlin/jvm/functions/Function2;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lkotlin/jvm/functions/Function2<",
            "-",
            "Ljava/lang/String;",
            "-",
            "Ljava/lang/Long;",
            "Lkotlin/Unit;",
            ">;"
        }
    .end annotation
.end field

.field private latestDiagnostic:Ljava/lang/String;

.field private final lock:Ljava/lang/Object;

.field private nativeGeneration:J

.field private final p2p$delegate:Lkotlin/Lazy;

.field private registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

.field private scanGeneration:J

.field private final sharedEngine:Lkotlin/Lazy;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lkotlin/Lazy<",
            "Lcom/hcbiu/elcton/SyncEngine;",
            ">;"
        }
    .end annotation
.end field

.field private update:Lkotlin/jvm/functions/Function1;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Lcom/hcbiu/elcton/SyncEngine$State;",
            "Lkotlin/Unit;",
            ">;"
        }
    .end annotation
.end field

.field private final watchFingerprint:Ljava/lang/String;

.field private final watchPackage:Ljava/lang/String;


# direct methods
.method public static synthetic $r8$lambda$Gmt-WYodl8pNXuVuVmU_WrVJ9eA(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V
    .registers 2

    #@0
    invoke-static {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->checkPermission$lambda$0(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$MZS5UHI0qT_4rkqqLxay13oEg9g(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    invoke-static {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->checkPermission$lambda$1(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$MjnuTybFi0Kw_K2WP4gDRu515NE(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V
    .registers 2

    #@0
    invoke-static {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->installed$lambda$8(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$Phw6wLs3BTz2jbm9XonlvEGb5LI(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;JLcom/huawei/wearengine/p2p/Message;)V
    .registers 5

    #@0
    invoke-static {p0, p1, p2, p3, p4}, Lcom/hcbiu/elcton/WearProbe;->register$lambda$13(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;JLcom/huawei/wearengine/p2p/Message;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$UsTyf_QaiUqKmzDjCXXie7jRbAM(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    invoke-static {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->send$lambda$25(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$WdE7VvOsWgmypA3Nq5PN5Oj8-sI(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    invoke-static {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->scan$lambda$6(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$Ydy3FICbvBnGjPhibb9Gz9NW5M4(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    invoke-static {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->requestPermission$lambda$2(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$aOKNfDSp6SBdoL06caX50R0HPfc(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 2

    #@0
    invoke-static {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->release$lambda$23(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$fFn2zfOX9FvzZYwdQHks3oWzJoI(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function0;Lcom/huawei/wearengine/p2p/Receiver;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Void;)V
    .registers 7

    #@0
    invoke-static/range {p0 .. p6}, Lcom/hcbiu/elcton/WearProbe;->register$lambda$16(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function0;Lcom/huawei/wearengine/p2p/Receiver;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Void;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$lF8FseCm5uK1_ogtO7hpLt3fpcs(Lcom/hcbiu/elcton/WearProbe;Lcom/huawei/wearengine/p2p/Receiver;Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Exception;)V
    .registers 7

    #@0
    invoke-static/range {p0 .. p6}, Lcom/hcbiu/elcton/WearProbe;->register$lambda$18(Lcom/hcbiu/elcton/WearProbe;Lcom/huawei/wearengine/p2p/Receiver;Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$tNgg-DPLCgKHZL8EuVwkHPenv2k(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    invoke-static {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->installed$lambda$9(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$yPhoajfJZexqWNJKzshaA6qRUGc(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;JLjava/util/List;)V
    .registers 6

    #@0
    invoke-static/range {p0 .. p5}, Lcom/hcbiu/elcton/WearProbe;->scan$lambda$5(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;JLjava/util/List;)V

    #@3
    return-void
.end method

.method public static synthetic $r8$lambda$zx-LDI1kIllscu2H50856L63whs(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/String;)V
    .registers 2

    #@0
    invoke-static {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->describe$lambda$26(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/String;)V

    #@3
    return-void
.end method

.method static constructor <clinit>()V
    .registers 1

    #@0
    const/16 v0, 0x8

    #@2
    sput v0, Lcom/hcbiu/elcton/WearProbe;->$stable:I

    #@4
    return-void
.end method

.method public constructor <init>(Landroid/content/Context;Lcom/hcbiu/elcton/DiagnosticRuntime;)V
    .registers 5

    #@0
    const-string v0, "context"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "diagnostics"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    #@d
    iput-object p2, p0, Lcom/hcbiu/elcton/WearProbe;->diagnostics:Lcom/hcbiu/elcton/DiagnosticRuntime;

    #@f
    invoke-virtual {p1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;

    #@12
    move-result-object v0

    #@13
    const-string v1, "getApplicationContext(...)"

    #@15
    invoke-static {v0, v1}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@18
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->context:Landroid/content/Context;

    #@1a
    new-instance v0, Landroid/os/Handler;

    #@1c
    invoke-static {}, Landroid/os/Looper;->getMainLooper()Landroid/os/Looper;

    #@1f
    move-result-object v1

    #@20
    invoke-direct {v0, v1}, Landroid/os/Handler;-><init>(Landroid/os/Looper;)V

    #@23
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->handler:Landroid/os/Handler;

    #@25
    new-instance v0, Lcom/hcbiu/elcton/WearProbe$p2p$2;

    #@27
    invoke-direct {v0, p0}, Lcom/hcbiu/elcton/WearProbe$p2p$2;-><init>(Lcom/hcbiu/elcton/WearProbe;)V

    #@2a
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@2c
    invoke-static {v0}, Lkotlin/LazyKt;->lazy(Lkotlin/jvm/functions/Function0;)Lkotlin/Lazy;

    #@2f
    move-result-object v0

    #@30
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->p2p$delegate:Lkotlin/Lazy;

    #@32
    new-instance v0, Ljava/lang/ref/WeakReference;

    #@34
    const/4 v1, 0x0

    #@35
    invoke-direct {v0, v1}, Ljava/lang/ref/WeakReference;-><init>(Ljava/lang/Object;)V

    #@38
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->activity:Ljava/lang/ref/WeakReference;

    #@3a
    sget-object v0, Lcom/hcbiu/elcton/WearProbe$update$1;->INSTANCE:Lcom/hcbiu/elcton/WearProbe$update$1;

    #@3c
    check-cast v0, Lkotlin/jvm/functions/Function1;

    #@3e
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->update:Lkotlin/jvm/functions/Function1;

    #@40
    sget-object v0, Lcom/hcbiu/elcton/WearProbe$importCandidate$1;->INSTANCE:Lcom/hcbiu/elcton/WearProbe$importCandidate$1;

    #@42
    check-cast v0, Lkotlin/jvm/functions/Function2;

    #@44
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->importCandidate:Lkotlin/jvm/functions/Function2;

    #@46
    new-instance v0, Ljava/lang/Object;

    #@48
    invoke-direct {v0}, Ljava/lang/Object;-><init>()V

    #@4b
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@4d
    new-instance v0, Ljava/util/LinkedHashMap;

    #@4f
    invoke-direct {v0}, Ljava/util/LinkedHashMap;-><init>()V

    #@52
    check-cast v0, Ljava/util/Map;

    #@54
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->devices:Ljava/util/Map;

    #@56
    const-string v0, ""

    #@58
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->latestDiagnostic:Ljava/lang/String;

    #@5a
    new-instance v0, Lcom/hcbiu/elcton/WearProbe$sharedEngine$1;

    #@5c
    invoke-direct {v0, p0}, Lcom/hcbiu/elcton/WearProbe$sharedEngine$1;-><init>(Lcom/hcbiu/elcton/WearProbe;)V

    #@5f
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@61
    invoke-static {v0}, Lkotlin/LazyKt;->lazy(Lkotlin/jvm/functions/Function0;)Lkotlin/Lazy;

    #@64
    move-result-object v0

    #@65
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->sharedEngine:Lkotlin/Lazy;

    #@67
    const-string v0, "watchapp.nexus.0zzip"

    #@69
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->watchPackage:Ljava/lang/String;

    #@6b
    const-string v0, "watchapp.nexus.0zzip_BOc6BPXgVZY7Ik7lETcDy6ezKw77Dqm0EDBscNFv9kHcXaW7gXBRQmA8RfLcDvcCLkOSQIsB33zj/s2IS6u5utM="

    #@6d
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->watchFingerprint:Ljava/lang/String;

    #@6f
    return-void
.end method

.method public constructor <init>(Landroid/content/Context;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function2;)V
    .registers 6
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroid/content/Context;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Lcom/hcbiu/elcton/SyncEngine$State;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function2<",
            "-",
            "Ljava/lang/String;",
            "-",
            "Ljava/lang/Long;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    const-string v0, "context"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "update"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    const-string v0, "importCandidate"

    #@c
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@f
    invoke-virtual {p1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;

    #@12
    move-result-object v0

    #@13
    const-string v1, "null cannot be cast to non-null type com.hcbiu.elcton.ElctonApplication"

    #@15
    invoke-static {v0, v1}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;Ljava/lang/String;)V

    #@18
    check-cast v0, Lcom/hcbiu/elcton/ElctonApplication;

    #@1a
    invoke-virtual {v0}, Lcom/hcbiu/elcton/ElctonApplication;->getDiagnostics()Lcom/hcbiu/elcton/DiagnosticRuntime;

    #@1d
    move-result-object v0

    #@1e
    invoke-direct {p0, p1, v0}, Lcom/hcbiu/elcton/WearProbe;-><init>(Landroid/content/Context;Lcom/hcbiu/elcton/DiagnosticRuntime;)V

    #@21
    iput-object p2, p0, Lcom/hcbiu/elcton/WearProbe;->update:Lkotlin/jvm/functions/Function1;

    #@23
    iput-object p3, p0, Lcom/hcbiu/elcton/WearProbe;->importCandidate:Lkotlin/jvm/functions/Function2;

    #@25
    return-void
.end method

.method public static final synthetic access$getContext$p(Lcom/hcbiu/elcton/WearProbe;)Landroid/content/Context;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->context:Landroid/content/Context;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getDiagnostics$p(Lcom/hcbiu/elcton/WearProbe;)Lcom/hcbiu/elcton/DiagnosticRuntime;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->diagnostics:Lcom/hcbiu/elcton/DiagnosticRuntime;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getHandler$p(Lcom/hcbiu/elcton/WearProbe;)Landroid/os/Handler;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->handler:Landroid/os/Handler;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getImportCandidate$p(Lcom/hcbiu/elcton/WearProbe;)Lkotlin/jvm/functions/Function2;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->importCandidate:Lkotlin/jvm/functions/Function2;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getUpdate$p(Lcom/hcbiu/elcton/WearProbe;)Lkotlin/jvm/functions/Function1;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->update:Lkotlin/jvm/functions/Function1;

    #@2
    return-object v0
.end method

.method public static synthetic authorizeAndScan$default(Lcom/hcbiu/elcton/WearProbe;ZLandroid/app/Activity;ILjava/lang/Object;)Z
    .registers 5

    #@0
    and-int/lit8 p4, p3, 0x1

    #@2
    if-eqz p4, :cond_5

    #@4
    const/4 p1, 0x0

    #@5
    :cond_5
    and-int/lit8 p3, p3, 0x2

    #@7
    if-eqz p3, :cond_a

    #@9
    const/4 p2, 0x0

    #@a
    :cond_a
    invoke-virtual {p0, p1, p2}, Lcom/hcbiu/elcton/WearProbe;->authorizeAndScan(ZLandroid/app/Activity;)Z

    #@d
    move-result p0

    #@e
    return p0
.end method

.method private static final checkPermission$lambda$0(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V
    .registers 3

    #@0
    const-string v0, "$success"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const/4 v0, 0x1

    #@6
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    #@9
    move-result-object v0

    #@a
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@d
    move-result v0

    #@e
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    #@11
    move-result-object v0

    #@12
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@15
    return-void
.end method

.method private static final checkPermission$lambda$1(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 4

    #@0
    const-string v0, "$failure"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "this$0"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-static {p2}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@d
    const-string v0, "checkPermission"

    #@f
    invoke-direct {p1, p2, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@12
    move-result-object v0

    #@13
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@16
    return-void
.end method

.method private final describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;
    .registers 12

    #@0
    const-string v0, "ElctonWear"

    #@2
    invoke-virtual {p1}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@5
    move-result-object v8

    #@6
    nop

    #@7
    :try_start_7
    sget-object v1, Lcom/hcbiu/elcton/WearErrorRecord;->Companion:Lcom/hcbiu/elcton/WearErrorRecord$Companion;

    #@9
    move-object v2, p1

    #@a
    check-cast v2, Ljava/lang/Throwable;

    #@c
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    #@f
    move-result-wide v4

    #@10
    sget-object v3, Lcom/hcbiu/elcton/WearProbe$describe$record$1;->INSTANCE:Lcom/hcbiu/elcton/WearProbe$describe$record$1;

    #@12
    move-object v7, v3

    #@13
    check-cast v7, Lkotlin/jvm/functions/Function1;

    #@15
    move-object v3, p2

    #@16
    move-object v6, v8

    #@17
    invoke-virtual/range {v1 .. v7}, Lcom/hcbiu/elcton/WearErrorRecord$Companion;->captureWithMessage(Ljava/lang/Throwable;Ljava/lang/String;JLjava/lang/String;Lkotlin/jvm/functions/Function1;)Lcom/hcbiu/elcton/WearErrorRecord;

    #@1a
    move-result-object v1

    #@1b
    invoke-virtual {v1}, Lcom/hcbiu/elcton/WearErrorRecord;->getFull()Ljava/lang/String;

    #@1e
    move-result-object v2

    #@1f
    iput-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->latestDiagnostic:Ljava/lang/String;

    #@21
    invoke-static {v0, v2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I
    :try_end_24
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_24} :catch_3e

    #@24
    :try_start_24
    iget-object v3, p0, Lcom/hcbiu/elcton/WearProbe;->diagnostics:Lcom/hcbiu/elcton/DiagnosticRuntime;

    #@26
    invoke-virtual {v3, v1}, Lcom/hcbiu/elcton/DiagnosticRuntime;->record(Lcom/hcbiu/elcton/WearErrorRecord;)V
    :try_end_29
    .catch Ljava/lang/Exception; {:try_start_24 .. :try_end_29} :catch_2a

    #@29
    goto :goto_2b

    #@2a
    :catch_2a
    move-exception v3

    #@2b
    :goto_2b
    :try_start_2b
    iget-object v3, p0, Lcom/hcbiu/elcton/WearProbe;->sharedEngine:Lkotlin/Lazy;

    #@2d
    invoke-interface {v3}, Lkotlin/Lazy;->isInitialized()Z

    #@30
    move-result v3

    #@31
    if-eqz v3, :cond_5d

    #@33
    iget-object v3, p0, Lcom/hcbiu/elcton/WearProbe;->handler:Landroid/os/Handler;

    #@35
    new-instance v4, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda6;

    #@37
    invoke-direct {v4, p0, v2}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda6;-><init>(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/String;)V

    #@3a
    invoke-virtual {v3, v4}, Landroid/os/Handler;->post(Ljava/lang/Runnable;)Z
    :try_end_3d
    .catch Ljava/lang/Exception; {:try_start_2b .. :try_end_3d} :catch_3e

    #@3d
    goto :goto_5d

    #@3e
    :catch_3e
    move-exception v1

    #@3f
    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    #@42
    move-result-object v2

    #@43
    invoke-virtual {v2}, Ljava/lang/Class;->getSimpleName()Ljava/lang/String;

    #@46
    move-result-object v2

    #@47
    new-instance v3, Ljava/lang/StringBuilder;

    #@49
    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    #@4c
    const-string v4, "Diagnostic capture failed: "

    #@4e
    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@51
    move-result-object v3

    #@52
    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@55
    move-result-object v2

    #@56
    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@59
    move-result-object v2

    #@5a
    invoke-static {v0, v2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    #@5d
    :cond_5d
    :goto_5d
    sget-object v0, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@5f
    if-nez v8, :cond_64

    #@61
    const-string v1, ""

    #@63
    goto :goto_65

    #@64
    :cond_64
    move-object v1, v8

    #@65
    :goto_65
    invoke-virtual {v0, v1}, Lcom/hcbiu/elcton/UserFacingError;->explain(Ljava/lang/String;)Ljava/lang/String;

    #@68
    move-result-object v0

    #@69
    return-object v0
.end method

.method private static final describe$lambda$26(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/String;)V
    .registers 3

    #@0
    const-string v0, "this$0"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "$raw"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    :try_start_a
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@d
    move-result-object v0

    #@e
    invoke-virtual {v0, p1}, Lcom/hcbiu/elcton/SyncEngine;->updateDiagnostic(Ljava/lang/String;)V
    :try_end_11
    .catch Ljava/lang/Exception; {:try_start_a .. :try_end_11} :catch_12

    #@11
    goto :goto_13

    #@12
    :catch_12
    move-exception v0

    #@13
    :goto_13
    return-void
.end method

.method private final getP2p()Lcom/huawei/wearengine/p2p/P2pClient;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->p2p$delegate:Lkotlin/Lazy;

    #@2
    invoke-interface {v0}, Lkotlin/Lazy;->getValue()Ljava/lang/Object;

    #@5
    move-result-object v0

    #@6
    check-cast v0, Lcom/huawei/wearengine/p2p/P2pClient;

    #@8
    return-object v0
.end method

.method private final identify()V
    .registers 3

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/WearProbe;->getP2p()Lcom/huawei/wearengine/p2p/P2pClient;

    #@3
    move-result-object v0

    #@4
    iget-object v1, p0, Lcom/hcbiu/elcton/WearProbe;->watchPackage:Ljava/lang/String;

    #@6
    invoke-virtual {v0, v1}, Lcom/huawei/wearengine/p2p/P2pClient;->setPeerPkgName(Ljava/lang/String;)Lcom/huawei/wearengine/p2p/P2pClient;

    #@9
    move-result-object v0

    #@a
    iget-object v1, p0, Lcom/hcbiu/elcton/WearProbe;->watchFingerprint:Ljava/lang/String;

    #@c
    invoke-virtual {v0, v1}, Lcom/huawei/wearengine/p2p/P2pClient;->setPeerFingerPrint(Ljava/lang/String;)Lcom/huawei/wearengine/p2p/P2pClient;

    #@f
    return-void
.end method

.method private static final installed$lambda$8(Lkotlin/jvm/functions/Function1;Ljava/lang/Boolean;)V
    .registers 3

    #@0
    const-string v0, "$success"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const/4 v0, 0x1

    #@6
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    #@9
    move-result-object v0

    #@a
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@d
    move-result v0

    #@e
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    #@11
    move-result-object v0

    #@12
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@15
    return-void
.end method

.method private static final installed$lambda$9(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 4

    #@0
    const-string v0, "$failure"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "this$0"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-static {p2}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@d
    const-string v0, "isAppInstalled"

    #@f
    invoke-direct {p1, p2, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@12
    move-result-object v0

    #@13
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@16
    return-void
.end method

.method private final native(Lcom/hcbiu/elcton/SyncDevice;)Lcom/huawei/wearengine/device/Device;
    .registers 6

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@2
    monitor-enter v0

    #@3
    const/4 v1, 0x0

    #@4
    :try_start_4
    iget-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->devices:Ljava/util/Map;

    #@6
    invoke-virtual {p1}, Lcom/hcbiu/elcton/SyncDevice;->getId()Ljava/lang/String;

    #@9
    move-result-object v3

    #@a
    invoke-interface {v2, v3}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    #@d
    move-result-object v2

    #@e
    check-cast v2, Lcom/huawei/wearengine/device/Device;
    :try_end_10
    .catchall {:try_start_4 .. :try_end_10} :catchall_12

    #@10
    monitor-exit v0

    #@11
    return-object v2

    #@12
    :catchall_12
    move-exception v1

    #@13
    monitor-exit v0

    #@14
    throw v1
.end method

.method private static final register$lambda$13(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;JLcom/huawei/wearengine/p2p/Message;)V
    .registers 19

    #@0
    move-object v1, p0

    #@1
    move-object v2, p1

    #@2
    const-string v0, "this$0"

    #@4
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@7
    const-string v0, "$message"

    #@9
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@c
    iget-object v3, v1, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@e
    monitor-enter v3

    #@f
    const/4 v0, 0x0

    #@10
    :try_start_10
    iget-object v4, v1, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@12
    const/4 v5, 0x1

    #@13
    const/4 v6, 0x0

    #@14
    if-eqz v4, :cond_20

    #@16
    invoke-virtual {v4}, Lcom/hcbiu/elcton/WearProbe$NativeRegistration;->getGeneration()J

    #@19
    move-result-wide v7

    #@1a
    cmp-long v4, v7, p2

    #@1c
    if-nez v4, :cond_20

    #@1e
    move v4, v5

    #@1f
    goto :goto_21

    #@20
    :cond_20
    move v4, v6

    #@21
    :goto_21
    if-eqz v4, :cond_2b

    #@23
    iget-wide v7, v1, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J
    :try_end_25
    .catchall {:try_start_10 .. :try_end_25} :catchall_6a

    #@25
    cmp-long v4, v7, p2

    #@27
    if-nez v4, :cond_2b

    #@29
    move v0, v5

    #@2a
    goto :goto_2c

    #@2b
    :cond_2b
    move v0, v6

    #@2c
    :goto_2c
    monitor-exit v3

    #@2d
    if-eqz v0, :cond_69

    #@2f
    invoke-virtual/range {p4 .. p4}, Lcom/huawei/wearengine/p2p/Message;->getType()I

    #@32
    move-result v3

    #@33
    if-ne v3, v5, :cond_69

    #@35
    invoke-virtual/range {p4 .. p4}, Lcom/huawei/wearengine/p2p/Message;->getData()[B

    #@38
    move-result-object v3

    #@39
    if-eqz v3, :cond_69

    #@3b
    array-length v4, v3

    #@3c
    const/16 v7, 0x400

    #@3e
    if-gt v4, v7, :cond_69

    #@40
    move-object v4, v3

    #@41
    const/4 v7, 0x0

    #@42
    array-length v8, v4

    #@43
    move v9, v6

    #@44
    :goto_44
    if-ge v9, v8, :cond_5c

    #@46
    aget-byte v10, v4, v9

    #@48
    move v11, v10

    #@49
    const/4 v12, 0x0

    #@4a
    const/16 v13, 0x20

    #@4c
    if-gt v13, v11, :cond_54

    #@4e
    const/16 v13, 0x7f

    #@50
    if-ge v11, v13, :cond_54

    #@52
    move v11, v5

    #@53
    goto :goto_55

    #@54
    :cond_54
    move v11, v6

    #@55
    :goto_55
    if-nez v11, :cond_59

    #@57
    move v5, v6

    #@58
    goto :goto_5d

    #@59
    :cond_59
    add-int/lit8 v9, v9, 0x1

    #@5b
    goto :goto_44

    #@5c
    :cond_5c
    nop

    #@5d
    :goto_5d
    if-eqz v5, :cond_69

    #@5f
    new-instance v4, Ljava/lang/String;

    #@61
    sget-object v5, Lkotlin/text/Charsets;->US_ASCII:Ljava/nio/charset/Charset;

    #@63
    invoke-direct {v4, v3, v5}, Ljava/lang/String;-><init>([BLjava/nio/charset/Charset;)V

    #@66
    invoke-interface {p1, v4}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@69
    :cond_69
    return-void

    #@6a
    :catchall_6a
    move-exception v0

    #@6b
    monitor-exit v3

    #@6c
    throw v0
.end method

.method private static final register$lambda$16(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function0;Lcom/huawei/wearengine/p2p/Receiver;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Void;)V
    .registers 11

    #@0
    const-string v0, "this$0"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "$success"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    const-string v0, "$receiver"

    #@c
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@f
    const-string v0, "$item"

    #@11
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@14
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@16
    monitor-enter v0

    #@17
    const/4 v1, 0x0

    #@18
    :try_start_18
    iget-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@1a
    if-ne v2, p3, :cond_24

    #@1c
    iget-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J
    :try_end_1e
    .catchall {:try_start_18 .. :try_end_1e} :catchall_31

    #@1e
    cmp-long v2, p4, v2

    #@20
    if-nez v2, :cond_24

    #@22
    const/4 v2, 0x1

    #@23
    goto :goto_25

    #@24
    :cond_24
    const/4 v2, 0x0

    #@25
    :goto_25
    monitor-exit v0

    #@26
    move v0, v2

    #@27
    if-eqz v0, :cond_2d

    #@29
    invoke-interface {p1}, Lkotlin/jvm/functions/Function0;->invoke()Ljava/lang/Object;

    #@2c
    goto :goto_30

    #@2d
    :cond_2d
    invoke-direct {p0, p2}, Lcom/hcbiu/elcton/WearProbe;->release(Lcom/huawei/wearengine/p2p/Receiver;)V

    #@30
    :goto_30
    return-void

    #@31
    :catchall_31
    move-exception v1

    #@32
    monitor-exit v0

    #@33
    throw v1
.end method

.method private static final register$lambda$18(Lcom/hcbiu/elcton/WearProbe;Lcom/huawei/wearengine/p2p/Receiver;Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;JLjava/lang/Exception;)V
    .registers 11

    #@0
    const-string v0, "this$0"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "$receiver"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    const-string v0, "$failure"

    #@c
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@f
    const-string v0, "$item"

    #@11
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@14
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@16
    monitor-enter v0

    #@17
    const/4 v1, 0x0

    #@18
    :try_start_18
    iget-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@1a
    if-ne v2, p3, :cond_27

    #@1c
    iget-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J

    #@1e
    cmp-long v2, p4, v2

    #@20
    if-nez v2, :cond_27

    #@22
    const/4 v2, 0x0

    #@23
    iput-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;
    :try_end_25
    .catchall {:try_start_18 .. :try_end_25} :catchall_3c

    #@25
    const/4 v2, 0x1

    #@26
    goto :goto_28

    #@27
    :cond_27
    const/4 v2, 0x0

    #@28
    :goto_28
    monitor-exit v0

    #@29
    move v0, v2

    #@2a
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->release(Lcom/huawei/wearengine/p2p/Receiver;)V

    #@2d
    if-eqz v0, :cond_3b

    #@2f
    invoke-static {p6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@32
    const-string v1, "registerReceiver"

    #@34
    invoke-direct {p0, p6, v1}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@37
    move-result-object v1

    #@38
    invoke-interface {p2, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@3b
    :cond_3b
    return-void

    #@3c
    :catchall_3c
    move-exception v1

    #@3d
    monitor-exit v0

    #@3e
    throw v1
.end method

.method private final release(Lcom/huawei/wearengine/p2p/Receiver;)V
    .registers 4

    #@0
    :try_start_0
    invoke-direct {p0}, Lcom/hcbiu/elcton/WearProbe;->getP2p()Lcom/huawei/wearengine/p2p/P2pClient;

    #@3
    move-result-object v0

    #@4
    invoke-virtual {v0, p1}, Lcom/huawei/wearengine/p2p/P2pClient;->unregisterReceiver(Lcom/huawei/wearengine/p2p/Receiver;)Lcom/huawei/hmf/tasks/Task;

    #@7
    move-result-object v0

    #@8
    new-instance v1, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda3;

    #@a
    invoke-direct {v1, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda3;-><init>(Lcom/hcbiu/elcton/WearProbe;)V

    #@d
    invoke-virtual {v0, v1}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_10
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_10} :catch_11

    #@10
    goto :goto_17

    #@11
    :catch_11
    move-exception v0

    #@12
    const-string v1, "unregisterReceiver"

    #@14
    invoke-direct {p0, v0, v1}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@17
    :goto_17
    return-void
.end method

.method private static final release$lambda$23(Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 3

    #@0
    const-string v0, "this$0"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    invoke-static {p1}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@8
    const-string v0, "unregisterReceiver"

    #@a
    invoke-direct {p0, p1, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@d
    return-void
.end method

.method private static final requestPermission$lambda$2(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 4

    #@0
    const-string v0, "$failure"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "this$0"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-static {p2}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@d
    const-string v0, "requestPermission"

    #@f
    invoke-direct {p1, p2, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@12
    move-result-object v0

    #@13
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@16
    return-void
.end method

.method private static final scan$lambda$5(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;JLjava/util/List;)V
    .registers 22

    #@0
    move-object/from16 v1, p0

    #@2
    move-object/from16 v2, p1

    #@4
    move-object/from16 v3, p2

    #@6
    const-string v0, "this$0"

    #@8
    invoke-static {v1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@b
    const-string v0, "$success"

    #@d
    invoke-static {v2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@10
    const-string v0, "$failure"

    #@12
    invoke-static {v3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@15
    nop

    #@16
    :try_start_16
    new-instance v0, Ljava/util/LinkedHashMap;

    #@18
    invoke-direct {v0}, Ljava/util/LinkedHashMap;-><init>()V

    #@1b
    move-object v4, v0

    #@1c
    new-instance v0, Ljava/util/LinkedHashMap;

    #@1e
    invoke-direct {v0}, Ljava/util/LinkedHashMap;-><init>()V

    #@21
    move-object v5, v0

    #@22
    if-nez p5, :cond_29

    #@24
    invoke-static {}, Lkotlin/collections/CollectionsKt;->emptyList()Ljava/util/List;

    #@27
    move-result-object v0

    #@28
    goto :goto_2b

    #@29
    :cond_29
    move-object/from16 v0, p5

    #@2b
    :goto_2b
    invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    #@2e
    move-result-object v0

    #@2f
    :cond_2f
    :goto_2f
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    #@32
    move-result v6

    #@33
    const/4 v7, 0x1

    #@34
    const/4 v8, 0x0

    #@35
    if-eqz v6, :cond_83

    #@37
    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    #@3a
    move-result-object v6

    #@3b
    check-cast v6, Lcom/huawei/wearengine/device/Device;

    #@3d
    invoke-virtual {v6}, Lcom/huawei/wearengine/device/Device;->getUuid()Ljava/lang/String;

    #@40
    move-result-object v9

    #@41
    if-nez v9, :cond_45

    #@43
    const-string v9, ""

    #@45
    :cond_45
    move-object v10, v9

    #@46
    check-cast v10, Ljava/lang/CharSequence;

    #@48
    invoke-interface {v10}, Ljava/lang/CharSequence;->length()I

    #@4b
    move-result v10

    #@4c
    if-nez v10, :cond_4f

    #@4e
    goto :goto_50

    #@4f
    :cond_4f
    move v7, v8

    #@50
    :goto_50
    if-nez v7, :cond_2f

    #@52
    move-object v7, v4

    #@53
    check-cast v7, Ljava/util/Map;

    #@55
    invoke-static {v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@58
    invoke-interface {v7, v9, v6}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    #@5b
    move-object v7, v5

    #@5c
    check-cast v7, Ljava/util/Map;

    #@5e
    new-instance v8, Lcom/hcbiu/elcton/SyncDevice;

    #@60
    invoke-virtual {v6}, Lcom/huawei/wearengine/device/Device;->getName()Ljava/lang/String;

    #@63
    move-result-object v10

    #@64
    if-nez v10, :cond_68

    #@66
    const-string v10, ""

    #@68
    :cond_68
    move-object v12, v10

    #@69
    invoke-virtual {v6}, Lcom/huawei/wearengine/device/Device;->getModel()Ljava/lang/String;

    #@6c
    move-result-object v10

    #@6d
    if-nez v10, :cond_71

    #@6f
    const-string v10, ""

    #@71
    :cond_71
    move-object v13, v10

    #@72
    invoke-virtual {v6}, Lcom/huawei/wearengine/device/Device;->isConnected()Z

    #@75
    move-result v14

    #@76
    invoke-virtual {v6}, Lcom/huawei/wearengine/device/Device;->getP2pCapability()I

    #@79
    move-result v15

    #@7a
    move-object v10, v8

    #@7b
    move-object v11, v9

    #@7c
    invoke-direct/range {v10 .. v15}, Lcom/hcbiu/elcton/SyncDevice;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ZI)V

    #@7f
    invoke-interface {v7, v9, v8}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    #@82
    goto :goto_2f

    #@83
    :cond_83
    iget-object v6, v1, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@85
    monitor-enter v6
    :try_end_86
    .catch Ljava/lang/Exception; {:try_start_16 .. :try_end_86} :catch_b7

    #@86
    const/4 v0, 0x0

    #@87
    :try_start_87
    iget-wide v9, v1, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J

    #@89
    cmp-long v9, p3, v9

    #@8b
    if-eqz v9, :cond_8f

    #@8d
    move v7, v8

    #@8e
    goto :goto_9c

    #@8f
    :cond_8f
    iget-object v8, v1, Lcom/hcbiu/elcton/WearProbe;->devices:Ljava/util/Map;

    #@91
    invoke-interface {v8}, Ljava/util/Map;->clear()V

    #@94
    iget-object v8, v1, Lcom/hcbiu/elcton/WearProbe;->devices:Ljava/util/Map;

    #@96
    move-object v9, v4

    #@97
    check-cast v9, Ljava/util/Map;

    #@99
    invoke-interface {v8, v9}, Ljava/util/Map;->putAll(Ljava/util/Map;)V
    :try_end_9c
    .catchall {:try_start_87 .. :try_end_9c} :catchall_b4

    #@9c
    :goto_9c
    nop

    #@9d
    :try_start_9d
    monitor-exit v6

    #@9e
    move v0, v7

    #@9f
    if-eqz v0, :cond_c1

    #@a1
    invoke-virtual {v5}, Ljava/util/LinkedHashMap;->values()Ljava/util/Collection;

    #@a4
    move-result-object v6

    #@a5
    const-string v7, "<get-values>(...)"

    #@a7
    invoke-static {v6, v7}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@aa
    check-cast v6, Ljava/lang/Iterable;

    #@ac
    invoke-static {v6}, Lkotlin/collections/CollectionsKt;->toList(Ljava/lang/Iterable;)Ljava/util/List;

    #@af
    move-result-object v6

    #@b0
    invoke-interface {v2, v6}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@b3
    goto :goto_c1

    #@b4
    :catchall_b4
    move-exception v0

    #@b5
    monitor-exit v6

    #@b6
    throw v0
    :try_end_b7
    .catch Ljava/lang/Exception; {:try_start_9d .. :try_end_b7} :catch_b7

    #@b7
    :catch_b7
    move-exception v0

    #@b8
    const-string v4, "getCommonDevice"

    #@ba
    invoke-direct {v1, v0, v4}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@bd
    move-result-object v4

    #@be
    invoke-interface {v3, v4}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@c1
    :cond_c1
    :goto_c1
    return-void
.end method

.method private static final scan$lambda$6(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 4

    #@0
    const-string v0, "$failure"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "this$0"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-static {p2}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@d
    const-string v0, "getCommonDevice"

    #@f
    invoke-direct {p1, p2, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@12
    move-result-object v0

    #@13
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@16
    return-void
.end method

.method private static final send$lambda$25(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;Ljava/lang/Exception;)V
    .registers 4

    #@0
    const-string v0, "$failure"

    #@2
    invoke-static {p0, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "this$0"

    #@7
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-static {p2}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@d
    const-string v0, "p2p.send"

    #@f
    invoke-direct {p1, p2, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@12
    move-result-object v0

    #@13
    invoke-interface {p0, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@16
    return-void
.end method


# virtual methods
.method public final attach(Landroid/app/Activity;)V
    .registers 3

    #@0
    const-string v0, "activity"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    new-instance v0, Ljava/lang/ref/WeakReference;

    #@7
    invoke-direct {v0, p1}, Ljava/lang/ref/WeakReference;-><init>(Ljava/lang/Object;)V

    #@a
    iput-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->activity:Ljava/lang/ref/WeakReference;

    #@c
    return-void
.end method

.method public final authorizeAndScan(ZLandroid/app/Activity;)Z
    .registers 4

    #@0
    if-eqz p1, :cond_b

    #@2
    if-eqz p2, :cond_8

    #@4
    invoke-virtual {p0, p2}, Lcom/hcbiu/elcton/WearProbe;->attach(Landroid/app/Activity;)V

    #@7
    goto :goto_b

    #@8
    :cond_8
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->clearActivity()V

    #@b
    :cond_b
    :goto_b
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@e
    move-result-object v0

    #@f
    invoke-virtual {v0, p1}, Lcom/hcbiu/elcton/SyncEngine;->authorizeAndScan(Z)Z

    #@12
    move-result v0

    #@13
    return v0
.end method

.method public final cancel()V
    .registers 2

    #@0
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@3
    move-result-object v0

    #@4
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine;->cancel()V

    #@7
    return-void
.end method

.method public checkPermission(Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    .registers 5
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/Boolean;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    const-string v0, "success"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "failure"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    nop

    #@b
    :try_start_b
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->context:Landroid/content/Context;

    #@d
    invoke-static {v0}, Lcom/huawei/wearengine/HiWear;->getAuthClient(Landroid/content/Context;)Lcom/huawei/wearengine/auth/AuthClient;

    #@10
    move-result-object v0

    #@11
    sget-object v1, Lcom/huawei/wearengine/auth/Permission;->DEVICE_MANAGER:Lcom/huawei/wearengine/auth/Permission;

    #@13
    invoke-virtual {v0, v1}, Lcom/huawei/wearengine/auth/AuthClient;->checkPermission(Lcom/huawei/wearengine/auth/Permission;)Lcom/huawei/hmf/tasks/Task;

    #@16
    move-result-object v0

    #@17
    new-instance v1, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda9;

    #@19
    invoke-direct {v1, p1}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda9;-><init>(Lkotlin/jvm/functions/Function1;)V

    #@1c
    invoke-virtual {v0, v1}, Lcom/huawei/hmf/tasks/Task;->addOnSuccessListener(Lcom/huawei/hmf/tasks/OnSuccessListener;)Lcom/huawei/hmf/tasks/Task;

    #@1f
    move-result-object v0

    #@20
    new-instance v1, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda10;

    #@22
    invoke-direct {v1, p2, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda10;-><init>(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;)V

    #@25
    invoke-virtual {v0, v1}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_28
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_28} :catch_29

    #@28
    goto :goto_33

    #@29
    :catch_29
    move-exception v0

    #@2a
    const-string v1, "checkPermission"

    #@2c
    invoke-direct {p0, v0, v1}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@2f
    move-result-object v1

    #@30
    invoke-interface {p2, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@33
    :goto_33
    return-void
.end method

.method public final clearActivity()V
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->activity:Ljava/lang/ref/WeakReference;

    #@2
    invoke-virtual {v0}, Ljava/lang/ref/WeakReference;->clear()V

    #@5
    return-void
.end method

.method public final close()V
    .registers 2

    #@0
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@3
    move-result-object v0

    #@4
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine;->close()V

    #@7
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->clearActivity()V

    #@a
    return-void
.end method

.method public final connect(Lcom/hcbiu/elcton/SyncDevice;)Z
    .registers 4

    #@0
    const-string v0, "device"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@8
    move-result-object v0

    #@9
    invoke-virtual {p1}, Lcom/hcbiu/elcton/SyncDevice;->getId()Ljava/lang/String;

    #@c
    move-result-object v1

    #@d
    invoke-virtual {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->connect(Ljava/lang/String;)Z

    #@10
    move-result v0

    #@11
    return v0
.end method

.method public final connect(Ljava/lang/String;)Z
    .registers 3

    #@0
    const-string v0, "deviceId"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@8
    move-result-object v0

    #@9
    invoke-virtual {v0, p1}, Lcom/hcbiu/elcton/SyncEngine;->connect(Ljava/lang/String;)Z

    #@c
    move-result v0

    #@d
    return v0
.end method

.method public final detach(Landroid/app/Activity;)V
    .registers 3

    #@0
    const-string v0, "activity"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->activity:Ljava/lang/ref/WeakReference;

    #@7
    invoke-virtual {v0}, Ljava/lang/ref/WeakReference;->get()Ljava/lang/Object;

    #@a
    move-result-object v0

    #@b
    if-ne v0, p1, :cond_10

    #@d
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->clearActivity()V

    #@10
    :cond_10
    return-void
.end method

.method public final getEngine()Lcom/hcbiu/elcton/SyncEngine;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->sharedEngine:Lkotlin/Lazy;

    #@2
    invoke-interface {v0}, Lkotlin/Lazy;->getValue()Ljava/lang/Object;

    #@5
    move-result-object v0

    #@6
    check-cast v0, Lcom/hcbiu/elcton/SyncEngine;

    #@8
    return-object v0
.end method

.method public final getState()Lcom/hcbiu/elcton/SyncEngine$State;
    .registers 2

    #@0
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@3
    move-result-object v0

    #@4
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine;->getState()Lcom/hcbiu/elcton/SyncEngine$State;

    #@7
    move-result-object v0

    #@8
    return-object v0
.end method

.method public installed(Lcom/hcbiu/elcton/SyncDevice;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    .registers 7
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lcom/hcbiu/elcton/SyncDevice;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/Boolean;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    const-string v0, "device"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "success"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    const-string v0, "failure"

    #@c
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@f
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->native(Lcom/hcbiu/elcton/SyncDevice;)Lcom/huawei/wearengine/device/Device;

    #@12
    move-result-object v0

    #@13
    if-nez v0, :cond_1b

    #@15
    const-string v1, "\u8bbe\u5907\u5217\u8868\u5df2\u6539\u53d8\uff0c\u8bf7\u91cd\u65b0\u67e5\u8be2\u771f\u5b9e\u914d\u5bf9\u8bbe\u5907\u3002"

    #@17
    invoke-interface {p3, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@1a
    return-void

    #@1b
    :cond_1b
    nop

    #@1c
    :try_start_1c
    invoke-direct {p0}, Lcom/hcbiu/elcton/WearProbe;->identify()V

    #@1f
    invoke-direct {p0}, Lcom/hcbiu/elcton/WearProbe;->getP2p()Lcom/huawei/wearengine/p2p/P2pClient;

    #@22
    move-result-object v1

    #@23
    iget-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->watchPackage:Ljava/lang/String;

    #@25
    invoke-virtual {v1, v0, v2}, Lcom/huawei/wearengine/p2p/P2pClient;->isAppInstalled(Lcom/huawei/wearengine/device/Device;Ljava/lang/String;)Lcom/huawei/hmf/tasks/Task;

    #@28
    move-result-object v1

    #@29
    new-instance v2, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda7;

    #@2b
    invoke-direct {v2, p2}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda7;-><init>(Lkotlin/jvm/functions/Function1;)V

    #@2e
    invoke-virtual {v1, v2}, Lcom/huawei/hmf/tasks/Task;->addOnSuccessListener(Lcom/huawei/hmf/tasks/OnSuccessListener;)Lcom/huawei/hmf/tasks/Task;

    #@31
    move-result-object v1

    #@32
    new-instance v2, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda8;

    #@34
    invoke-direct {v2, p3, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda8;-><init>(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;)V

    #@37
    invoke-virtual {v1, v2}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_3a
    .catch Ljava/lang/Exception; {:try_start_1c .. :try_end_3a} :catch_3b

    #@3a
    goto :goto_45

    #@3b
    :catch_3b
    move-exception v1

    #@3c
    const-string v2, "isAppInstalled"

    #@3e
    invoke-direct {p0, v1, v2}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@41
    move-result-object v2

    #@42
    invoke-interface {p3, v2}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@45
    :goto_45
    return-void
.end method

.method public final publishSnapshot(Ljava/lang/String;ZLjava/lang/String;J)Z
    .registers 13

    #@0
    const-string v0, "text"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "datasetId"

    #@7
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@d
    move-result-object v1

    #@e
    move-object v2, p1

    #@f
    move v3, p2

    #@10
    move-object v4, p3

    #@11
    move-wide v5, p4

    #@12
    invoke-virtual/range {v1 .. v6}, Lcom/hcbiu/elcton/SyncEngine;->publishSnapshot(Ljava/lang/String;ZLjava/lang/String;J)Z

    #@15
    move-result v0

    #@16
    return v0
.end method

.method public register(Lcom/hcbiu/elcton/SyncDevice;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function0;Lkotlin/jvm/functions/Function1;)V
    .registers 23
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lcom/hcbiu/elcton/SyncDevice;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function0<",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    move-object/from16 v8, p0

    #@2
    move-object/from16 v9, p2

    #@4
    move-object/from16 v10, p4

    #@6
    const-string v0, "device"

    #@8
    move-object/from16 v11, p1

    #@a
    invoke-static {v11, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@d
    const-string v0, "message"

    #@f
    invoke-static {v9, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@12
    const-string v0, "success"

    #@14
    move-object/from16 v12, p3

    #@16
    invoke-static {v12, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@19
    const-string v0, "failure"

    #@1b
    invoke-static {v10, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@1e
    invoke-direct/range {p0 .. p1}, Lcom/hcbiu/elcton/WearProbe;->native(Lcom/hcbiu/elcton/SyncDevice;)Lcom/huawei/wearengine/device/Device;

    #@21
    move-result-object v13

    #@22
    if-nez v13, :cond_2a

    #@24
    const-string v0, "\u8bbe\u5907\u5217\u8868\u5df2\u6539\u53d8\uff0c\u8bf7\u91cd\u65b0\u67e5\u8be2\u771f\u5b9e\u914d\u5bf9\u8bbe\u5907\u3002"

    #@26
    invoke-interface {v10, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@29
    return-void

    #@2a
    :cond_2a
    invoke-virtual/range {p0 .. p0}, Lcom/hcbiu/elcton/WearProbe;->unregister()V

    #@2d
    iget-object v1, v8, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@2f
    monitor-enter v1

    #@30
    const/4 v0, 0x0

    #@31
    :try_start_31
    iget-wide v2, v8, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J
    :try_end_33
    .catchall {:try_start_31 .. :try_end_33} :catchall_bf

    #@33
    monitor-exit v1

    #@34
    move-wide v14, v2

    #@35
    new-instance v0, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda12;

    #@37
    invoke-direct {v0, v8, v9, v14, v15}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda12;-><init>(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;J)V

    #@3a
    move-object v6, v0

    #@3b
    new-instance v0, Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@3d
    invoke-direct {v0, v14, v15, v6}, Lcom/hcbiu/elcton/WearProbe$NativeRegistration;-><init>(JLcom/huawei/wearengine/p2p/Receiver;)V

    #@40
    move-object v7, v0

    #@41
    iget-object v1, v8, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@43
    monitor-enter v1

    #@44
    const/4 v0, 0x0

    #@45
    :try_start_45
    iput-object v7, v8, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@47
    sget-object v0, Lkotlin/Unit;->INSTANCE:Lkotlin/Unit;
    :try_end_49
    .catchall {:try_start_45 .. :try_end_49} :catchall_ba

    #@49
    monitor-exit v1

    #@4a
    nop

    #@4b
    :try_start_4b
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/WearProbe;->identify()V

    #@4e
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/WearProbe;->getP2p()Lcom/huawei/wearengine/p2p/P2pClient;

    #@51
    move-result-object v0

    #@52
    invoke-virtual {v0, v13, v6}, Lcom/huawei/wearengine/p2p/P2pClient;->registerReceiver(Lcom/huawei/wearengine/device/Device;Lcom/huawei/wearengine/p2p/Receiver;)Lcom/huawei/hmf/tasks/Task;

    #@55
    move-result-object v0

    #@56
    new-instance v5, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda1;
    :try_end_58
    .catch Ljava/lang/Exception; {:try_start_4b .. :try_end_58} :catch_85

    #@58
    move-object v1, v5

    #@59
    move-object/from16 v2, p0

    #@5b
    move-object/from16 v3, p3

    #@5d
    move-object v4, v6

    #@5e
    move-object v9, v5

    #@5f
    move-object v5, v7

    #@60
    move-object/from16 v16, v6

    #@62
    move-object/from16 v17, v7

    #@64
    move-wide v6, v14

    #@65
    :try_start_65
    invoke-direct/range {v1 .. v7}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda1;-><init>(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function0;Lcom/huawei/wearengine/p2p/Receiver;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;J)V

    #@68
    invoke-virtual {v0, v9}, Lcom/huawei/hmf/tasks/Task;->addOnSuccessListener(Lcom/huawei/hmf/tasks/OnSuccessListener;)Lcom/huawei/hmf/tasks/Task;

    #@6b
    move-result-object v0

    #@6c
    new-instance v9, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda2;

    #@6e
    move-object v1, v9

    #@6f
    move-object/from16 v2, p0

    #@71
    move-object/from16 v3, v16

    #@73
    move-object/from16 v4, p4

    #@75
    move-object/from16 v5, v17

    #@77
    move-wide v6, v14

    #@78
    invoke-direct/range {v1 .. v7}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda2;-><init>(Lcom/hcbiu/elcton/WearProbe;Lcom/huawei/wearengine/p2p/Receiver;Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe$NativeRegistration;J)V

    #@7b
    invoke-virtual {v0, v9}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_7e
    .catch Ljava/lang/Exception; {:try_start_65 .. :try_end_7e} :catch_83

    #@7e
    move-object/from16 v3, v16

    #@80
    move-object/from16 v4, v17

    #@82
    goto :goto_ae

    #@83
    :catch_83
    move-exception v0

    #@84
    goto :goto_8a

    #@85
    :catch_85
    move-exception v0

    #@86
    move-object/from16 v16, v6

    #@88
    move-object/from16 v17, v7

    #@8a
    :goto_8a
    move-object v1, v0

    #@8b
    iget-object v2, v8, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@8d
    monitor-enter v2

    #@8e
    const/4 v0, 0x0

    #@8f
    :try_start_8f
    iget-object v3, v8, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;
    :try_end_91
    .catchall {:try_start_8f .. :try_end_91} :catchall_b3

    #@91
    move-object/from16 v4, v17

    #@93
    if-ne v3, v4, :cond_9d

    #@95
    const/4 v3, 0x0

    #@96
    :try_start_96
    iput-object v3, v8, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;
    :try_end_98
    .catchall {:try_start_96 .. :try_end_98} :catchall_99

    #@98
    goto :goto_9d

    #@99
    :catchall_99
    move-exception v0

    #@9a
    move-object/from16 v3, v16

    #@9c
    goto :goto_b8

    #@9d
    :cond_9d
    :goto_9d
    :try_start_9d
    sget-object v0, Lkotlin/Unit;->INSTANCE:Lkotlin/Unit;
    :try_end_9f
    .catchall {:try_start_9d .. :try_end_9f} :catchall_af

    #@9f
    monitor-exit v2

    #@a0
    move-object/from16 v3, v16

    #@a2
    invoke-direct {v8, v3}, Lcom/hcbiu/elcton/WearProbe;->release(Lcom/huawei/wearengine/p2p/Receiver;)V

    #@a5
    const-string v0, "registerReceiver"

    #@a7
    invoke-direct {v8, v1, v0}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@aa
    move-result-object v0

    #@ab
    invoke-interface {v10, v0}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@ae
    :goto_ae
    return-void

    #@af
    :catchall_af
    move-exception v0

    #@b0
    move-object/from16 v3, v16

    #@b2
    goto :goto_b8

    #@b3
    :catchall_b3
    move-exception v0

    #@b4
    move-object/from16 v3, v16

    #@b6
    move-object/from16 v4, v17

    #@b8
    :goto_b8
    monitor-exit v2

    #@b9
    throw v0

    #@ba
    :catchall_ba
    move-exception v0

    #@bb
    move-object v3, v6

    #@bc
    move-object v4, v7

    #@bd
    monitor-exit v1

    #@be
    throw v0

    #@bf
    :catchall_bf
    move-exception v0

    #@c0
    move-object v2, v0

    #@c1
    monitor-exit v1

    #@c2
    throw v2
.end method

.method public final requestExport()Z
    .registers 2

    #@0
    invoke-virtual {p0}, Lcom/hcbiu/elcton/WearProbe;->getEngine()Lcom/hcbiu/elcton/SyncEngine;

    #@3
    move-result-object v0

    #@4
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine;->requestExport()Z

    #@7
    move-result v0

    #@8
    return v0
.end method

.method public requestPermission(Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)Z
    .registers 10
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/Boolean;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)Z"
        }
    .end annotation

    #@0
    const-string v0, "success"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "failure"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->activity:Ljava/lang/ref/WeakReference;

    #@c
    invoke-virtual {v0}, Ljava/lang/ref/WeakReference;->get()Ljava/lang/Object;

    #@f
    move-result-object v0

    #@10
    check-cast v0, Landroid/app/Activity;

    #@12
    const/4 v1, 0x0

    #@13
    if-nez v0, :cond_16

    #@15
    return v1

    #@16
    :cond_16
    invoke-virtual {v0}, Landroid/app/Activity;->isFinishing()Z

    #@19
    move-result v2

    #@1a
    if-nez v2, :cond_4e

    #@1c
    invoke-virtual {v0}, Landroid/app/Activity;->isDestroyed()Z

    #@1f
    move-result v2

    #@20
    if-eqz v2, :cond_23

    #@22
    goto :goto_4e

    #@23
    :cond_23
    nop

    #@24
    const/4 v2, 0x1

    #@25
    :try_start_25
    invoke-static {v0}, Lcom/huawei/wearengine/HiWear;->getAuthClient(Landroid/app/Activity;)Lcom/huawei/wearengine/auth/AuthClient;

    #@28
    move-result-object v3

    #@29
    new-instance v4, Lcom/hcbiu/elcton/WearProbe$requestPermission$1;

    #@2b
    invoke-direct {v4, p1}, Lcom/hcbiu/elcton/WearProbe$requestPermission$1;-><init>(Lkotlin/jvm/functions/Function1;)V

    #@2e
    check-cast v4, Lcom/huawei/wearengine/auth/AuthCallback;

    #@30
    new-array v5, v2, [Lcom/huawei/wearengine/auth/Permission;

    #@32
    sget-object v6, Lcom/huawei/wearengine/auth/Permission;->DEVICE_MANAGER:Lcom/huawei/wearengine/auth/Permission;

    #@34
    aput-object v6, v5, v1

    #@36
    invoke-virtual {v3, v4, v5}, Lcom/huawei/wearengine/auth/AuthClient;->requestPermission(Lcom/huawei/wearengine/auth/AuthCallback;[Lcom/huawei/wearengine/auth/Permission;)Lcom/huawei/hmf/tasks/Task;

    #@39
    move-result-object v1

    #@3a
    new-instance v3, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda0;

    #@3c
    invoke-direct {v3, p2, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda0;-><init>(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;)V

    #@3f
    invoke-virtual {v1, v3}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_42
    .catch Ljava/lang/Exception; {:try_start_25 .. :try_end_42} :catch_43

    #@42
    goto :goto_4d

    #@43
    :catch_43
    move-exception v1

    #@44
    const-string v3, "requestPermission"

    #@46
    invoke-direct {p0, v1, v3}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@49
    move-result-object v3

    #@4a
    invoke-interface {p2, v3}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@4d
    :goto_4d
    return v2

    #@4e
    :cond_4e
    :goto_4e
    return v1
.end method

.method public scan(Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    .registers 13
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/util/List<",
            "Lcom/hcbiu/elcton/SyncDevice;",
            ">;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    const-string v0, "success"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "failure"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@c
    monitor-enter v0

    #@d
    const/4 v1, 0x0

    #@e
    :try_start_e
    iget-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J

    #@10
    const-wide/16 v4, 0x1

    #@12
    add-long/2addr v2, v4

    #@13
    iput-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J

    #@15
    iget-wide v8, p0, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J
    :try_end_17
    .catchall {:try_start_e .. :try_end_17} :catchall_44

    #@17
    monitor-exit v0

    #@18
    nop

    #@19
    :try_start_19
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->context:Landroid/content/Context;

    #@1b
    invoke-static {v0}, Lcom/huawei/wearengine/HiWear;->getDeviceClient(Landroid/content/Context;)Lcom/huawei/wearengine/device/DeviceClient;

    #@1e
    move-result-object v0

    #@1f
    invoke-virtual {v0}, Lcom/huawei/wearengine/device/DeviceClient;->getCommonDevice()Lcom/huawei/hmf/tasks/Task;

    #@22
    move-result-object v0

    #@23
    new-instance v1, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda4;

    #@25
    move-object v4, v1

    #@26
    move-object v5, p0

    #@27
    move-object v6, p1

    #@28
    move-object v7, p2

    #@29
    invoke-direct/range {v4 .. v9}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda4;-><init>(Lcom/hcbiu/elcton/WearProbe;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;J)V

    #@2c
    invoke-virtual {v0, v1}, Lcom/huawei/hmf/tasks/Task;->addOnSuccessListener(Lcom/huawei/hmf/tasks/OnSuccessListener;)Lcom/huawei/hmf/tasks/Task;

    #@2f
    move-result-object v0

    #@30
    new-instance v1, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda5;

    #@32
    invoke-direct {v1, p2, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda5;-><init>(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;)V

    #@35
    invoke-virtual {v0, v1}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_38
    .catch Ljava/lang/Exception; {:try_start_19 .. :try_end_38} :catch_39

    #@38
    goto :goto_43

    #@39
    :catch_39
    move-exception v0

    #@3a
    const-string v1, "getCommonDevice"

    #@3c
    invoke-direct {p0, v0, v1}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@3f
    move-result-object v1

    #@40
    invoke-interface {p2, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@43
    :goto_43
    return-void

    #@44
    :catchall_44
    move-exception v1

    #@45
    monitor-exit v0

    #@46
    throw v1
.end method

.method public send(Lcom/hcbiu/elcton/SyncDevice;Ljava/lang/String;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    .registers 15
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lcom/hcbiu/elcton/SyncDevice;",
            "Ljava/lang/String;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/Integer;",
            "Lkotlin/Unit;",
            ">;",
            "Lkotlin/jvm/functions/Function1<",
            "-",
            "Ljava/lang/String;",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    const-string v0, "device"

    #@2
    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@5
    const-string v0, "text"

    #@7
    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@a
    const-string v0, "result"

    #@c
    invoke-static {p3, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@f
    const-string v0, "failure"

    #@11
    invoke-static {p4, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@14
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/WearProbe;->native(Lcom/hcbiu/elcton/SyncDevice;)Lcom/huawei/wearengine/device/Device;

    #@17
    move-result-object v0

    #@18
    if-nez v0, :cond_20

    #@1a
    const-string v1, "\u8bbe\u5907\u5217\u8868\u5df2\u6539\u53d8\uff0c\u8bf7\u91cd\u65b0\u67e5\u8be2\u771f\u5b9e\u914d\u5bf9\u8bbe\u5907\u3002"

    #@1c
    invoke-interface {p4, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@1f
    return-void

    #@20
    :cond_20
    invoke-virtual {p2}, Ljava/lang/String;->length()I

    #@23
    move-result v1

    #@24
    const/16 v2, 0x400

    #@26
    if-gt v1, v2, :cond_8f

    #@28
    move-object v1, p2

    #@29
    check-cast v1, Ljava/lang/CharSequence;

    #@2b
    const/4 v2, 0x0

    #@2c
    const/4 v3, 0x0

    #@2d
    move v4, v3

    #@2e
    :goto_2e
    invoke-interface {v1}, Ljava/lang/CharSequence;->length()I

    #@31
    move-result v5

    #@32
    if-ge v4, v5, :cond_4f

    #@34
    invoke-interface {v1, v4}, Ljava/lang/CharSequence;->charAt(I)C

    #@37
    move-result v5

    #@38
    move v6, v5

    #@39
    const/4 v7, 0x0

    #@3a
    const/16 v8, 0x20

    #@3c
    const/4 v9, 0x1

    #@3d
    if-gt v8, v6, :cond_45

    #@3f
    const/16 v8, 0x7f

    #@41
    if-ge v6, v8, :cond_45

    #@43
    move v8, v9

    #@44
    goto :goto_46

    #@45
    :cond_45
    move v8, v3

    #@46
    :goto_46
    xor-int/lit8 v6, v8, 0x1

    #@48
    if-eqz v6, :cond_4c

    #@4a
    move v3, v9

    #@4b
    goto :goto_50

    #@4c
    :cond_4c
    add-int/lit8 v4, v4, 0x1

    #@4e
    goto :goto_2e

    #@4f
    :cond_4f
    nop

    #@50
    :goto_50
    if-eqz v3, :cond_53

    #@52
    goto :goto_8f

    #@53
    :cond_53
    nop

    #@54
    :try_start_54
    invoke-direct {p0}, Lcom/hcbiu/elcton/WearProbe;->getP2p()Lcom/huawei/wearengine/p2p/P2pClient;

    #@57
    move-result-object v1

    #@58
    new-instance v2, Lcom/huawei/wearengine/p2p/Message$Builder;

    #@5a
    invoke-direct {v2}, Lcom/huawei/wearengine/p2p/Message$Builder;-><init>()V

    #@5d
    sget-object v3, Lkotlin/text/Charsets;->US_ASCII:Ljava/nio/charset/Charset;

    #@5f
    invoke-virtual {p2, v3}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    #@62
    move-result-object v3

    #@63
    const-string v4, "getBytes(...)"

    #@65
    invoke-static {v3, v4}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@68
    invoke-virtual {v2, v3}, Lcom/huawei/wearengine/p2p/Message$Builder;->setPayload([B)Lcom/huawei/wearengine/p2p/Message$Builder;

    #@6b
    move-result-object v2

    #@6c
    invoke-virtual {v2}, Lcom/huawei/wearengine/p2p/Message$Builder;->build()Lcom/huawei/wearengine/p2p/Message;

    #@6f
    move-result-object v2

    #@70
    new-instance v3, Lcom/hcbiu/elcton/WearProbe$send$2;

    #@72
    invoke-direct {v3, p3}, Lcom/hcbiu/elcton/WearProbe$send$2;-><init>(Lkotlin/jvm/functions/Function1;)V

    #@75
    check-cast v3, Lcom/huawei/wearengine/p2p/SendCallback;

    #@77
    invoke-virtual {v1, v0, v2, v3}, Lcom/huawei/wearengine/p2p/P2pClient;->send(Lcom/huawei/wearengine/device/Device;Lcom/huawei/wearengine/p2p/Message;Lcom/huawei/wearengine/p2p/SendCallback;)Lcom/huawei/hmf/tasks/Task;

    #@7a
    move-result-object v1

    #@7b
    new-instance v2, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda11;

    #@7d
    invoke-direct {v2, p4, p0}, Lcom/hcbiu/elcton/WearProbe$$ExternalSyntheticLambda11;-><init>(Lkotlin/jvm/functions/Function1;Lcom/hcbiu/elcton/WearProbe;)V

    #@80
    invoke-virtual {v1, v2}, Lcom/huawei/hmf/tasks/Task;->addOnFailureListener(Lcom/huawei/hmf/tasks/OnFailureListener;)Lcom/huawei/hmf/tasks/Task;
    :try_end_83
    .catch Ljava/lang/Exception; {:try_start_54 .. :try_end_83} :catch_84

    #@83
    goto :goto_8e

    #@84
    :catch_84
    move-exception v1

    #@85
    const-string v2, "p2p.send"

    #@87
    invoke-direct {p0, v1, v2}, Lcom/hcbiu/elcton/WearProbe;->describe(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    #@8a
    move-result-object v2

    #@8b
    invoke-interface {p4, v2}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@8e
    :goto_8e
    return-void

    #@8f
    :cond_8f
    :goto_8f
    const-string v1, "\u6d88\u606f\u8d85\u51fa\u4f20\u8f93\u4e0a\u9650\uff0c\u672a\u53d1\u9001\u3002"

    #@91
    invoke-interface {p4, v1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@94
    return-void
.end method

.method public unregister()V
    .registers 7

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/WearProbe;->lock:Ljava/lang/Object;

    #@2
    monitor-enter v0

    #@3
    const/4 v1, 0x0

    #@4
    :try_start_4
    iget-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J

    #@6
    const-wide/16 v4, 0x1

    #@8
    add-long/2addr v2, v4

    #@9
    iput-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->nativeGeneration:J

    #@b
    iget-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J

    #@d
    add-long/2addr v2, v4

    #@e
    iput-wide v2, p0, Lcom/hcbiu/elcton/WearProbe;->scanGeneration:J

    #@10
    iget-object v2, p0, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;

    #@12
    move-object v3, v2

    #@13
    const/4 v4, 0x0

    #@14
    const/4 v5, 0x0

    #@15
    iput-object v5, p0, Lcom/hcbiu/elcton/WearProbe;->registration:Lcom/hcbiu/elcton/WearProbe$NativeRegistration;
    :try_end_17
    .catchall {:try_start_4 .. :try_end_17} :catchall_25

    #@17
    monitor-exit v0

    #@18
    move-object v0, v2

    #@19
    if-eqz v0, :cond_24

    #@1b
    move-object v1, v0

    #@1c
    const/4 v2, 0x0

    #@1d
    invoke-virtual {v1}, Lcom/hcbiu/elcton/WearProbe$NativeRegistration;->getReceiver()Lcom/huawei/wearengine/p2p/Receiver;

    #@20
    move-result-object v3

    #@21
    invoke-direct {p0, v3}, Lcom/hcbiu/elcton/WearProbe;->release(Lcom/huawei/wearengine/p2p/Receiver;)V

    #@24
    :cond_24
    return-void

    #@25
    :catchall_25
    move-exception v1

    #@26
    monitor-exit v0

    #@27
    throw v1
.end method
