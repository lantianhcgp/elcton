.class public final Lcom/hcbiu/elcton/SyncEngine;
.super Ljava/lang/Object;
.source "SyncEngine.kt"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/hcbiu/elcton/SyncEngine$State;
    }
.end annotation

.annotation system Ldalvik/annotation/SourceDebugExtension;
    value = "SMAP\nSyncEngine.kt\nKotlin\n*S Kotlin\n*F\n+ 1 SyncEngine.kt\ncom/hcbiu/elcton/SyncEngine\n+ 2 _Collections.kt\nkotlin/collections/CollectionsKt___CollectionsKt\n+ 3 fake.kt\nkotlin/jvm/internal/FakeKt\n+ 4 _Strings.kt\nkotlin/text/StringsKt___StringsKt\n*L\n1#1,358:1\n288#2,2:359\n1#3:361\n1083#4,2:362\n*S KotlinDebug\n*F\n+ 1 SyncEngine.kt\ncom/hcbiu/elcton/SyncEngine\n*L\n164#1:359,2\n343#1:362,2\n*E\n"
.end annotation

.annotation runtime Lkotlin/Metadata;
    d1 = {
        "\u0000|\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\u0010\t\n\u0002\u0008\u0002\n\u0002\u0010\u000b\n\u0002\u0008\u0002\n\u0002\u0010\u0008\n\u0000\n\u0002\u0018\u0002\n\u0002\u0008\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0008\u0005\n\u0002\u0018\u0002\n\u0002\u0008\u0002\n\u0002\u0018\u0002\n\u0002\u0008\u000e\n\u0002\u0018\u0002\n\u0002\u0008\u001a\u0008\u0007\u0018\u00002\u00020\u0001:\u0001PBK\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0012\u0010\u0008\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u000b0\t\u0012\u0018\u0010\u000c\u001a\u0014\u0012\u0004\u0012\u00020\u000e\u0012\u0004\u0012\u00020\u000f\u0012\u0004\u0012\u00020\u000b0\r\u00a2\u0006\u0002\u0010\u0010J\u0010\u0010+\u001a\u00020\u00122\u0008\u0008\u0002\u0010,\u001a\u00020\u0012J\u0010\u0010-\u001a\u00020\u000b2\u0006\u0010.\u001a\u00020\u000eH\u0002J\u0006\u0010/\u001a\u00020\u000bJ\u0008\u00100\u001a\u00020\u000bH\u0002J\u0006\u00101\u001a\u00020\u000bJ\u000e\u00102\u001a\u00020\u00122\u0006\u00103\u001a\u00020\u000eJ\u001e\u00104\u001a\u00020\u000b2\u0006\u00105\u001a\u00020\u000f2\u000c\u00106\u001a\u0008\u0012\u0004\u0012\u00020\u000b07H\u0002J\u0010\u00108\u001a\u00020\u000b2\u0006\u0010.\u001a\u00020\u000eH\u0002J\u0008\u00109\u001a\u00020\u000bH\u0002J\u0008\u0010:\u001a\u00020\u000bH\u0002J\u001e\u0010;\u001a\u00020\u000b2\u0006\u0010<\u001a\u00020\u00152\u000c\u00106\u001a\u0008\u0012\u0004\u0012\u00020\u000b07H\u0002J\u0010\u0010=\u001a\u00020\u000b2\u0006\u0010>\u001a\u00020\u000eH\u0002J\u0008\u0010?\u001a\u00020\u000bH\u0002J\u0010\u0010@\u001a\u00020\u000b2\u0006\u0010A\u001a\u00020\nH\u0002J&\u0010B\u001a\u00020\u00122\u0006\u0010C\u001a\u00020\u000e2\u0006\u0010D\u001a\u00020\u00122\u0006\u0010E\u001a\u00020\u000e2\u0006\u0010F\u001a\u00020\u000fJ\u0006\u0010G\u001a\u00020\u0012J\u0008\u0010H\u001a\u00020\u000bH\u0002J\u0010\u0010I\u001a\u00020\u000b2\u0006\u0010<\u001a\u00020\u0015H\u0002J\u001a\u0010J\u001a\u00020\u000b2\u0006\u0010C\u001a\u00020\u000e2\u0008\u0008\u0002\u0010K\u001a\u00020\u0012H\u0002J\u0008\u0010L\u001a\u00020\u000bH\u0002J\u0008\u0010M\u001a\u00020\u000bH\u0002J\u000e\u0010N\u001a\u00020\u000b2\u0006\u0010O\u001a\u00020\u000eR\u000e\u0010\u0011\u001a\u00020\u0012X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0013\u001a\u00020\u0012X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0014\u001a\u00020\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0016\u001a\u0004\u0018\u00010\u0017X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0018\u001a\u00020\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0019\u001a\u00020\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R \u0010\u000c\u001a\u0014\u0012\u0004\u0012\u00020\u000e\u0012\u0004\u0012\u00020\u000f\u0012\u0004\u0012\u00020\u000b0\rX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u001a\u001a\u0004\u0018\u00010\u001bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001c\u001a\u00020\u001dX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u001e\u001a\u0004\u0018\u00010\u001fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001e\u0010!\u001a\u00020\n2\u0006\u0010 \u001a\u00020\n@BX\u0086\u000e\u00a2\u0006\u0008\n\u0000\u001a\u0004\u0008\"\u0010#R\u0010\u0010$\u001a\u0004\u0018\u00010%X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010&\u001a\u00020\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\'\u001a\u00020(X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010)\u001a\u00020\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010*\u001a\u0004\u0018\u00010%X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\u0008\u001a\u000e\u0012\u0004\u0012\u00020\n\u0012\u0004\u0012\u00020\u000b0\tX\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006Q"
    }
    d2 = {
        "Lcom/hcbiu/elcton/SyncEngine;",
        "",
        "transport",
        "Lcom/hcbiu/elcton/SyncTransport;",
        "scheduler",
        "Lcom/hcbiu/elcton/SyncScheduler;",
        "baselines",
        "Lcom/hcbiu/elcton/SyncBaselines;",
        "update",
        "Lkotlin/Function1;",
        "Lcom/hcbiu/elcton/SyncEngine$State;",
        "",
        "importCandidate",
        "Lkotlin/Function2;",
        "",
        "",
        "(Lcom/hcbiu/elcton/SyncTransport;Lcom/hcbiu/elcton/SyncScheduler;Lcom/hcbiu/elcton/SyncBaselines;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function2;)V",
        "awaitingReady",
        "",
        "closed",
        "exportRetries",
        "",
        "exporting",
        "Lcom/hcbiu/elcton/ExportSession;",
        "generation",
        "handshakeAttempts",
        "peer",
        "Lcom/hcbiu/elcton/SyncDevice;",
        "sendAttempts",
        "Lcom/hcbiu/elcton/SendAttempts;",
        "session",
        "Lcom/hcbiu/elcton/TransferSession;",
        "<set-?>",
        "state",
        "getState",
        "()Lcom/hcbiu/elcton/SyncEngine$State;",
        "timer",
        "Lcom/hcbiu/elcton/SyncCancellation;",
        "timerSerial",
        "total",
        "Lcom/hcbiu/elcton/OperationDeadline;",
        "totalSerial",
        "totalTimer",
        "authorizeAndScan",
        "interactive",
        "beginTotal",
        "message",
        "cancel",
        "cancelTimer",
        "close",
        "connect",
        "deviceId",
        "deadline",
        "ms",
        "block",
        "Lkotlin/Function0;",
        "fail",
        "finishTotal",
        "hello",
        "main",
        "gen",
        "onMessage",
        "raw",
        "permissionRequired",
        "publish",
        "next",
        "publishSnapshot",
        "text",
        "force",
        "datasetId",
        "revision",
        "requestExport",
        "requestExportPacket",
        "scan",
        "send",
        "reportFailure",
        "transmitCurrent",
        "unregister",
        "updateDiagnostic",
        "full",
        "State",
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
.field private awaitingReady:Z

.field private final baselines:Lcom/hcbiu/elcton/SyncBaselines;

.field private closed:Z

.field private exportRetries:I

.field private exporting:Lcom/hcbiu/elcton/ExportSession;

.field private generation:I

.field private handshakeAttempts:I

.field private final importCandidate:Lkotlin/jvm/functions/Function2;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lkotlin/jvm/functions/Function2<",
            "Ljava/lang/String;",
            "Ljava/lang/Long;",
            "Lkotlin/Unit;",
            ">;"
        }
    .end annotation
.end field

.field private peer:Lcom/hcbiu/elcton/SyncDevice;

.field private final scheduler:Lcom/hcbiu/elcton/SyncScheduler;

.field private final sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

.field private session:Lcom/hcbiu/elcton/TransferSession;

.field private state:Lcom/hcbiu/elcton/SyncEngine$State;

.field private timer:Lcom/hcbiu/elcton/SyncCancellation;

.field private timerSerial:J

.field private final total:Lcom/hcbiu/elcton/OperationDeadline;

.field private totalSerial:J

.field private totalTimer:Lcom/hcbiu/elcton/SyncCancellation;

.field private final transport:Lcom/hcbiu/elcton/SyncTransport;

.field private final update:Lkotlin/jvm/functions/Function1;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Lkotlin/jvm/functions/Function1<",
            "Lcom/hcbiu/elcton/SyncEngine$State;",
            "Lkotlin/Unit;",
            ">;"
        }
    .end annotation
.end field


# direct methods
.method static constructor <clinit>()V
    .registers 1

    #@0
    const/16 v0, 0x8

    #@2
    sput v0, Lcom/hcbiu/elcton/SyncEngine;->$stable:I

    #@4
    return-void
.end method

