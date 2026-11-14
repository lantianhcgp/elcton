package com.hcbiu.elcton

/** Device facts copied from the SDK, never inferred from model names. */
data class SyncDevice(
    val id: String,
    val name: String = "",
    val model: String = "",
    val connected: Boolean = false,
    val p2pCapability: Int = 0
)

interface SyncTransport {
    fun checkPermission(success: (Boolean) -> Unit, failure: (String) -> Unit)
    fun requestPermission(success: (Boolean) -> Unit, failure: (String) -> Unit): Boolean
    fun scan(success: (List<SyncDevice>) -> Unit, failure: (String) -> Unit)
    fun installed(device: SyncDevice, success: (Boolean) -> Unit, failure: (String) -> Unit)
    fun register(device: SyncDevice, message: (String) -> Unit, success: () -> Unit, failure: (String) -> Unit)
    fun unregister()
    fun send(device: SyncDevice, text: String, result: (Int) -> Unit, failure: (String) -> Unit)
}

fun interface SyncCancellation { fun cancel() }

interface SyncScheduler {
    fun post(block: () -> Unit)
    fun after(ms: Long, block: () -> Unit): SyncCancellation
    fun now(): Long
    fun wallTime(): Long
}

interface SyncBaselines {
    fun lastSuccess(deviceId: String): Long
    fun save(deviceId: String, datasetId: String, digest: String, revision: Long, at: Long)
}

/** One application-owned protocol state. Calls are serialized by the owning runtime. */
class SyncEngine(
    private val transport: SyncTransport,
    private val scheduler: SyncScheduler,
    private val baselines: SyncBaselines,
    private val update: (State) -> Unit,
    private val importCandidate: (String, Long) -> Unit
) {
    data class State(
        val status: String = "尚未连接手表",
        val detail: String = "通过华为运动健康配对后，查询可用设备。",
        val devices: List<SyncDevice> = emptyList(),
        val selected: String = "",
        val ready: Boolean = false,
        val busy: Boolean = false,
        val digest: String = "",
        val dirty: Boolean = false,
        val revision: Long = 0,
        val maxBytes: Int = 8192,
        val datasetId: String = "",
        val hasData: Boolean = false,
        val diagnostic: String = "",
        val lastSuccessAt: Long = 0,
        val permissionGranted: Boolean? = null
    )

    var state = State()
        private set
    private var generation = 0
    private var closed = false
    private var peer: SyncDevice? = null
    private var timer: SyncCancellation? = null
    private var timerSerial = 0L
    private var handshakeAttempts = 0
    private var awaitingReady = false
    private var session: TransferSession? = null
    private var exporting: ExportSession? = null
    private var exportRetries = 0
    private val sendAttempts = SendAttempts()
    private val total = OperationDeadline()
    private var totalTimer: SyncCancellation? = null
    private var totalSerial = 0L

    private fun publish(next: State) { state = next; update(next) }
    private fun finishTotal() { totalSerial++; totalTimer?.cancel(); totalTimer = null; total.clear() }
    private fun beginTotal(message: String) {
        finishTotal(); total.begin(scheduler.now(), 45_000)
        val gen = generation
        val serial = totalSerial
        totalTimer = scheduler.after(45_000) { main(gen) {
            if (serial == totalSerial && total.expired(scheduler.now())) fail(message)
        } }
    }
    private fun main(gen: Int, block: () -> Unit) = scheduler.post {
        if (!closed && gen == generation) block()
    }
    private fun cancelTimer() { timerSerial++; timer?.cancel(); timer = null }
    private fun deadline(ms: Long, block: () -> Unit) {
        cancelTimer()
        val gen = generation
        val serial = timerSerial
        timer = scheduler.after(ms) { main(gen) { if (serial == timerSerial) block() } }
    }
    private fun unregister() { transport.unregister(); peer = null }
    private fun fail(message: String) {
        generation++; sendAttempts.invalidate(); cancelTimer(); finishTotal(); session = null; exporting = null; awaitingReady = false; unregister()
        publish(state.copy(status = "操作未完成", detail = message.take(200), selected = "", ready = false, busy = false))
    }

    fun authorizeAndScan(interactive: Boolean = false): Boolean {
        if (closed || state.busy) return false
        unregister(); cancelTimer(); finishTotal(); sendAttempts.invalidate(); awaitingReady = false
        val gen = ++generation
        var checking = true
        publish(state.copy(status = "检查设备授权", selected = "", busy = true, ready = false, diagnostic = ""))
        deadline(20_000) { fail("授权检查超时。请打开运动健康，确认已登录并保持手表连接。") }
        try {
            transport.checkPermission({ granted -> main(gen) {
                if (!checking) return@main
                checking = false
                publish(state.copy(permissionGranted = granted))
                if (granted) scan(gen)
                else if (!interactive) permissionRequired()
                else {
                    var requesting = true
                    publish(state.copy(status = "等待你确认授权", busy = true))
                    deadline(90_000) { fail("授权未完成，没有查询或传输课表。") }
                    try {
                        val accepted = transport.requestPermission({ allowed -> main(gen) {
                            if (!requesting) return@main
                            requesting = false
                            publish(state.copy(permissionGranted = allowed))
                            if (allowed) scan(gen) else fail("设备权限未获准或已取消授权，没有传输课表。")
                        } }, { message -> main(gen) { if (requesting) { requesting = false; fail(message) } } })
                        if (!accepted) { requesting = false; permissionRequired() }
                    } catch (error: Exception) { if (gen == generation) fail(UserFacingError.explain(error.message.orEmpty())) }
                }
            } }, { message -> main(gen) { if (checking) { checking = false; fail(message) } } })
        } catch (error: Exception) { if (gen == generation) fail(UserFacingError.explain(error.message.orEmpty())) }
        return true
    }

    private fun permissionRequired() {
        cancelTimer()
        publish(state.copy(status = "需要设备授权", detail = "需要用户在可见页面确认设备授权，后台不会弹出授权窗口。",
            permissionGranted = false, busy = false, ready = false))
    }

    private fun scan(gen: Int) {
        var pending = true
        publish(state.copy(status = "查询配对设备", busy = true))
        deadline(15_000) { fail("设备查询超时，请检查运动健康的连接状态。") }
        try {
            transport.scan({ found -> main(gen) {
                if (!pending) return@main
                pending = false; cancelTimer()
                val devices = found.toList()
                publish(state.copy(
                    status = if (devices.isEmpty()) "未找到可用设备" else "选择要同步的手表",
                    detail = if (devices.isEmpty()) "确认运动健康已配对且设备支持应用间通信。" else "设备按实际通信能力判断，不限定 FIT3 型号。",
                    devices = devices, busy = false
                ))
            } }, { message -> main(gen) { if (pending) { pending = false; fail(message) } } })
        } catch (error: Exception) { if (gen == generation) fail(UserFacingError.explain(error.message.orEmpty())) }
    }

    fun connect(deviceId: String): Boolean {
        if (closed || state.busy) return false
        val selected = state.devices.firstOrNull { it.id == deviceId }
        if (selected == null || selected.id.isEmpty()) { fail("请先查询并选择真实配对设备。"); return false }
        // Values are the SDK's documented capability codes: SUPPORT=0, NOT_SUPPORT=1.
        if (!DevicePolicy.canAttemptSync(selected.connected, selected.p2pCapability, 0, 1)) {
            fail("设备未连接，或明确不支持应用间通信。"); return false
        }
        unregister(); cancelTimer(); finishTotal(); sendAttempts.invalidate(); awaitingReady = false
        val gen = ++generation
        var installing = true
        publish(state.copy(status = "检查配套手表应用", selected = selected.id, busy = true, ready = false,
            dirty = false, datasetId = "", hasData = false))
        deadline(15_000) { fail("检查手表应用超时，请确认运动健康仍连接。") }
        try {
            transport.installed(selected, { installed -> main(gen) {
                if (!installing) return@main
                installing = false
                if (!installed) {
                    fail("这台手表没有安装匹配的课程表应用。不同系统运行时需要对应安装包，不能强装 Lite 包。")
                    return@main
                }
                peer = selected
                var registering = true
                deadline(15_000) { fail("接收器注册超时，未发送课表。") }
                try {
                    transport.register(selected, { raw -> main(gen) { onMessage(raw) } }, { scheduler.post {
                        if (closed || gen != generation) {
                            // The adapter owns exact native cleanup. A global fallback is only
                            // safe while no replacement receiver OR scan can be current.
                            if (peer == null && state.selected.isEmpty() && !state.busy) transport.unregister()
                            return@post
                        }
                        if (!registering) return@post
                        registering = false; handshakeAttempts = 0; awaitingReady = true
                        publish(state.copy(status = "等待手表准备", detail = "可在手表进入：周视图 → 同步 → 开始接收。手机正在尝试检测对端。"))
                        hello()
                    } }, { message -> main(gen) { if (registering) { registering = false; fail(message) } } })
                } catch (error: Exception) { if (gen == generation) fail(UserFacingError.explain(error.message.orEmpty())) }
            } }, { message -> main(gen) { if (installing) { installing = false; fail(message) } } })
        } catch (error: Exception) { if (gen == generation) fail(UserFacingError.explain(error.message.orEmpty())) }
        return true
    }

    private fun hello() {
        if (peer == null) { fail("请先连接设备。"); return }
        deadline(5_000) {
            if (++handshakeAttempts <= 3) hello()
            else fail("未收到手表准备回执；还没有发送课表。若表端已经开始接收，请记录同步页的 SDK/REG/HELLO/READY 阶段或错误码，不是再次点击接收即可解决。")
        }
        send("{" + Wire.header("HELLO", "") + "}")
    }

    private fun onMessage(raw: String) {
        val message = PacketIngress.watch(raw) ?: return
        val type = message.optString("type")
        PacketIngress.preparationError(message, awaitingReady, session != null || exporting != null)?.let { fail(it); return }
        val export = exporting
        if (export != null) {
            if (message.optString("transferId") != export.id) return
            if (type == "ERROR") {
                fail("手表导出失败：${message.optString("code")}，手机课表没有改变。"); return
            }
            if (type == "EXPORT_META") {
                if (!export.meta(export.id, message.optInt("length"), message.optString("digest"),
                        message.optInt("chunks"), message.optLong("sourceRevision"))) return
                exportRetries = 0; requestExportPacket(); return
            }
            if (type == "EXPORT_CHUNK") {
                if (!export.chunk(export.id, message.optInt("seq", -1), message.optString("data"))) return
                cancelTimer(); exportRetries = 0
                if (export.error != null) { fail("手表导出内容校验失败，手机旧课表保留。"); return }
                val result = export.result
                if (result != null) {
                    val validated = try { PhoneSnapshot.encode(result) }
                        catch (error: Exception) { fail("手表导出格式无效：${UserFacingError.validation(error.message)}"); return }
                    finishTotal(); sendAttempts.invalidate()
                    send("{" + Wire.header("EXPORT_DONE", export.id) + "}", reportFailure = false)
                    exporting = null
                    publish(state.copy(status = "手表课表已取回", detail = "请在导入预览中决定是否替换手机课表。", busy = false))
                    importCandidate(validated, export.sourceRevision)
                } else requestExportPacket()
            }
            return
        }
        if (type == "READY" && session == null && awaitingReady) {
            awaitingReady = false; cancelTimer(); sendAttempts.invalidate()
            publish(state.copy(status = "手表已准备", detail = "可以同步手机课表，或先导入手表已有课表。",
                ready = true, busy = false, digest = message.optString("digest"), dirty = message.optBoolean("localDirty"),
                revision = message.optLong("sourceRevision"), maxBytes = message.optInt("maxBytes"),
                datasetId = message.optString("datasetId"), hasData = message.optBoolean("hasData"),
                lastSuccessAt = baselines.lastSuccess(state.selected)))
            return
        }
        val current = session ?: return
        if (!current.reply(type, message.optString("transferId"), message.optInt("seq", -99),
                message.optString("digest"), message.optLong("sourceRevision"), message.optString("code"))) return
        cancelTimer(); sendAttempts.invalidate()
        if (current.complete) {
            finishTotal(); session = null
            val now = scheduler.wallTime()
            baselines.save(state.selected, current.datasetId, current.digest, current.revision, now)
            publish(state.copy(status = "同步成功", detail = "手表已保存并读回确认。", busy = false,
                digest = current.digest, dirty = false, revision = current.revision, datasetId = current.datasetId,
                hasData = true, lastSuccessAt = now))
        } else if (current.error != null) {
            fail("手表未确认本次提交（${current.error}）。请重新连接核对最终课表，不把取消或发送回执当作回滚证据。")
        } else transmitCurrent()
    }

    fun publishSnapshot(text: String, force: Boolean, datasetId: String, revision: Long): Boolean {
        if (closed || !state.ready || state.busy || peer == null) return false
        val validated = try { PhoneSnapshot.encode(text) }
            catch (error: Exception) { fail(UserFacingError.validation(error.message)); return false }
        if (validated.length > state.maxBytes) {
            fail("课表超出当前手表的安全接收容量，未截断或发送。请查看兼容报告。"); return false
        }
        if (state.datasetId == datasetId && !state.dirty && state.digest == Wire.crc32(validated)) {
            publish(state.copy(status = "已是最新课表", detail = "手表内容与手机一致，无需重复写入。")); return true
        }
        try {
            session = TransferSession(validated, "t-" + scheduler.wallTime().toString(36), datasetId,
                maxOf(1L, revision), state.digest, force)
            beginTotal("同步总时限已到。请重新连接核对手表最终版本；未把发送成功当作保存成功。")
            publish(state.copy(status = "正在同步", detail = "等待手表确认接收，旧课表尚未替换。", busy = true))
            transmitCurrent()
        } catch (error: Exception) { fail(UserFacingError.validation(error.message)); return false }
        return true
    }

    private fun transmitCurrent() {
        val current = session ?: return
        publish(state.copy(status = if (current.acceptedChunks == current.chunkCount) "正在校验保存" else "正在同步",
            detail = "已确认 ${current.acceptedChunks}/${current.chunkCount} 包；收到保存回执才算完成。"))
        deadline(5_000) {
            if (session === current) {
                if (current.timeout()) transmitCurrent()
                else fail("保存回执超时。重新连接可核对最终版本，未把发送成功当作保存成功。")
            }
        }
        current.currentMessage?.let { send(it) }
    }

    fun requestExport(): Boolean {
        if (closed || !state.ready || state.busy || peer == null) return false
        exporting = ExportSession("e-" + scheduler.wallTime().toString(36)); exportRetries = 0
        beginTotal("回传总时限已到，手机课表未自动改变。请重新连接再取回。")
        publish(state.copy(status = "从手表读取课表", detail = "手机已有课表不会自动替换。", busy = true))
        requestExportPacket()
        return true
    }

    private fun requestExportPacket() {
        val export = exporting ?: return
        val type = if (export.initialized) "EXPORT_NEXT" else "EXPORT_REQUEST"
        deadline(5_000) {
            if (exporting === export) {
                if (exportRetries++ < 3) requestExportPacket() else fail("手表回传超时，手机课表未改变。")
            }
        }
        send("{" + Wire.header(type, export.id) + (if (export.initialized) ",\"seq\":" + export.nextSequence else "") + "}")
    }

    fun cancel() {
        if (closed) return
        val id = session?.transferId ?: exporting?.id
        if (id != null) send("{" + Wire.header("CANCEL", id) + "}", reportFailure = false)
        generation++; sendAttempts.invalidate(); cancelTimer(); finishTotal()
        session = null; exporting = null; awaitingReady = false; unregister()
        publish(state.copy(status = "已断开", selected = "", busy = false, ready = false,
            detail = "已停止等待回执；若已进入保存阶段，请重新连接核对最终课表。手机不会自动导入或合并。"))
    }

    fun close() { if (!closed) { cancel(); closed = true } }

    fun updateDiagnostic(full: String) { if (!closed) publish(state.copy(diagnostic = full)) }

    private fun send(text: String, reportFailure: Boolean = true) {
        val device = peer ?: return
        val gen = generation
        val attempt = sendAttempts.issue()
        if (text.length > 1024 || text.any { it.code !in 32..126 }) {
            if (reportFailure) fail("消息超出传输上限，未发送。")
            return
        }
        fun accepts() = gen == generation && sendAttempts.accepts(attempt)
        try {
            transport.send(device, text, { code -> main(gen) {
                if (!accepts()) return@main
                if (code != 207) {
                    if (reportFailure) fail("Wear Engine 发送失败（$code），没有成功保存证据。")
                } else session?.transportSucceeded()
            } }, { message -> main(gen) { if (reportFailure && accepts()) fail(message) } })
        } catch (error: Exception) { if (reportFailure && accepts()) fail(UserFacingError.explain(error.message.orEmpty())) }
    }
}