.method public constructor <init>(Lcom/hcbiu/elcton/SyncTransport;Lcom/hcbiu/elcton/SyncScheduler;Lcom/hcbiu/elcton/SyncBaselines;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function2;)V
    .registers 33
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lcom/hcbiu/elcton/SyncTransport;",
            "Lcom/hcbiu/elcton/SyncScheduler;",
            "Lcom/hcbiu/elcton/SyncBaselines;",
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
    move-object/from16 v0, p0

    #@2
    move-object/from16 v1, p1

    #@4
    move-object/from16 v2, p2

    #@6
    move-object/from16 v3, p3

    #@8
    move-object/from16 v4, p4

    #@a
    move-object/from16 v5, p5

    #@c
    const-string v6, "transport"

    #@e
    invoke-static {v1, v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@11
    const-string v6, "scheduler"

    #@13
    invoke-static {v2, v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@16
    const-string v6, "baselines"

    #@18
    invoke-static {v3, v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@1b
    const-string v6, "update"

    #@1d
    invoke-static {v4, v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@20
    const-string v6, "importCandidate"

    #@22
    invoke-static {v5, v6}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@25
    invoke-direct/range {p0 .. p0}, Ljava/lang/Object;-><init>()V

    #@28
    iput-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@2a
    iput-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@2c
    iput-object v3, v0, Lcom/hcbiu/elcton/SyncEngine;->baselines:Lcom/hcbiu/elcton/SyncBaselines;

    #@2e
    iput-object v4, v0, Lcom/hcbiu/elcton/SyncEngine;->update:Lkotlin/jvm/functions/Function1;

    #@30
    iput-object v5, v0, Lcom/hcbiu/elcton/SyncEngine;->importCandidate:Lkotlin/jvm/functions/Function2;

    #@32
    new-instance v6, Lcom/hcbiu/elcton/SyncEngine$State;

    #@34
    move-object v7, v6

    #@35
    const/16 v25, 0x7fff

    #@37
    const/16 v26, 0x0

    #@39
    const/4 v8, 0x0

    #@3a
    const/4 v9, 0x0

    #@3b
    const/4 v10, 0x0

    #@3c
    const/4 v11, 0x0

    #@3d
    const/4 v12, 0x0

    #@3e
    const/4 v13, 0x0

    #@3f
    const/4 v14, 0x0

    #@40
    const/4 v15, 0x0

    #@41
    const-wide/16 v16, 0x0

    #@43
    const/16 v18, 0x0

    #@45
    const/16 v19, 0x0

    #@47
    const/16 v20, 0x0

    #@49
    const/16 v21, 0x0

    #@4b
    const-wide/16 v22, 0x0

    #@4d
    const/16 v24, 0x0

    #@4f
    invoke-direct/range {v7 .. v26}, Lcom/hcbiu/elcton/SyncEngine$State;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILkotlin/jvm/internal/DefaultConstructorMarker;)V

    #@52
    iput-object v6, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@54
    new-instance v6, Lcom/hcbiu/elcton/SendAttempts;

    #@56
    invoke-direct {v6}, Lcom/hcbiu/elcton/SendAttempts;-><init>()V

    #@59
    iput-object v6, v0, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@5b
    new-instance v6, Lcom/hcbiu/elcton/OperationDeadline;

    #@5d
    invoke-direct {v6}, Lcom/hcbiu/elcton/OperationDeadline;-><init>()V

    #@60
    iput-object v6, v0, Lcom/hcbiu/elcton/SyncEngine;->total:Lcom/hcbiu/elcton/OperationDeadline;

    #@62
    return-void
.end method

.method public static final synthetic access$cancelTimer(Lcom/hcbiu/elcton/SyncEngine;)V
    .registers 1

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@3
    return-void
.end method

.method public static final synthetic access$deadline(Lcom/hcbiu/elcton/SyncEngine;JLkotlin/jvm/functions/Function0;)V
    .registers 4

    #@0
    invoke-direct {p0, p1, p2, p3}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@3
    return-void
.end method

.method public static final synthetic access$fail(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;)V
    .registers 2

    #@0
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@3
    return-void
.end method

.method public static final synthetic access$getClosed$p(Lcom/hcbiu/elcton/SyncEngine;)Z
    .registers 2

    #@0
    iget-boolean v0, p0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@2
    return v0
.end method

.method public static final synthetic access$getExportRetries$p(Lcom/hcbiu/elcton/SyncEngine;)I
    .registers 2

    #@0
    iget v0, p0, Lcom/hcbiu/elcton/SyncEngine;->exportRetries:I

    #@2
    return v0
.end method

.method public static final synthetic access$getExporting$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/ExportSession;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getGeneration$p(Lcom/hcbiu/elcton/SyncEngine;)I
    .registers 2

    #@0
    iget v0, p0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@2
    return v0
.end method

.method public static final synthetic access$getHandshakeAttempts$p(Lcom/hcbiu/elcton/SyncEngine;)I
    .registers 2

    #@0
    iget v0, p0, Lcom/hcbiu/elcton/SyncEngine;->handshakeAttempts:I

    #@2
    return v0
.end method

.method public static final synthetic access$getPeer$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/SyncDevice;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getScheduler$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/SyncScheduler;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getSession$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/TransferSession;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getTimerSerial$p(Lcom/hcbiu/elcton/SyncEngine;)J
    .registers 3

    #@0
    iget-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timerSerial:J

    #@2
    return-wide v0
.end method

.method public static final synthetic access$getTotal$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/OperationDeadline;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->total:Lcom/hcbiu/elcton/OperationDeadline;

    #@2
    return-object v0
.end method

.method public static final synthetic access$getTotalSerial$p(Lcom/hcbiu/elcton/SyncEngine;)J
    .registers 3

    #@0
    iget-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->totalSerial:J

    #@2
    return-wide v0
.end method

.method public static final synthetic access$getTransport$p(Lcom/hcbiu/elcton/SyncEngine;)Lcom/hcbiu/elcton/SyncTransport;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@2
    return-object v0
.end method

.method public static final synthetic access$hello(Lcom/hcbiu/elcton/SyncEngine;)V
    .registers 1

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->hello()V

    #@3
    return-void
.end method

.method public static final synthetic access$main(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/functions/Function0;)V
    .registers 3

    #@0
    invoke-direct {p0, p1, p2}, Lcom/hcbiu/elcton/SyncEngine;->main(ILkotlin/jvm/functions/Function0;)V

    #@3
    return-void
.end method

.method public static final synthetic access$onMessage(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;)V
    .registers 2

    #@0
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/SyncEngine;->onMessage(Ljava/lang/String;)V

    #@3
    return-void
.end method

.method public static final synthetic access$permissionRequired(Lcom/hcbiu/elcton/SyncEngine;)V
    .registers 1

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->permissionRequired()V

    #@3
    return-void
.end method

.method public static final synthetic access$publish(Lcom/hcbiu/elcton/SyncEngine;Lcom/hcbiu/elcton/SyncEngine$State;)V
    .registers 2

    #@0
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@3
    return-void
.end method

.method public static final synthetic access$requestExportPacket(Lcom/hcbiu/elcton/SyncEngine;)V
    .registers 1

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->requestExportPacket()V

    #@3
    return-void
.end method

.method public static final synthetic access$scan(Lcom/hcbiu/elcton/SyncEngine;I)V
    .registers 2

    #@0
    invoke-direct {p0, p1}, Lcom/hcbiu/elcton/SyncEngine;->scan(I)V

    #@3
    return-void
.end method

.method public static final synthetic access$send$accepts(ILcom/hcbiu/elcton/SyncEngine;J)Z
    .registers 5

    #@0
    invoke-static {p0, p1, p2, p3}, Lcom/hcbiu/elcton/SyncEngine;->send$accepts(ILcom/hcbiu/elcton/SyncEngine;J)Z

    #@3
    move-result v0

    #@4
    return v0
.end method

.method public static final synthetic access$setAwaitingReady$p(Lcom/hcbiu/elcton/SyncEngine;Z)V
    .registers 2

    #@0
    iput-boolean p1, p0, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@2
    return-void
.end method

.method public static final synthetic access$setExportRetries$p(Lcom/hcbiu/elcton/SyncEngine;I)V
    .registers 2

    #@0
    iput p1, p0, Lcom/hcbiu/elcton/SyncEngine;->exportRetries:I

    #@2
    return-void
.end method

.method public static final synthetic access$setHandshakeAttempts$p(Lcom/hcbiu/elcton/SyncEngine;I)V
    .registers 2

    #@0
    iput p1, p0, Lcom/hcbiu/elcton/SyncEngine;->handshakeAttempts:I

    #@2
    return-void
.end method

.method public static final synthetic access$setPeer$p(Lcom/hcbiu/elcton/SyncEngine;Lcom/hcbiu/elcton/SyncDevice;)V
    .registers 2

    #@0
    iput-object p1, p0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@2
    return-void
.end method

.method public static final synthetic access$transmitCurrent(Lcom/hcbiu/elcton/SyncEngine;)V
    .registers 1

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->transmitCurrent()V

    #@3
    return-void
.end method

.method public static synthetic authorizeAndScan$default(Lcom/hcbiu/elcton/SyncEngine;ZILjava/lang/Object;)Z
    .registers 4

    #@0
    and-int/lit8 p2, p2, 0x1

    #@2
    if-eqz p2, :cond_5

    #@4
    const/4 p1, 0x0

    #@5
    :cond_5
    invoke-virtual {p0, p1}, Lcom/hcbiu/elcton/SyncEngine;->authorizeAndScan(Z)Z

    #@8
    move-result p0

    #@9
    return p0
.end method

.method private final beginTotal(Ljava/lang/String;)V
    .registers 15

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@3
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->total:Lcom/hcbiu/elcton/OperationDeadline;

    #@5
    iget-object v1, p0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@7
    invoke-interface {v1}, Lcom/hcbiu/elcton/SyncScheduler;->now()J

    #@a
    move-result-wide v1

    #@b
    const-wide/32 v3, 0xafc8

    #@e
    invoke-virtual {v0, v1, v2, v3, v4}, Lcom/hcbiu/elcton/OperationDeadline;->begin(JJ)V

    #@11
    iget v0, p0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@13
    iget-wide v1, p0, Lcom/hcbiu/elcton/SyncEngine;->totalSerial:J

    #@15
    iget-object v11, p0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@17
    new-instance v12, Lcom/hcbiu/elcton/SyncEngine$beginTotal$1;

    #@19
    move-object v5, v12

    #@1a
    move-object v6, p0

    #@1b
    move v7, v0

    #@1c
    move-wide v8, v1

    #@1d
    move-object v10, p1

    #@1e
    invoke-direct/range {v5 .. v10}, Lcom/hcbiu/elcton/SyncEngine$beginTotal$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;IJLjava/lang/String;)V

    #@21
    check-cast v12, Lkotlin/jvm/functions/Function0;

    #@23
    invoke-interface {v11, v3, v4, v12}, Lcom/hcbiu/elcton/SyncScheduler;->after(JLkotlin/jvm/functions/Function0;)Lcom/hcbiu/elcton/SyncCancellation;

    #@26
    move-result-object v3

    #@27
    iput-object v3, p0, Lcom/hcbiu/elcton/SyncEngine;->totalTimer:Lcom/hcbiu/elcton/SyncCancellation;

    #@29
    return-void
.end method

.method private final cancelTimer()V
    .registers 5

    #@0
    iget-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timerSerial:J

    #@2
    const-wide/16 v2, 0x1

    #@4
    add-long/2addr v0, v2

    #@5
    iput-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timerSerial:J

    #@7
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timer:Lcom/hcbiu/elcton/SyncCancellation;

    #@9
    if-eqz v0, :cond_e

    #@b
    invoke-interface {v0}, Lcom/hcbiu/elcton/SyncCancellation;->cancel()V

    #@e
    :cond_e
    const/4 v0, 0x0

    #@f
    iput-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timer:Lcom/hcbiu/elcton/SyncCancellation;

    #@11
    return-void
.end method

.method private final deadline(JLkotlin/jvm/functions/Function0;)V
    .registers 15
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(J",
            "Lkotlin/jvm/functions/Function0<",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    invoke-direct {p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@3
    iget v6, p0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@5
    iget-wide v7, p0, Lcom/hcbiu/elcton/SyncEngine;->timerSerial:J

    #@7
    iget-object v9, p0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@9
    new-instance v10, Lcom/hcbiu/elcton/SyncEngine$deadline$1;

    #@b
    move-object v0, v10

    #@c
    move-object v1, p0

    #@d
    move v2, v6

    #@e
    move-wide v3, v7

    #@f
    move-object v5, p3

    #@10
    invoke-direct/range {v0 .. v5}, Lcom/hcbiu/elcton/SyncEngine$deadline$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;IJLkotlin/jvm/functions/Function0;)V

    #@13
    check-cast v10, Lkotlin/jvm/functions/Function0;

    #@15
    invoke-interface {v9, p1, p2, v10}, Lcom/hcbiu/elcton/SyncScheduler;->after(JLkotlin/jvm/functions/Function0;)Lcom/hcbiu/elcton/SyncCancellation;

    #@18
    move-result-object v0

    #@19
    iput-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->timer:Lcom/hcbiu/elcton/SyncCancellation;

    #@1b
    return-void
.end method

.method private final fail(Ljava/lang/String;)V
    .registers 24

    #@0
    move-object/from16 v0, p0

    #@2
    iget v1, v0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@4
    add-int/lit8 v1, v1, 0x1

    #@6
    iput v1, v0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@8
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@a
    invoke-virtual {v1}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@d
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@10
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@13
    const/4 v1, 0x0

    #@14
    iput-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@16
    iput-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@18
    const/4 v1, 0x0

    #@19
    iput-boolean v1, v0, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@1b
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->unregister()V

    #@1e
    iget-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@20
    const/16 v1, 0xc8

    #@22
    move-object/from16 v15, p1

    #@24
    invoke-static {v15, v1}, Lkotlin/text/StringsKt;->take(Ljava/lang/String;I)Ljava/lang/String;

    #@27
    move-result-object v4

    #@28
    const/16 v20, 0x7fc4

    #@2a
    const/16 v21, 0x0

    #@2c
    const-string v3, "\u64cd\u4f5c\u672a\u5b8c\u6210"

    #@2e
    const/4 v5, 0x0

    #@2f
    const-string v6, ""

    #@31
    const/4 v7, 0x0

    #@32
    const/4 v8, 0x0

    #@33
    const/4 v9, 0x0

    #@34
    const/4 v10, 0x0

    #@35
    const-wide/16 v11, 0x0

    #@37
    const/4 v13, 0x0

    #@38
    const/4 v14, 0x0

    #@39
    const/4 v1, 0x0

    #@3a
    move v15, v1

    #@3b
    const/16 v16, 0x0

    #@3d
    const-wide/16 v17, 0x0

    #@3f
    const/16 v19, 0x0

    #@41
    invoke-static/range {v2 .. v21}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@44
    move-result-object v1

    #@45
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@48
    return-void
.end method

.method private final finishTotal()V
    .registers 5

    #@0
    iget-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->totalSerial:J

    #@2
    const-wide/16 v2, 0x1

    #@4
    add-long/2addr v0, v2

    #@5
    iput-wide v0, p0, Lcom/hcbiu/elcton/SyncEngine;->totalSerial:J

    #@7
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->totalTimer:Lcom/hcbiu/elcton/SyncCancellation;

    #@9
    if-eqz v0, :cond_e

    #@b
    invoke-interface {v0}, Lcom/hcbiu/elcton/SyncCancellation;->cancel()V

    #@e
    :cond_e
    const/4 v0, 0x0

    #@f
    iput-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->totalTimer:Lcom/hcbiu/elcton/SyncCancellation;

    #@11
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->total:Lcom/hcbiu/elcton/OperationDeadline;

    #@13
    invoke-virtual {v0}, Lcom/hcbiu/elcton/OperationDeadline;->clear()V

    #@16
    return-void
.end method

.method private final hello()V
    .registers 5

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@2
    if-nez v0, :cond_a

    #@4
    const-string v0, "\u8bf7\u5148\u8fde\u63a5\u8bbe\u5907\u3002"

    #@6
    invoke-direct {p0, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@9
    return-void

    #@a
    :cond_a
    new-instance v0, Lcom/hcbiu/elcton/SyncEngine$hello$1;

    #@c
    invoke-direct {v0, p0}, Lcom/hcbiu/elcton/SyncEngine$hello$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;)V

    #@f
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@11
    const-wide/16 v1, 0x1388

    #@13
    invoke-direct {p0, v1, v2, v0}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@16
    sget-object v0, Lcom/hcbiu/elcton/Wire;->INSTANCE:Lcom/hcbiu/elcton/Wire;

    #@18
    const-string v1, "HELLO"

    #@1a
    const-string v2, ""

    #@1c
    invoke-virtual {v0, v1, v2}, Lcom/hcbiu/elcton/Wire;->header(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    #@1f
    move-result-object v0

    #@20
    new-instance v1, Ljava/lang/StringBuilder;

    #@22
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    #@25
    const-string v2, "{"

    #@27
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@2a
    move-result-object v1

    #@2b
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@2e
    move-result-object v0

    #@2f
    const-string v1, "}"

    #@31
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@34
    move-result-object v0

    #@35
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@38
    move-result-object v0

    #@39
    const/4 v1, 0x2

    #@3a
    const/4 v2, 0x0

    #@3b
    const/4 v3, 0x0

    #@3c
    invoke-static {p0, v0, v3, v1, v2}, Lcom/hcbiu/elcton/SyncEngine;->send$default(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;ZILjava/lang/Object;)V

    #@3f
    return-void
.end method

.method private final main(ILkotlin/jvm/functions/Function0;)V
    .registers 5
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(I",
            "Lkotlin/jvm/functions/Function0<",
            "Lkotlin/Unit;",
            ">;)V"
        }
    .end annotation

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@2
    new-instance v1, Lcom/hcbiu/elcton/SyncEngine$main$1;

    #@4
    invoke-direct {v1, p0, p1, p2}, Lcom/hcbiu/elcton/SyncEngine$main$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/functions/Function0;)V

    #@7
    check-cast v1, Lkotlin/jvm/functions/Function0;

    #@9
    invoke-interface {v0, v1}, Lcom/hcbiu/elcton/SyncScheduler;->post(Lkotlin/jvm/functions/Function0;)V

    #@c
    return-void
.end method

.method private final onMessage(Ljava/lang/String;)V
    .registers 44

    #@0
    move-object/from16 v1, p0

    #@2
    sget-object v0, Lcom/hcbiu/elcton/PacketIngress;->INSTANCE:Lcom/hcbiu/elcton/PacketIngress;

    #@4
    move-object/from16 v2, p1

    #@6
    invoke-virtual {v0, v2}, Lcom/hcbiu/elcton/PacketIngress;->watch(Ljava/lang/String;)Lorg/json/JSONObject;

    #@9
    move-result-object v0

    #@a
    if-nez v0, :cond_d

    #@c
    return-void

    #@d
    :cond_d
    move-object v3, v0

    #@e
    const-string v0, "type"

    #@10
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@13
    move-result-object v12

    #@14
    sget-object v0, Lcom/hcbiu/elcton/PacketIngress;->INSTANCE:Lcom/hcbiu/elcton/PacketIngress;

    #@16
    iget-boolean v4, v1, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@18
    iget-object v5, v1, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@1a
    const/4 v6, 0x0

    #@1b
    if-nez v5, :cond_24

    #@1d
    iget-object v5, v1, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@1f
    if-eqz v5, :cond_22

    #@21
    goto :goto_24

    #@22
    :cond_22
    move v5, v6

    #@23
    goto :goto_25

    #@24
    :cond_24
    :goto_24
    const/4 v5, 0x1

    #@25
    :goto_25
    invoke-virtual {v0, v3, v4, v5}, Lcom/hcbiu/elcton/PacketIngress;->preparationError(Lorg/json/JSONObject;ZZ)Ljava/lang/String;

    #@28
    move-result-object v0

    #@29
    if-eqz v0, :cond_30

    #@2b
    const/4 v4, 0x0

    #@2c
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@2f
    return-void

    #@30
    :cond_30
    iget-object v11, v1, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@32
    const/4 v0, 0x0

    #@33
    const-string v5, "code"

    #@35
    const-string v7, "seq"

    #@37
    const-string v8, "transferId"

    #@39
    const-string v9, "sourceRevision"

    #@3b
    const-string v10, "digest"

    #@3d
    const-string v13, "optString(...)"

    #@3f
    if-eqz v11, :cond_17b

    #@41
    invoke-virtual {v3, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@44
    move-result-object v4

    #@45
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@48
    move-result-object v8

    #@49
    invoke-static {v4, v8}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@4c
    move-result v4

    #@4d
    if-nez v4, :cond_50

    #@4f
    return-void

    #@50
    :cond_50
    const-string v4, "ERROR"

    #@52
    invoke-static {v12, v4}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@55
    move-result v4

    #@56
    if-eqz v4, :cond_79

    #@58
    invoke-virtual {v3, v5}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@5b
    move-result-object v0

    #@5c
    new-instance v4, Ljava/lang/StringBuilder;

    #@5e
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    #@61
    const-string v5, "\u624b\u8868\u5bfc\u51fa\u5931\u8d25\uff1a"

    #@63
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@66
    move-result-object v4

    #@67
    invoke-virtual {v4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@6a
    move-result-object v0

    #@6b
    const-string v4, "\uff0c\u624b\u673a\u8bfe\u8868\u6ca1\u6709\u6539\u53d8\u3002"

    #@6d
    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@70
    move-result-object v0

    #@71
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@74
    move-result-object v0

    #@75
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@78
    return-void

    #@79
    :cond_79
    const-string v4, "EXPORT_META"

    #@7b
    invoke-static {v12, v4}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@7e
    move-result v4

    #@7f
    if-eqz v4, :cond_ac

    #@81
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@84
    move-result-object v14

    #@85
    const-string v0, "length"

    #@87
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    #@8a
    move-result v15

    #@8b
    invoke-virtual {v3, v10}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@8e
    move-result-object v0

    #@8f
    invoke-static {v0, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@92
    const-string v4, "chunks"

    #@94
    invoke-virtual {v3, v4}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    #@97
    move-result v17

    #@98
    invoke-virtual {v3, v9}, Lorg/json/JSONObject;->optLong(Ljava/lang/String;)J

    #@9b
    move-result-wide v18

    #@9c
    move-object v13, v11

    #@9d
    move-object/from16 v16, v0

    #@9f
    invoke-virtual/range {v13 .. v19}, Lcom/hcbiu/elcton/ExportSession;->meta(Ljava/lang/String;ILjava/lang/String;IJ)Z

    #@a2
    move-result v0

    #@a3
    if-nez v0, :cond_a6

    #@a5
    return-void

    #@a6
    :cond_a6
    iput v6, v1, Lcom/hcbiu/elcton/SyncEngine;->exportRetries:I

    #@a8
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->requestExportPacket()V

    #@ab
    return-void

    #@ac
    :cond_ac
    const-string v4, "EXPORT_CHUNK"

    #@ae
    invoke-static {v12, v4}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@b1
    move-result v4

    #@b2
    if-eqz v4, :cond_17a

    #@b4
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@b7
    move-result-object v4

    #@b8
    const/4 v5, -0x1

    #@b9
    invoke-virtual {v3, v7, v5}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    #@bc
    move-result v5

    #@bd
    const-string v7, "data"

    #@bf
    invoke-virtual {v3, v7}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@c2
    move-result-object v7

    #@c3
    invoke-static {v7, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@c6
    invoke-virtual {v11, v4, v5, v7}, Lcom/hcbiu/elcton/ExportSession;->chunk(Ljava/lang/String;ILjava/lang/String;)Z

    #@c9
    move-result v4

    #@ca
    if-nez v4, :cond_cd

    #@cc
    return-void

    #@cd
    :cond_cd
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@d0
    iput v6, v1, Lcom/hcbiu/elcton/SyncEngine;->exportRetries:I

    #@d2
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getError()Ljava/lang/String;

    #@d5
    move-result-object v4

    #@d6
    if-eqz v4, :cond_de

    #@d8
    const-string v0, "\u624b\u8868\u5bfc\u51fa\u5185\u5bb9\u6821\u9a8c\u5931\u8d25\uff0c\u624b\u673a\u65e7\u8bfe\u8868\u4fdd\u7559\u3002"

    #@da
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@dd
    return-void

    #@de
    :cond_de
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getResult()Ljava/lang/String;

    #@e1
    move-result-object v4

    #@e2
    if-eqz v4, :cond_177

    #@e4
    :try_start_e4
    sget-object v5, Lcom/hcbiu/elcton/PhoneSnapshot;->INSTANCE:Lcom/hcbiu/elcton/PhoneSnapshot;

    #@e6
    invoke-virtual {v5, v4}, Lcom/hcbiu/elcton/PhoneSnapshot;->encode(Ljava/lang/String;)Ljava/lang/String;

    #@e9
    move-result-object v5
    :try_end_ea
    .catch Ljava/lang/Exception; {:try_start_e4 .. :try_end_ea} :catch_155

    #@ea
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@ed
    iget-object v7, v1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@ef
    invoke-virtual {v7}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@f2
    sget-object v7, Lcom/hcbiu/elcton/Wire;->INSTANCE:Lcom/hcbiu/elcton/Wire;

    #@f4
    const-string v8, "EXPORT_DONE"

    #@f6
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@f9
    move-result-object v9

    #@fa
    invoke-virtual {v7, v8, v9}, Lcom/hcbiu/elcton/Wire;->header(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    #@fd
    move-result-object v7

    #@fe
    new-instance v8, Ljava/lang/StringBuilder;

    #@100
    invoke-direct {v8}, Ljava/lang/StringBuilder;-><init>()V

    #@103
    const-string v9, "{"

    #@105
    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@108
    move-result-object v8

    #@109
    invoke-virtual {v8, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@10c
    move-result-object v7

    #@10d
    const-string v8, "}"

    #@10f
    invoke-virtual {v7, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@112
    move-result-object v7

    #@113
    invoke-virtual {v7}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@116
    move-result-object v7

    #@117
    invoke-direct {v1, v7, v6}, Lcom/hcbiu/elcton/SyncEngine;->send(Ljava/lang/String;Z)V

    #@11a
    iput-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@11c
    iget-object v13, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@11e
    const/16 v31, 0x7fdc

    #@120
    const/16 v32, 0x0

    #@122
    const-string v14, "\u624b\u8868\u8bfe\u8868\u5df2\u53d6\u56de"

    #@124
    const-string v15, "\u8bf7\u5728\u5bfc\u5165\u9884\u89c8\u4e2d\u51b3\u5b9a\u662f\u5426\u66ff\u6362\u624b\u673a\u8bfe\u8868\u3002"

    #@126
    const/16 v16, 0x0

    #@128
    const/16 v17, 0x0

    #@12a
    const/16 v18, 0x0

    #@12c
    const/16 v19, 0x0

    #@12e
    const/16 v20, 0x0

    #@130
    const/16 v21, 0x0

    #@132
    const-wide/16 v22, 0x0

    #@134
    const/16 v24, 0x0

    #@136
    const/16 v25, 0x0

    #@138
    const/16 v26, 0x0

    #@13a
    const/16 v27, 0x0

    #@13c
    const-wide/16 v28, 0x0

    #@13e
    const/16 v30, 0x0

    #@140
    invoke-static/range {v13 .. v32}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@143
    move-result-object v0

    #@144
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@147
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->importCandidate:Lkotlin/jvm/functions/Function2;

    #@149
    invoke-virtual {v11}, Lcom/hcbiu/elcton/ExportSession;->getSourceRevision()J

    #@14c
    move-result-wide v6

    #@14d
    invoke-static {v6, v7}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    #@150
    move-result-object v6

    #@151
    invoke-interface {v0, v5, v6}, Lkotlin/jvm/functions/Function2;->invoke(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    #@154
    goto :goto_17a

    #@155
    :catch_155
    move-exception v0

    #@156
    sget-object v5, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@158
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@15b
    move-result-object v6

    #@15c
    invoke-virtual {v5, v6}, Lcom/hcbiu/elcton/UserFacingError;->validation(Ljava/lang/String;)Ljava/lang/String;

    #@15f
    move-result-object v5

    #@160
    new-instance v6, Ljava/lang/StringBuilder;

    #@162
    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    #@165
    const-string v7, "\u624b\u8868\u5bfc\u51fa\u683c\u5f0f\u65e0\u6548\uff1a"

    #@167
    invoke-virtual {v6, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@16a
    move-result-object v6

    #@16b
    invoke-virtual {v6, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@16e
    move-result-object v5

    #@16f
    invoke-virtual {v5}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@172
    move-result-object v5

    #@173
    invoke-direct {v1, v5}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@176
    return-void

    #@177
    :cond_177
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->requestExportPacket()V

    #@17a
    :cond_17a
    :goto_17a
    return-void

    #@17b
    :cond_17b
    const-string v4, "READY"

    #@17d
    invoke-static {v12, v4}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@180
    move-result v4

    #@181
    if-eqz v4, :cond_1ea

    #@183
    iget-object v4, v1, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@185
    if-nez v4, :cond_1ea

    #@187
    iget-boolean v4, v1, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@189
    if-eqz v4, :cond_1ea

    #@18b
    iput-boolean v6, v1, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@18d
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@190
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@192
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@195
    iget-object v14, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@197
    invoke-virtual {v3, v10}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@19a
    move-result-object v0

    #@19b
    move-object/from16 v21, v0

    #@19d
    invoke-static {v0, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@1a0
    const-string v0, "localDirty"

    #@1a2
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optBoolean(Ljava/lang/String;)Z

    #@1a5
    move-result v22

    #@1a6
    invoke-virtual {v3, v9}, Lorg/json/JSONObject;->optLong(Ljava/lang/String;)J

    #@1a9
    move-result-wide v23

    #@1aa
    const-string v0, "maxBytes"

    #@1ac
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    #@1af
    move-result v25

    #@1b0
    const-string v0, "datasetId"

    #@1b2
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@1b5
    move-result-object v0

    #@1b6
    move-object/from16 v26, v0

    #@1b8
    invoke-static {v0, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@1bb
    const-string v0, "hasData"

    #@1bd
    invoke-virtual {v3, v0}, Lorg/json/JSONObject;->optBoolean(Ljava/lang/String;)Z

    #@1c0
    move-result v27

    #@1c1
    nop

    #@1c2
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->baselines:Lcom/hcbiu/elcton/SyncBaselines;

    #@1c4
    iget-object v4, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@1c6
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SyncEngine$State;->getSelected()Ljava/lang/String;

    #@1c9
    move-result-object v4

    #@1ca
    invoke-interface {v0, v4}, Lcom/hcbiu/elcton/SyncBaselines;->lastSuccess(Ljava/lang/String;)J

    #@1cd
    move-result-wide v29

    #@1ce
    const/16 v32, 0x500c

    #@1d0
    const/16 v33, 0x0

    #@1d2
    const-string v15, "\u624b\u8868\u5df2\u51c6\u5907"

    #@1d4
    const-string v16, "\u53ef\u4ee5\u540c\u6b65\u624b\u673a\u8bfe\u8868\uff0c\u6216\u5148\u5bfc\u5165\u624b\u8868\u5df2\u6709\u8bfe\u8868\u3002"

    #@1d6
    const/16 v17, 0x0

    #@1d8
    const/16 v18, 0x0

    #@1da
    const/16 v19, 0x1

    #@1dc
    const/16 v20, 0x0

    #@1de
    const/16 v28, 0x0

    #@1e0
    const/16 v31, 0x0

    #@1e2
    invoke-static/range {v14 .. v33}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@1e5
    move-result-object v0

    #@1e6
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@1e9
    return-void

    #@1ea
    :cond_1ea
    iget-object v4, v1, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@1ec
    if-nez v4, :cond_1ef

    #@1ee
    return-void

    #@1ef
    :cond_1ef
    invoke-static {v12}, Lkotlin/jvm/internal/Intrinsics;->checkNotNull(Ljava/lang/Object;)V

    #@1f2
    invoke-virtual {v3, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@1f5
    move-result-object v6

    #@1f6
    invoke-static {v6, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@1f9
    const/16 v8, -0x63

    #@1fb
    invoke-virtual {v3, v7, v8}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    #@1fe
    move-result v7

    #@1ff
    invoke-virtual {v3, v10}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@202
    move-result-object v8

    #@203
    invoke-static {v8, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@206
    invoke-virtual {v3, v9}, Lorg/json/JSONObject;->optLong(Ljava/lang/String;)J

    #@209
    move-result-wide v9

    #@20a
    invoke-virtual {v3, v5}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    #@20d
    move-result-object v14

    #@20e
    invoke-static {v14, v13}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@211
    move-object v5, v12

    #@212
    move-object v13, v11

    #@213
    move-object v11, v14

    #@214
    invoke-virtual/range {v4 .. v11}, Lcom/hcbiu/elcton/TransferSession;->reply(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;JLjava/lang/String;)Z

    #@217
    move-result v5

    #@218
    if-nez v5, :cond_21b

    #@21a
    return-void

    #@21b
    :cond_21b
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@21e
    iget-object v5, v1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@220
    invoke-virtual {v5}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@223
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getComplete()Z

    #@226
    move-result v5

    #@227
    if-eqz v5, :cond_285

    #@229
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@22c
    iput-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@22e
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@230
    invoke-interface {v0}, Lcom/hcbiu/elcton/SyncScheduler;->wallTime()J

    #@233
    move-result-wide v5

    #@234
    move-wide/from16 v37, v5

    #@236
    iget-object v14, v1, Lcom/hcbiu/elcton/SyncEngine;->baselines:Lcom/hcbiu/elcton/SyncBaselines;

    #@238
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@23a
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getSelected()Ljava/lang/String;

    #@23d
    move-result-object v15

    #@23e
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getDatasetId()Ljava/lang/String;

    #@241
    move-result-object v16

    #@242
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getDigest()Ljava/lang/String;

    #@245
    move-result-object v17

    #@246
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getRevision()J

    #@249
    move-result-wide v18

    #@24a
    move-wide/from16 v20, v5

    #@24c
    invoke-interface/range {v14 .. v21}, Lcom/hcbiu/elcton/SyncBaselines;->save(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JJ)V

    #@24f
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@251
    move-object/from16 v22, v0

    #@253
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getDigest()Ljava/lang/String;

    #@256
    move-result-object v29

    #@257
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getRevision()J

    #@25a
    move-result-wide v31

    #@25b
    nop

    #@25c
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getDatasetId()Ljava/lang/String;

    #@25f
    move-result-object v34

    #@260
    nop

    #@261
    nop

    #@262
    nop

    #@263
    const/16 v40, 0x521c

    #@265
    const/16 v41, 0x0

    #@267
    const-string v23, "\u540c\u6b65\u6210\u529f"

    #@269
    const-string v24, "\u624b\u8868\u5df2\u4fdd\u5b58\u5e76\u8bfb\u56de\u786e\u8ba4\u3002"

    #@26b
    const/16 v25, 0x0

    #@26d
    const/16 v26, 0x0

    #@26f
    const/16 v27, 0x0

    #@271
    const/16 v28, 0x0

    #@273
    const/16 v30, 0x0

    #@275
    const/16 v33, 0x0

    #@277
    const/16 v35, 0x1

    #@279
    const/16 v36, 0x0

    #@27b
    const/16 v39, 0x0

    #@27d
    invoke-static/range {v22 .. v41}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@280
    move-result-object v0

    #@281
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@284
    goto :goto_2af

    #@285
    :cond_285
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getError()Ljava/lang/String;

    #@288
    move-result-object v0

    #@289
    if-eqz v0, :cond_2ac

    #@28b
    invoke-virtual {v4}, Lcom/hcbiu/elcton/TransferSession;->getError()Ljava/lang/String;

    #@28e
    move-result-object v0

    #@28f
    new-instance v5, Ljava/lang/StringBuilder;

    #@291
    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    #@294
    const-string v6, "\u624b\u8868\u672a\u786e\u8ba4\u672c\u6b21\u63d0\u4ea4\uff08"

    #@296
    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@299
    move-result-object v5

    #@29a
    invoke-virtual {v5, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@29d
    move-result-object v0

    #@29e
    const-string v5, "\uff09\u3002\u8bf7\u91cd\u65b0\u8fde\u63a5\u6838\u5bf9\u6700\u7ec8\u8bfe\u8868\uff0c\u4e0d\u628a\u53d6\u6d88\u6216\u53d1\u9001\u56de\u6267\u5f53\u4f5c\u56de\u6eda\u8bc1\u636e\u3002"

    #@2a0
    invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@2a3
    move-result-object v0

    #@2a4
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@2a7
    move-result-object v0

    #@2a8
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@2ab
    goto :goto_2af

    #@2ac
    :cond_2ac
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->transmitCurrent()V

    #@2af
    :goto_2af
    return-void
.end method

.method private final permissionRequired()V
    .registers 22

    #@0
    move-object/from16 v0, p0

    #@2
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@5
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@7
    nop

    #@8
    nop

    #@9
    const/4 v2, 0x0

    #@a
    invoke-static {v2}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    #@d
    move-result-object v18

    #@e
    const/16 v19, 0x3fcc

    #@10
    const/16 v20, 0x0

    #@12
    const-string v2, "\u9700\u8981\u8bbe\u5907\u6388\u6743"

    #@14
    const-string v3, "\u9700\u8981\u7528\u6237\u5728\u53ef\u89c1\u9875\u9762\u786e\u8ba4\u8bbe\u5907\u6388\u6743\uff0c\u540e\u53f0\u4e0d\u4f1a\u5f39\u51fa\u6388\u6743\u7a97\u53e3\u3002"

    #@16
    const/4 v4, 0x0

    #@17
    const/4 v5, 0x0

    #@18
    const/4 v6, 0x0

    #@19
    const/4 v7, 0x0

    #@1a
    const/4 v8, 0x0

    #@1b
    const/4 v9, 0x0

    #@1c
    const-wide/16 v10, 0x0

    #@1e
    const/4 v12, 0x0

    #@1f
    const/4 v13, 0x0

    #@20
    const/4 v14, 0x0

    #@21
    const/4 v15, 0x0

    #@22
    const-wide/16 v16, 0x0

    #@24
    invoke-static/range {v1 .. v20}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@27
    move-result-object v1

    #@28
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@2b
    return-void
.end method

.method private final publish(Lcom/hcbiu/elcton/SyncEngine$State;)V
    .registers 3

    #@0
    iput-object p1, p0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@2
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->update:Lkotlin/jvm/functions/Function1;

    #@4
    invoke-interface {v0, p1}, Lkotlin/jvm/functions/Function1;->invoke(Ljava/lang/Object;)Ljava/lang/Object;

    #@7
    return-void
.end method

.method private final requestExportPacket()V
    .registers 7

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@2
    if-nez v0, :cond_5

    #@4
    return-void

    #@5
    :cond_5
    invoke-virtual {v0}, Lcom/hcbiu/elcton/ExportSession;->getInitialized()Z

    #@8
    move-result v1

    #@9
    if-eqz v1, :cond_e

    #@b
    const-string v1, "EXPORT_NEXT"

    #@d
    goto :goto_10

    #@e
    :cond_e
    const-string v1, "EXPORT_REQUEST"

    #@10
    :goto_10
    new-instance v2, Lcom/hcbiu/elcton/SyncEngine$requestExportPacket$1;

    #@12
    invoke-direct {v2, p0, v0}, Lcom/hcbiu/elcton/SyncEngine$requestExportPacket$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;Lcom/hcbiu/elcton/ExportSession;)V

    #@15
    check-cast v2, Lkotlin/jvm/functions/Function0;

    #@17
    const-wide/16 v3, 0x1388

    #@19
    invoke-direct {p0, v3, v4, v2}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@1c
    sget-object v2, Lcom/hcbiu/elcton/Wire;->INSTANCE:Lcom/hcbiu/elcton/Wire;

    #@1e
    invoke-virtual {v0}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@21
    move-result-object v3

    #@22
    invoke-virtual {v2, v1, v3}, Lcom/hcbiu/elcton/Wire;->header(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    #@25
    move-result-object v2

    #@26
    invoke-virtual {v0}, Lcom/hcbiu/elcton/ExportSession;->getInitialized()Z

    #@29
    move-result v3

    #@2a
    if-eqz v3, :cond_44

    #@2c
    invoke-virtual {v0}, Lcom/hcbiu/elcton/ExportSession;->getNextSequence()I

    #@2f
    move-result v3

    #@30
    new-instance v4, Ljava/lang/StringBuilder;

    #@32
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    #@35
    const-string v5, ",\"seq\":"

    #@37
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@3a
    move-result-object v4

    #@3b
    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    #@3e
    move-result-object v3

    #@3f
    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@42
    move-result-object v3

    #@43
    goto :goto_46

    #@44
    :cond_44
    const-string v3, ""

    #@46
    :goto_46
    new-instance v4, Ljava/lang/StringBuilder;

    #@48
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    #@4b
    const-string v5, "{"

    #@4d
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@50
    move-result-object v4

    #@51
    invoke-virtual {v4, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@54
    move-result-object v2

    #@55
    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@58
    move-result-object v2

    #@59
    const-string v3, "}"

    #@5b
    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@5e
    move-result-object v2

    #@5f
    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@62
    move-result-object v2

    #@63
    const/4 v3, 0x2

    #@64
    const/4 v4, 0x0

    #@65
    const/4 v5, 0x0

    #@66
    invoke-static {p0, v2, v5, v3, v4}, Lcom/hcbiu/elcton/SyncEngine;->send$default(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;ZILjava/lang/Object;)V

    #@69
    return-void
.end method

.method private final scan(I)V
    .registers 26

    #@0
    move-object/from16 v1, p0

    #@2
    move/from16 v2, p1

    #@4
    new-instance v0, Lkotlin/jvm/internal/Ref$BooleanRef;

    #@6
    invoke-direct {v0}, Lkotlin/jvm/internal/Ref$BooleanRef;-><init>()V

    #@9
    move-object v3, v0

    #@a
    const/4 v0, 0x1

    #@b
    iput-boolean v0, v3, Lkotlin/jvm/internal/Ref$BooleanRef;->element:Z

    #@d
    iget-object v4, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@f
    const/16 v22, 0x7fde

    #@11
    const/16 v23, 0x0

    #@13
    const-string v5, "\u67e5\u8be2\u914d\u5bf9\u8bbe\u5907"

    #@15
    const/4 v6, 0x0

    #@16
    const/4 v7, 0x0

    #@17
    const/4 v8, 0x0

    #@18
    const/4 v9, 0x0

    #@19
    const/4 v10, 0x1

    #@1a
    const/4 v11, 0x0

    #@1b
    const/4 v12, 0x0

    #@1c
    const-wide/16 v13, 0x0

    #@1e
    const/4 v15, 0x0

    #@1f
    const/16 v16, 0x0

    #@21
    const/16 v17, 0x0

    #@23
    const/16 v18, 0x0

    #@25
    const-wide/16 v19, 0x0

    #@27
    const/16 v21, 0x0

    #@29
    invoke-static/range {v4 .. v23}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@2c
    move-result-object v0

    #@2d
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@30
    new-instance v0, Lcom/hcbiu/elcton/SyncEngine$scan$1;

    #@32
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine$scan$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;)V

    #@35
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@37
    const-wide/16 v4, 0x3a98

    #@39
    invoke-direct {v1, v4, v5, v0}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@3c
    nop

    #@3d
    :try_start_3d
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@3f
    new-instance v4, Lcom/hcbiu/elcton/SyncEngine$scan$2;

    #@41
    invoke-direct {v4, v1, v2, v3}, Lcom/hcbiu/elcton/SyncEngine$scan$2;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;)V

    #@44
    check-cast v4, Lkotlin/jvm/functions/Function1;

    #@46
    new-instance v5, Lcom/hcbiu/elcton/SyncEngine$scan$3;

    #@48
    invoke-direct {v5, v1, v2, v3}, Lcom/hcbiu/elcton/SyncEngine$scan$3;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;)V

    #@4b
    check-cast v5, Lkotlin/jvm/functions/Function1;

    #@4d
    invoke-interface {v0, v4, v5}, Lcom/hcbiu/elcton/SyncTransport;->scan(Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    :try_end_50
    .catch Ljava/lang/Exception; {:try_start_3d .. :try_end_50} :catch_51

    #@50
    goto :goto_67

    #@51
    :catch_51
    move-exception v0

    #@52
    iget v4, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@54
    if-ne v2, v4, :cond_67

    #@56
    sget-object v4, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@58
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@5b
    move-result-object v5

    #@5c
    if-nez v5, :cond_60

    #@5e
    const-string v5, ""

    #@60
    :cond_60
    invoke-virtual {v4, v5}, Lcom/hcbiu/elcton/UserFacingError;->explain(Ljava/lang/String;)Ljava/lang/String;

    #@63
    move-result-object v4

    #@64
    invoke-direct {v1, v4}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@67
    :cond_67
    :goto_67
    return-void
.end method

.method private final send(Ljava/lang/String;Z)V
    .registers 16

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@2
    if-nez v0, :cond_5

    #@4
    return-void

    #@5
    :cond_5
    iget v7, p0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@7
    iget-object v1, p0, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@9
    invoke-virtual {v1}, Lcom/hcbiu/elcton/SendAttempts;->issue()J

    #@c
    move-result-wide v8

    #@d
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    #@10
    move-result v1

    #@11
    const/16 v2, 0x400

    #@13
    if-gt v1, v2, :cond_7a

    #@15
    move-object v1, p1

    #@16
    check-cast v1, Ljava/lang/CharSequence;

    #@18
    const/4 v2, 0x0

    #@19
    const/4 v3, 0x0

    #@1a
    move v4, v3

    #@1b
    :goto_1b
    invoke-interface {v1}, Ljava/lang/CharSequence;->length()I

    #@1e
    move-result v5

    #@1f
    if-ge v4, v5, :cond_3c

    #@21
    invoke-interface {v1, v4}, Ljava/lang/CharSequence;->charAt(I)C

    #@24
    move-result v5

    #@25
    move v6, v5

    #@26
    const/4 v10, 0x0

    #@27
    const/16 v11, 0x20

    #@29
    const/4 v12, 0x1

    #@2a
    if-gt v11, v6, :cond_32

    #@2c
    const/16 v11, 0x7f

    #@2e
    if-ge v6, v11, :cond_32

    #@30
    move v11, v12

    #@31
    goto :goto_33

    #@32
    :cond_32
    move v11, v3

    #@33
    :goto_33
    xor-int/lit8 v6, v11, 0x1

    #@35
    if-eqz v6, :cond_39

    #@37
    move v3, v12

    #@38
    goto :goto_3d

    #@39
    :cond_39
    add-int/lit8 v4, v4, 0x1

    #@3b
    goto :goto_1b

    #@3c
    :cond_3c
    nop

    #@3d
    :goto_3d
    if-eqz v3, :cond_40

    #@3f
    goto :goto_7a

    #@40
    :cond_40
    nop

    #@41
    :try_start_41
    iget-object v10, p0, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@43
    new-instance v11, Lcom/hcbiu/elcton/SyncEngine$send$2;

    #@45
    move-object v1, v11

    #@46
    move-object v2, p0

    #@47
    move v3, v7

    #@48
    move v4, p2

    #@49
    move-wide v5, v8

    #@4a
    invoke-direct/range {v1 .. v6}, Lcom/hcbiu/elcton/SyncEngine$send$2;-><init>(Lcom/hcbiu/elcton/SyncEngine;IZJ)V

    #@4d
    check-cast v11, Lkotlin/jvm/functions/Function1;

    #@4f
    new-instance v12, Lcom/hcbiu/elcton/SyncEngine$send$3;

    #@51
    move-object v1, v12

    #@52
    move-object v2, p0

    #@53
    move v3, v7

    #@54
    move v4, p2

    #@55
    move-wide v5, v8

    #@56
    invoke-direct/range {v1 .. v6}, Lcom/hcbiu/elcton/SyncEngine$send$3;-><init>(Lcom/hcbiu/elcton/SyncEngine;IZJ)V

    #@59
    check-cast v12, Lkotlin/jvm/functions/Function1;

    #@5b
    invoke-interface {v10, v0, p1, v11, v12}, Lcom/hcbiu/elcton/SyncTransport;->send(Lcom/hcbiu/elcton/SyncDevice;Ljava/lang/String;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    :try_end_5e
    .catch Ljava/lang/Exception; {:try_start_41 .. :try_end_5e} :catch_5f

    #@5e
    goto :goto_79

    #@5f
    :catch_5f
    move-exception v1

    #@60
    if-eqz p2, :cond_79

    #@62
    invoke-static {v7, p0, v8, v9}, Lcom/hcbiu/elcton/SyncEngine;->send$accepts(ILcom/hcbiu/elcton/SyncEngine;J)Z

    #@65
    move-result v2

    #@66
    if-eqz v2, :cond_79

    #@68
    sget-object v2, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@6a
    invoke-virtual {v1}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@6d
    move-result-object v3

    #@6e
    if-nez v3, :cond_72

    #@70
    const-string v3, ""

    #@72
    :cond_72
    invoke-virtual {v2, v3}, Lcom/hcbiu/elcton/UserFacingError;->explain(Ljava/lang/String;)Ljava/lang/String;

    #@75
    move-result-object v2

    #@76
    invoke-direct {p0, v2}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@79
    :cond_79
    :goto_79
    return-void

    #@7a
    :cond_7a
    :goto_7a
    if-eqz p2, :cond_81

    #@7c
    const-string v1, "\u6d88\u606f\u8d85\u51fa\u4f20\u8f93\u4e0a\u9650\uff0c\u672a\u53d1\u9001\u3002"

    #@7e
    invoke-direct {p0, v1}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@81
    :cond_81
    return-void
.end method

.method private static final send$accepts(ILcom/hcbiu/elcton/SyncEngine;J)Z
    .registers 5

    #@0
    iget v0, p1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@2
    if-ne p0, v0, :cond_e

    #@4
    iget-object v0, p1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@6
    invoke-virtual {v0, p2, p3}, Lcom/hcbiu/elcton/SendAttempts;->accepts(J)Z

    #@9
    move-result v0

    #@a
    if-eqz v0, :cond_e

    #@c
    const/4 v0, 0x1

    #@d
    goto :goto_f

    #@e
    :cond_e
    const/4 v0, 0x0

    #@f
    :goto_f
    return v0
.end method

.method static synthetic send$default(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;ZILjava/lang/Object;)V
    .registers 5

    #@0
    and-int/lit8 p3, p3, 0x2

    #@2
    if-eqz p3, :cond_5

    #@4
    const/4 p2, 0x1

    #@5
    :cond_5
    invoke-direct {p0, p1, p2}, Lcom/hcbiu/elcton/SyncEngine;->send(Ljava/lang/String;Z)V

    #@8
    return-void
.end method

.method private final transmitCurrent()V
    .registers 23

    #@0
    move-object/from16 v0, p0

    #@2
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@4
    if-nez v1, :cond_7

    #@6
    return-void

    #@7
    :cond_7
    iget-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@9
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getAcceptedChunks()I

    #@c
    move-result v3

    #@d
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getChunkCount()I

    #@10
    move-result v4

    #@11
    if-ne v3, v4, :cond_16

    #@13
    const-string v3, "\u6b63\u5728\u6821\u9a8c\u4fdd\u5b58"

    #@15
    goto :goto_18

    #@16
    :cond_16
    const-string v3, "\u6b63\u5728\u540c\u6b65"

    #@18
    :goto_18
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getAcceptedChunks()I

    #@1b
    move-result v4

    #@1c
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getChunkCount()I

    #@1f
    move-result v5

    #@20
    new-instance v6, Ljava/lang/StringBuilder;

    #@22
    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    #@25
    const-string v7, "\u5df2\u786e\u8ba4 "

    #@27
    invoke-virtual {v6, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@2a
    move-result-object v6

    #@2b
    invoke-virtual {v6, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    #@2e
    move-result-object v4

    #@2f
    const-string v6, "/"

    #@31
    invoke-virtual {v4, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@34
    move-result-object v4

    #@35
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    #@38
    move-result-object v4

    #@39
    const-string v5, " \u5305\uff1b\u6536\u5230\u4fdd\u5b58\u56de\u6267\u624d\u7b97\u5b8c\u6210\u3002"

    #@3b
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@3e
    move-result-object v4

    #@3f
    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@42
    move-result-object v4

    #@43
    const/16 v20, 0x7ffc

    #@45
    const/16 v21, 0x0

    #@47
    const/4 v5, 0x0

    #@48
    const/4 v6, 0x0

    #@49
    const/4 v7, 0x0

    #@4a
    const/4 v8, 0x0

    #@4b
    const/4 v9, 0x0

    #@4c
    const/4 v10, 0x0

    #@4d
    const-wide/16 v11, 0x0

    #@4f
    const/4 v13, 0x0

    #@50
    const/4 v14, 0x0

    #@51
    const/4 v15, 0x0

    #@52
    const/16 v16, 0x0

    #@54
    const-wide/16 v17, 0x0

    #@56
    const/16 v19, 0x0

    #@58
    invoke-static/range {v2 .. v21}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@5b
    move-result-object v2

    #@5c
    invoke-direct {v0, v2}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@5f
    new-instance v2, Lcom/hcbiu/elcton/SyncEngine$transmitCurrent$1;

    #@61
    invoke-direct {v2, v0, v1}, Lcom/hcbiu/elcton/SyncEngine$transmitCurrent$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;Lcom/hcbiu/elcton/TransferSession;)V

    #@64
    check-cast v2, Lkotlin/jvm/functions/Function0;

    #@66
    const-wide/16 v3, 0x1388

    #@68
    invoke-direct {v0, v3, v4, v2}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@6b
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getCurrentMessage()Ljava/lang/String;

    #@6e
    move-result-object v2

    #@6f
    if-eqz v2, :cond_78

    #@71
    const/4 v3, 0x0

    #@72
    const/4 v4, 0x2

    #@73
    const/4 v5, 0x0

    #@74
    const/4 v6, 0x0

    #@75
    invoke-static {v0, v2, v6, v4, v5}, Lcom/hcbiu/elcton/SyncEngine;->send$default(Lcom/hcbiu/elcton/SyncEngine;Ljava/lang/String;ZILjava/lang/Object;)V

    #@78
    :cond_78
    return-void
.end method

.method private final unregister()V
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@2
    invoke-interface {v0}, Lcom/hcbiu/elcton/SyncTransport;->unregister()V

    #@5
    const/4 v0, 0x0

    #@6
    iput-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@8
    return-void
.end method


# virtual methods
.method public final authorizeAndScan(Z)Z
    .registers 27

    #@0
    move-object/from16 v1, p0

    #@2
    iget-boolean v0, v1, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@4
    const/4 v2, 0x0

    #@5
    if-nez v0, :cond_96

    #@7
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@9
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getBusy()Z

    #@c
    move-result v0

    #@d
    if-eqz v0, :cond_13

    #@f
    move/from16 v6, p1

    #@11
    goto/16 :goto_98

    #@13
    :cond_13
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->unregister()V

    #@16
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@19
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@1c
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@1e
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@21
    iput-boolean v2, v1, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@23
    iget v0, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@25
    const/4 v2, 0x1

    #@26
    add-int/2addr v0, v2

    #@27
    iput v0, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@29
    iget v3, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@2b
    new-instance v0, Lkotlin/jvm/internal/Ref$BooleanRef;

    #@2d
    invoke-direct {v0}, Lkotlin/jvm/internal/Ref$BooleanRef;-><init>()V

    #@30
    move-object v4, v0

    #@31
    iput-boolean v2, v4, Lkotlin/jvm/internal/Ref$BooleanRef;->element:Z

    #@33
    iget-object v5, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@35
    const/16 v23, 0x6fc6

    #@37
    const/16 v24, 0x0

    #@39
    const-string v6, "\u68c0\u67e5\u8bbe\u5907\u6388\u6743"

    #@3b
    const/4 v7, 0x0

    #@3c
    const/4 v8, 0x0

    #@3d
    const-string v9, ""

    #@3f
    const/4 v10, 0x0

    #@40
    const/4 v11, 0x1

    #@41
    const/4 v12, 0x0

    #@42
    const/4 v13, 0x0

    #@43
    const-wide/16 v14, 0x0

    #@45
    const/16 v16, 0x0

    #@47
    const/16 v17, 0x0

    #@49
    const/16 v18, 0x0

    #@4b
    const-string v19, ""

    #@4d
    const-wide/16 v20, 0x0

    #@4f
    const/16 v22, 0x0

    #@51
    invoke-static/range {v5 .. v24}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@54
    move-result-object v0

    #@55
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@58
    new-instance v0, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$1;

    #@5a
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;)V

    #@5d
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@5f
    const-wide/16 v5, 0x4e20

    #@61
    invoke-direct {v1, v5, v6, v0}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@64
    nop

    #@65
    :try_start_65
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@67
    new-instance v5, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$2;
    :try_end_69
    .catch Ljava/lang/Exception; {:try_start_65 .. :try_end_69} :catch_7d

    #@69
    move/from16 v6, p1

    #@6b
    :try_start_6b
    invoke-direct {v5, v1, v3, v4, v6}, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$2;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;Z)V

    #@6e
    check-cast v5, Lkotlin/jvm/functions/Function1;

    #@70
    new-instance v7, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$3;

    #@72
    invoke-direct {v7, v1, v3, v4}, Lcom/hcbiu/elcton/SyncEngine$authorizeAndScan$3;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;)V

    #@75
    check-cast v7, Lkotlin/jvm/functions/Function1;

    #@77
    invoke-interface {v0, v5, v7}, Lcom/hcbiu/elcton/SyncTransport;->checkPermission(Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    :try_end_7a
    .catch Ljava/lang/Exception; {:try_start_6b .. :try_end_7a} :catch_7b

    #@7a
    goto :goto_95

    #@7b
    :catch_7b
    move-exception v0

    #@7c
    goto :goto_80

    #@7d
    :catch_7d
    move-exception v0

    #@7e
    move/from16 v6, p1

    #@80
    :goto_80
    iget v5, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@82
    if-ne v3, v5, :cond_95

    #@84
    sget-object v5, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@86
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@89
    move-result-object v7

    #@8a
    if-nez v7, :cond_8e

    #@8c
    const-string v7, ""

    #@8e
    :cond_8e
    invoke-virtual {v5, v7}, Lcom/hcbiu/elcton/UserFacingError;->explain(Ljava/lang/String;)Ljava/lang/String;

    #@91
    move-result-object v5

    #@92
    invoke-direct {v1, v5}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@95
    :cond_95
    :goto_95
    return v2

    #@96
    :cond_96
    move/from16 v6, p1

    #@98
    :goto_98
    return v2
.end method

.method public final cancel()V
    .registers 26

    #@0
    move-object/from16 v0, p0

    #@2
    iget-boolean v1, v0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@4
    if-eqz v1, :cond_7

    #@6
    return-void

    #@7
    :cond_7
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@9
    const/4 v2, 0x0

    #@a
    if-eqz v1, :cond_12

    #@c
    invoke-virtual {v1}, Lcom/hcbiu/elcton/TransferSession;->getTransferId()Ljava/lang/String;

    #@f
    move-result-object v1

    #@10
    if-nez v1, :cond_1c

    #@12
    :cond_12
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@14
    if-eqz v1, :cond_1b

    #@16
    invoke-virtual {v1}, Lcom/hcbiu/elcton/ExportSession;->getId()Ljava/lang/String;

    #@19
    move-result-object v1

    #@1a
    goto :goto_1c

    #@1b
    :cond_1b
    move-object v1, v2

    #@1c
    :cond_1c
    :goto_1c
    const/4 v3, 0x0

    #@1d
    if-eqz v1, :cond_43

    #@1f
    sget-object v4, Lcom/hcbiu/elcton/Wire;->INSTANCE:Lcom/hcbiu/elcton/Wire;

    #@21
    const-string v5, "CANCEL"

    #@23
    invoke-virtual {v4, v5, v1}, Lcom/hcbiu/elcton/Wire;->header(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    #@26
    move-result-object v4

    #@27
    new-instance v5, Ljava/lang/StringBuilder;

    #@29
    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    #@2c
    const-string v6, "{"

    #@2e
    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@31
    move-result-object v5

    #@32
    invoke-virtual {v5, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@35
    move-result-object v4

    #@36
    const-string v5, "}"

    #@38
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@3b
    move-result-object v4

    #@3c
    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@3f
    move-result-object v4

    #@40
    invoke-direct {v0, v4, v3}, Lcom/hcbiu/elcton/SyncEngine;->send(Ljava/lang/String;Z)V

    #@43
    :cond_43
    iget v4, v0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@45
    add-int/lit8 v4, v4, 0x1

    #@47
    iput v4, v0, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@49
    iget-object v4, v0, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@4b
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@4e
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@51
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@54
    iput-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@56
    iput-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@58
    iput-boolean v3, v0, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@5a
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->unregister()V

    #@5d
    iget-object v5, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@5f
    nop

    #@60
    const/16 v23, 0x7fc4

    #@62
    const/16 v24, 0x0

    #@64
    const-string v6, "\u5df2\u65ad\u5f00"

    #@66
    const-string v7, "\u5df2\u505c\u6b62\u7b49\u5f85\u56de\u6267\uff1b\u82e5\u5df2\u8fdb\u5165\u4fdd\u5b58\u9636\u6bb5\uff0c\u8bf7\u91cd\u65b0\u8fde\u63a5\u6838\u5bf9\u6700\u7ec8\u8bfe\u8868\u3002\u624b\u673a\u4e0d\u4f1a\u81ea\u52a8\u5bfc\u5165\u6216\u5408\u5e76\u3002"

    #@68
    const/4 v8, 0x0

    #@69
    const-string v9, ""

    #@6b
    const/4 v10, 0x0

    #@6c
    const/4 v11, 0x0

    #@6d
    const/4 v12, 0x0

    #@6e
    const/4 v13, 0x0

    #@6f
    const-wide/16 v14, 0x0

    #@71
    const/16 v16, 0x0

    #@73
    const/16 v17, 0x0

    #@75
    const/16 v18, 0x0

    #@77
    const/16 v19, 0x0

    #@79
    const-wide/16 v20, 0x0

    #@7b
    const/16 v22, 0x0

    #@7d
    invoke-static/range {v5 .. v24}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@80
    move-result-object v2

    #@81
    invoke-direct {v0, v2}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@84
    return-void
.end method

.method public final close()V
    .registers 2

    #@0
    iget-boolean v0, p0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@2
    if-nez v0, :cond_a

    #@4
    invoke-virtual {p0}, Lcom/hcbiu/elcton/SyncEngine;->cancel()V

    #@7
    const/4 v0, 0x1

    #@8
    iput-boolean v0, p0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@a
    :cond_a
    return-void
.end method

.method public final connect(Ljava/lang/String;)Z
    .registers 29

    #@0
    move-object/from16 v1, p0

    #@2
    move-object/from16 v2, p1

    #@4
    const-string v0, "deviceId"

    #@6
    invoke-static {v2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@9
    iget-boolean v0, v1, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@b
    const/4 v3, 0x0

    #@c
    if-nez v0, :cond_f5

    #@e
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@10
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getBusy()Z

    #@13
    move-result v0

    #@14
    if-eqz v0, :cond_18

    #@16
    goto/16 :goto_f5

    #@18
    :cond_18
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@1a
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getDevices()Ljava/util/List;

    #@1d
    move-result-object v0

    #@1e
    check-cast v0, Ljava/lang/Iterable;

    #@20
    const/4 v4, 0x0

    #@21
    invoke-interface {v0}, Ljava/lang/Iterable;->iterator()Ljava/util/Iterator;

    #@24
    move-result-object v5

    #@25
    :cond_25
    invoke-interface {v5}, Ljava/util/Iterator;->hasNext()Z

    #@28
    move-result v6

    #@29
    if-eqz v6, :cond_3e

    #@2b
    invoke-interface {v5}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    #@2e
    move-result-object v6

    #@2f
    move-object v7, v6

    #@30
    check-cast v7, Lcom/hcbiu/elcton/SyncDevice;

    #@32
    const/4 v8, 0x0

    #@33
    invoke-virtual {v7}, Lcom/hcbiu/elcton/SyncDevice;->getId()Ljava/lang/String;

    #@36
    move-result-object v9

    #@37
    invoke-static {v9, v2}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@3a
    move-result v7

    #@3b
    if-eqz v7, :cond_25

    #@3d
    goto :goto_3f

    #@3e
    :cond_3e
    const/4 v6, 0x0

    #@3f
    :goto_3f
    move-object v4, v6

    #@40
    check-cast v4, Lcom/hcbiu/elcton/SyncDevice;

    #@42
    if-eqz v4, :cond_ef

    #@44
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SyncDevice;->getId()Ljava/lang/String;

    #@47
    move-result-object v0

    #@48
    check-cast v0, Ljava/lang/CharSequence;

    #@4a
    invoke-interface {v0}, Ljava/lang/CharSequence;->length()I

    #@4d
    move-result v0

    #@4e
    const/4 v5, 0x1

    #@4f
    if-nez v0, :cond_53

    #@51
    move v0, v5

    #@52
    goto :goto_54

    #@53
    :cond_53
    move v0, v3

    #@54
    :goto_54
    if-eqz v0, :cond_58

    #@56
    goto/16 :goto_ef

    #@58
    :cond_58
    sget-object v0, Lcom/hcbiu/elcton/DevicePolicy;->INSTANCE:Lcom/hcbiu/elcton/DevicePolicy;

    #@5a
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SyncDevice;->getConnected()Z

    #@5d
    move-result v6

    #@5e
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SyncDevice;->getP2pCapability()I

    #@61
    move-result v7

    #@62
    invoke-virtual {v0, v6, v7, v3, v5}, Lcom/hcbiu/elcton/DevicePolicy;->canAttemptSync(ZIII)Z

    #@65
    move-result v0

    #@66
    if-nez v0, :cond_6e

    #@68
    const-string v0, "\u8bbe\u5907\u672a\u8fde\u63a5\uff0c\u6216\u660e\u786e\u4e0d\u652f\u6301\u5e94\u7528\u95f4\u901a\u4fe1\u3002"

    #@6a
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@6d
    return v3

    #@6e
    :cond_6e
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->unregister()V

    #@71
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->cancelTimer()V

    #@74
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->finishTotal()V

    #@77
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->sendAttempts:Lcom/hcbiu/elcton/SendAttempts;

    #@79
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SendAttempts;->invalidate()V

    #@7c
    iput-boolean v3, v1, Lcom/hcbiu/elcton/SyncEngine;->awaitingReady:Z

    #@7e
    iget v0, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@80
    add-int/2addr v0, v5

    #@81
    iput v0, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@83
    iget v3, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@85
    new-instance v0, Lkotlin/jvm/internal/Ref$BooleanRef;

    #@87
    invoke-direct {v0}, Lkotlin/jvm/internal/Ref$BooleanRef;-><init>()V

    #@8a
    move-object v6, v0

    #@8b
    iput-boolean v5, v6, Lkotlin/jvm/internal/Ref$BooleanRef;->element:Z

    #@8d
    iget-object v7, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@8f
    invoke-virtual {v4}, Lcom/hcbiu/elcton/SyncDevice;->getId()Ljava/lang/String;

    #@92
    move-result-object v11

    #@93
    nop

    #@94
    nop

    #@95
    nop

    #@96
    const/16 v25, 0x7346

    #@98
    const/16 v26, 0x0

    #@9a
    const-string v8, "\u68c0\u67e5\u914d\u5957\u624b\u8868\u5e94\u7528"

    #@9c
    const/4 v9, 0x0

    #@9d
    const/4 v10, 0x0

    #@9e
    const/4 v12, 0x0

    #@9f
    const/4 v13, 0x1

    #@a0
    const/4 v14, 0x0

    #@a1
    const/4 v15, 0x0

    #@a2
    const-wide/16 v16, 0x0

    #@a4
    const/16 v18, 0x0

    #@a6
    const-string v19, ""

    #@a8
    const/16 v20, 0x0

    #@aa
    const/16 v21, 0x0

    #@ac
    const-wide/16 v22, 0x0

    #@ae
    const/16 v24, 0x0

    #@b0
    invoke-static/range {v7 .. v26}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@b3
    move-result-object v0

    #@b4
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@b7
    new-instance v0, Lcom/hcbiu/elcton/SyncEngine$connect$1;

    #@b9
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine$connect$1;-><init>(Lcom/hcbiu/elcton/SyncEngine;)V

    #@bc
    check-cast v0, Lkotlin/jvm/functions/Function0;

    #@be
    const-wide/16 v7, 0x3a98

    #@c0
    invoke-direct {v1, v7, v8, v0}, Lcom/hcbiu/elcton/SyncEngine;->deadline(JLkotlin/jvm/functions/Function0;)V

    #@c3
    nop

    #@c4
    :try_start_c4
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->transport:Lcom/hcbiu/elcton/SyncTransport;

    #@c6
    new-instance v7, Lcom/hcbiu/elcton/SyncEngine$connect$2;

    #@c8
    invoke-direct {v7, v1, v3, v6, v4}, Lcom/hcbiu/elcton/SyncEngine$connect$2;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;Lcom/hcbiu/elcton/SyncDevice;)V

    #@cb
    check-cast v7, Lkotlin/jvm/functions/Function1;

    #@cd
    new-instance v8, Lcom/hcbiu/elcton/SyncEngine$connect$3;

    #@cf
    invoke-direct {v8, v1, v3, v6}, Lcom/hcbiu/elcton/SyncEngine$connect$3;-><init>(Lcom/hcbiu/elcton/SyncEngine;ILkotlin/jvm/internal/Ref$BooleanRef;)V

    #@d2
    check-cast v8, Lkotlin/jvm/functions/Function1;

    #@d4
    invoke-interface {v0, v4, v7, v8}, Lcom/hcbiu/elcton/SyncTransport;->installed(Lcom/hcbiu/elcton/SyncDevice;Lkotlin/jvm/functions/Function1;Lkotlin/jvm/functions/Function1;)V
    :try_end_d7
    .catch Ljava/lang/Exception; {:try_start_c4 .. :try_end_d7} :catch_d8

    #@d7
    goto :goto_ee

    #@d8
    :catch_d8
    move-exception v0

    #@d9
    iget v7, v1, Lcom/hcbiu/elcton/SyncEngine;->generation:I

    #@db
    if-ne v3, v7, :cond_ee

    #@dd
    sget-object v7, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@df
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@e2
    move-result-object v8

    #@e3
    if-nez v8, :cond_e7

    #@e5
    const-string v8, ""

    #@e7
    :cond_e7
    invoke-virtual {v7, v8}, Lcom/hcbiu/elcton/UserFacingError;->explain(Ljava/lang/String;)Ljava/lang/String;

    #@ea
    move-result-object v7

    #@eb
    invoke-direct {v1, v7}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@ee
    :cond_ee
    :goto_ee
    return v5

    #@ef
    :cond_ef
    :goto_ef
    const-string v0, "\u8bf7\u5148\u67e5\u8be2\u5e76\u9009\u62e9\u771f\u5b9e\u914d\u5bf9\u8bbe\u5907\u3002"

    #@f1
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@f4
    return v3

    #@f5
    :cond_f5
    :goto_f5
    return v3
.end method

.method public final getState()Lcom/hcbiu/elcton/SyncEngine$State;
    .registers 2

    #@0
    iget-object v0, p0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@2
    return-object v0
.end method

.method public final publishSnapshot(Ljava/lang/String;ZLjava/lang/String;J)Z
    .registers 41

    #@0
    move-object/from16 v1, p0

    #@2
    move-object/from16 v2, p1

    #@4
    move-object/from16 v11, p3

    #@6
    const-string v0, "text"

    #@8
    invoke-static {v2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@b
    const-string v0, "datasetId"

    #@d
    invoke-static {v11, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@10
    iget-boolean v0, v1, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@12
    const/4 v12, 0x0

    #@13
    if-nez v0, :cond_12e

    #@15
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@17
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getReady()Z

    #@1a
    move-result v0

    #@1b
    if-eqz v0, :cond_12e

    #@1d
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@1f
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getBusy()Z

    #@22
    move-result v0

    #@23
    if-nez v0, :cond_12e

    #@25
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@27
    if-nez v0, :cond_2b

    #@29
    goto/16 :goto_12e

    #@2b
    :cond_2b
    :try_start_2b
    sget-object v0, Lcom/hcbiu/elcton/PhoneSnapshot;->INSTANCE:Lcom/hcbiu/elcton/PhoneSnapshot;

    #@2d
    invoke-virtual {v0, v2}, Lcom/hcbiu/elcton/PhoneSnapshot;->encode(Ljava/lang/String;)Ljava/lang/String;

    #@30
    move-result-object v0
    :try_end_31
    .catch Ljava/lang/Exception; {:try_start_2b .. :try_end_31} :catch_11f

    #@31
    move-object v13, v0

    #@32
    invoke-virtual {v13}, Ljava/lang/String;->length()I

    #@35
    move-result v0

    #@36
    iget-object v3, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@38
    invoke-virtual {v3}, Lcom/hcbiu/elcton/SyncEngine$State;->getMaxBytes()I

    #@3b
    move-result v3

    #@3c
    if-le v0, v3, :cond_44

    #@3e
    const-string v0, "\u8bfe\u8868\u8d85\u51fa\u5f53\u524d\u624b\u8868\u7684\u5b89\u5168\u63a5\u6536\u5bb9\u91cf\uff0c\u672a\u622a\u65ad\u6216\u53d1\u9001\u3002\u8bf7\u67e5\u770b\u517c\u5bb9\u62a5\u544a\u3002"

    #@40
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@43
    return v12

    #@44
    :cond_44
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@46
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getDatasetId()Ljava/lang/String;

    #@49
    move-result-object v0

    #@4a
    invoke-static {v0, v11}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@4d
    move-result v0

    #@4e
    const/4 v14, 0x1

    #@4f
    if-eqz v0, :cond_97

    #@51
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@53
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getDirty()Z

    #@56
    move-result v0

    #@57
    if-nez v0, :cond_97

    #@59
    iget-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@5b
    invoke-virtual {v0}, Lcom/hcbiu/elcton/SyncEngine$State;->getDigest()Ljava/lang/String;

    #@5e
    move-result-object v0

    #@5f
    sget-object v3, Lcom/hcbiu/elcton/Wire;->INSTANCE:Lcom/hcbiu/elcton/Wire;

    #@61
    invoke-virtual {v3, v13}, Lcom/hcbiu/elcton/Wire;->crc32(Ljava/lang/String;)Ljava/lang/String;

    #@64
    move-result-object v3

    #@65
    invoke-static {v0, v3}, Lkotlin/jvm/internal/Intrinsics;->areEqual(Ljava/lang/Object;Ljava/lang/Object;)Z

    #@68
    move-result v0

    #@69
    if-eqz v0, :cond_97

    #@6b
    iget-object v15, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@6d
    const/16 v33, 0x7ffc

    #@6f
    const/16 v34, 0x0

    #@71
    const-string v16, "\u5df2\u662f\u6700\u65b0\u8bfe\u8868"

    #@73
    const-string v17, "\u624b\u8868\u5185\u5bb9\u4e0e\u624b\u673a\u4e00\u81f4\uff0c\u65e0\u9700\u91cd\u590d\u5199\u5165\u3002"

    #@75
    const/16 v18, 0x0

    #@77
    const/16 v19, 0x0

    #@79
    const/16 v20, 0x0

    #@7b
    const/16 v21, 0x0

    #@7d
    const/16 v22, 0x0

    #@7f
    const/16 v23, 0x0

    #@81
    const-wide/16 v24, 0x0

    #@83
    const/16 v26, 0x0

    #@85
    const/16 v27, 0x0

    #@87
    const/16 v28, 0x0

    #@89
    const/16 v29, 0x0

    #@8b
    const-wide/16 v30, 0x0

    #@8d
    const/16 v32, 0x0

    #@8f
    invoke-static/range {v15 .. v34}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@92
    move-result-object v0

    #@93
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@96
    return v14

    #@97
    :cond_97
    nop

    #@98
    :try_start_98
    new-instance v0, Lcom/hcbiu/elcton/TransferSession;

    #@9a
    iget-object v3, v1, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@9c
    invoke-interface {v3}, Lcom/hcbiu/elcton/SyncScheduler;->wallTime()J

    #@9f
    move-result-wide v3

    #@a0
    const/16 v5, 0x24

    #@a2
    invoke-static {v5}, Lkotlin/text/CharsKt;->checkRadix(I)I

    #@a5
    move-result v5

    #@a6
    invoke-static {v3, v4, v5}, Ljava/lang/Long;->toString(JI)Ljava/lang/String;

    #@a9
    move-result-object v3

    #@aa
    const-string v4, "toString(...)"

    #@ac
    invoke-static {v3, v4}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@af
    new-instance v4, Ljava/lang/StringBuilder;

    #@b1
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    #@b4
    const-string v5, "t-"

    #@b6
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@b9
    move-result-object v4

    #@ba
    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@bd
    move-result-object v3

    #@be
    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@c1
    move-result-object v5

    #@c2
    const-wide/16 v3, 0x1

    #@c4
    move-wide/from16 v9, p4

    #@c6
    invoke-static {v3, v4, v9, v10}, Ljava/lang/Math;->max(JJ)J

    #@c9
    move-result-wide v7

    #@ca
    iget-object v3, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@cc
    invoke-virtual {v3}, Lcom/hcbiu/elcton/SyncEngine$State;->getDigest()Ljava/lang/String;

    #@cf
    move-result-object v15

    #@d0
    move-object v3, v0

    #@d1
    move-object v4, v13

    #@d2
    move-object/from16 v6, p3

    #@d4
    move-object v9, v15

    #@d5
    move/from16 v10, p2

    #@d7
    invoke-direct/range {v3 .. v10}, Lcom/hcbiu/elcton/TransferSession;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JLjava/lang/String;Z)V

    #@da
    iput-object v0, v1, Lcom/hcbiu/elcton/SyncEngine;->session:Lcom/hcbiu/elcton/TransferSession;

    #@dc
    const-string v0, "\u540c\u6b65\u603b\u65f6\u9650\u5df2\u5230\u3002\u8bf7\u91cd\u65b0\u8fde\u63a5\u6838\u5bf9\u624b\u8868\u6700\u7ec8\u7248\u672c\uff1b\u672a\u628a\u53d1\u9001\u6210\u529f\u5f53\u4f5c\u4fdd\u5b58\u6210\u529f\u3002"

    #@de
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->beginTotal(Ljava/lang/String;)V

    #@e1
    iget-object v15, v1, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@e3
    const-string v16, "\u6b63\u5728\u540c\u6b65"

    #@e5
    const-string v17, "\u7b49\u5f85\u624b\u8868\u786e\u8ba4\u63a5\u6536\uff0c\u65e7\u8bfe\u8868\u5c1a\u672a\u66ff\u6362\u3002"

    #@e7
    const/16 v33, 0x7fdc

    #@e9
    const/16 v34, 0x0

    #@eb
    const/16 v18, 0x0

    #@ed
    const/16 v19, 0x0

    #@ef
    const/16 v20, 0x0

    #@f1
    const/16 v21, 0x1

    #@f3
    const/16 v22, 0x0

    #@f5
    const/16 v23, 0x0

    #@f7
    const-wide/16 v24, 0x0

    #@f9
    const/16 v26, 0x0

    #@fb
    const/16 v27, 0x0

    #@fd
    const/16 v28, 0x0

    #@ff
    const/16 v29, 0x0

    #@101
    const-wide/16 v30, 0x0

    #@103
    const/16 v32, 0x0

    #@105
    invoke-static/range {v15 .. v34}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@108
    move-result-object v0

    #@109
    invoke-direct {v1, v0}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@10c
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->transmitCurrent()V
    :try_end_10f
    .catch Ljava/lang/Exception; {:try_start_98 .. :try_end_10f} :catch_110

    #@10f
    return v14

    #@110
    :catch_110
    move-exception v0

    #@111
    sget-object v3, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@113
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@116
    move-result-object v4

    #@117
    invoke-virtual {v3, v4}, Lcom/hcbiu/elcton/UserFacingError;->validation(Ljava/lang/String;)Ljava/lang/String;

    #@11a
    move-result-object v3

    #@11b
    invoke-direct {v1, v3}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@11e
    return v12

    #@11f
    :catch_11f
    move-exception v0

    #@120
    sget-object v3, Lcom/hcbiu/elcton/UserFacingError;->INSTANCE:Lcom/hcbiu/elcton/UserFacingError;

    #@122
    invoke-virtual {v0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    #@125
    move-result-object v4

    #@126
    invoke-virtual {v3, v4}, Lcom/hcbiu/elcton/UserFacingError;->validation(Ljava/lang/String;)Ljava/lang/String;

    #@129
    move-result-object v3

    #@12a
    invoke-direct {v1, v3}, Lcom/hcbiu/elcton/SyncEngine;->fail(Ljava/lang/String;)V

    #@12d
    return v12

    #@12e
    :cond_12e
    :goto_12e
    return v12
.end method

.method public final requestExport()Z
    .registers 23

    #@0
    move-object/from16 v0, p0

    #@2
    iget-boolean v1, v0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@4
    const/4 v2, 0x0

    #@5
    if-nez v1, :cond_79

    #@7
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@9
    invoke-virtual {v1}, Lcom/hcbiu/elcton/SyncEngine$State;->getReady()Z

    #@c
    move-result v1

    #@d
    if-eqz v1, :cond_79

    #@f
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@11
    invoke-virtual {v1}, Lcom/hcbiu/elcton/SyncEngine$State;->getBusy()Z

    #@14
    move-result v1

    #@15
    if-nez v1, :cond_79

    #@17
    iget-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->peer:Lcom/hcbiu/elcton/SyncDevice;

    #@19
    if-nez v1, :cond_1c

    #@1b
    goto :goto_79

    #@1c
    :cond_1c
    new-instance v1, Lcom/hcbiu/elcton/ExportSession;

    #@1e
    iget-object v3, v0, Lcom/hcbiu/elcton/SyncEngine;->scheduler:Lcom/hcbiu/elcton/SyncScheduler;

    #@20
    invoke-interface {v3}, Lcom/hcbiu/elcton/SyncScheduler;->wallTime()J

    #@23
    move-result-wide v3

    #@24
    const/16 v5, 0x24

    #@26
    invoke-static {v5}, Lkotlin/text/CharsKt;->checkRadix(I)I

    #@29
    move-result v5

    #@2a
    invoke-static {v3, v4, v5}, Ljava/lang/Long;->toString(JI)Ljava/lang/String;

    #@2d
    move-result-object v3

    #@2e
    const-string v4, "toString(...)"

    #@30
    invoke-static {v3, v4}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullExpressionValue(Ljava/lang/Object;Ljava/lang/String;)V

    #@33
    new-instance v4, Ljava/lang/StringBuilder;

    #@35
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    #@38
    const-string v5, "e-"

    #@3a
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@3d
    move-result-object v4

    #@3e
    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    #@41
    move-result-object v3

    #@42
    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    #@45
    move-result-object v3

    #@46
    invoke-direct {v1, v3}, Lcom/hcbiu/elcton/ExportSession;-><init>(Ljava/lang/String;)V

    #@49
    iput-object v1, v0, Lcom/hcbiu/elcton/SyncEngine;->exporting:Lcom/hcbiu/elcton/ExportSession;

    #@4b
    iput v2, v0, Lcom/hcbiu/elcton/SyncEngine;->exportRetries:I

    #@4d
    const-string v1, "\u56de\u4f20\u603b\u65f6\u9650\u5df2\u5230\uff0c\u624b\u673a\u8bfe\u8868\u672a\u81ea\u52a8\u6539\u53d8\u3002\u8bf7\u91cd\u65b0\u8fde\u63a5\u518d\u53d6\u56de\u3002"

    #@4f
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->beginTotal(Ljava/lang/String;)V

    #@52
    iget-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@54
    const/16 v20, 0x7fdc

    #@56
    const/16 v21, 0x0

    #@58
    const-string v3, "\u4ece\u624b\u8868\u8bfb\u53d6\u8bfe\u8868"

    #@5a
    const-string v4, "\u624b\u673a\u5df2\u6709\u8bfe\u8868\u4e0d\u4f1a\u81ea\u52a8\u66ff\u6362\u3002"

    #@5c
    const/4 v5, 0x0

    #@5d
    const/4 v6, 0x0

    #@5e
    const/4 v7, 0x0

    #@5f
    const/4 v8, 0x1

    #@60
    const/4 v9, 0x0

    #@61
    const/4 v10, 0x0

    #@62
    const-wide/16 v11, 0x0

    #@64
    const/4 v13, 0x0

    #@65
    const/4 v14, 0x0

    #@66
    const/4 v15, 0x0

    #@67
    const/16 v16, 0x0

    #@69
    const-wide/16 v17, 0x0

    #@6b
    const/16 v19, 0x0

    #@6d
    invoke-static/range {v2 .. v21}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@70
    move-result-object v1

    #@71
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@74
    invoke-direct/range {p0 .. p0}, Lcom/hcbiu/elcton/SyncEngine;->requestExportPacket()V

    #@77
    const/4 v1, 0x1

    #@78
    return v1

    #@79
    :cond_79
    :goto_79
    return v2
.end method

.method public final updateDiagnostic(Ljava/lang/String;)V
    .registers 24

    #@0
    move-object/from16 v0, p0

    #@2
    const-string v1, "full"

    #@4
    move-object/from16 v15, p1

    #@6
    invoke-static {v15, v1}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    #@9
    iget-boolean v1, v0, Lcom/hcbiu/elcton/SyncEngine;->closed:Z

    #@b
    if-nez v1, :cond_2e

    #@d
    iget-object v2, v0, Lcom/hcbiu/elcton/SyncEngine;->state:Lcom/hcbiu/elcton/SyncEngine$State;

    #@f
    const/16 v20, 0x6fff

    #@11
    const/16 v21, 0x0

    #@13
    const/4 v3, 0x0

    #@14
    const/4 v4, 0x0

    #@15
    const/4 v5, 0x0

    #@16
    const/4 v6, 0x0

    #@17
    const/4 v7, 0x0

    #@18
    const/4 v8, 0x0

    #@19
    const/4 v9, 0x0

    #@1a
    const/4 v10, 0x0

    #@1b
    const-wide/16 v11, 0x0

    #@1d
    const/4 v13, 0x0

    #@1e
    const/4 v14, 0x0

    #@1f
    const/4 v1, 0x0

    #@20
    move v15, v1

    #@21
    const-wide/16 v17, 0x0

    #@23
    const/16 v19, 0x0

    #@25
    move-object/from16 v16, p1

    #@27
    invoke-static/range {v2 .. v21}, Lcom/hcbiu/elcton/SyncEngine$State;->copy$default(Lcom/hcbiu/elcton/SyncEngine$State;Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Ljava/lang/String;ZZLjava/lang/String;ZJILjava/lang/String;ZLjava/lang/String;JLjava/lang/Boolean;ILjava/lang/Object;)Lcom/hcbiu/elcton/SyncEngine$State;

    #@2a
    move-result-object v1

    #@2b
    invoke-direct {v0, v1}, Lcom/hcbiu/elcton/SyncEngine;->publish(Lcom/hcbiu/elcton/SyncEngine$State;)V

    #@2e
    :cond_2e
    return-void
.end method
