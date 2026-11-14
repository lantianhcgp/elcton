package com.hcbiu.elcton

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.WearEngineException
import com.huawei.wearengine.auth.AuthCallback
import com.huawei.wearengine.auth.Permission
import com.huawei.wearengine.device.Device
import com.huawei.wearengine.p2p.Message
import com.huawei.wearengine.p2p.Receiver
import com.huawei.wearengine.p2p.SendCallback
import java.lang.ref.WeakReference

/** Application-context SDK boundary. All protocol decisions belong to the ONE [engine]. */
class WearProbe(context: Context, private val diagnostics: DiagnosticRuntime) : SyncTransport {
    private val context: Context = context.applicationContext
    private val handler = Handler(Looper.getMainLooper())
    private val p2p by lazy { HiWear.getP2pClient(this.context) }
    private var activity = WeakReference<Activity>(null)
    private var update: (SyncEngine.State) -> Unit = {}
    private var importCandidate: (String, Long) -> Unit = { _, _ -> }
    private val lock = Any()
    private val devices = mutableMapOf<String, Device>()
    private var scanGeneration = 0L
    private var nativeGeneration = 0L
    private var registration: NativeRegistration? = null
    private var latestDiagnostic = ""

    private class NativeRegistration(val generation: Long, val receiver: Receiver)

    constructor(context: Context, update: (SyncEngine.State) -> Unit, importCandidate: (String, Long) -> Unit) :
        this(context, (context.applicationContext as ElctonApplication).diagnostics) {
        this.update = update
        this.importCandidate = importCandidate
    }

    private val sharedEngine = lazy {
        val baselines = this.context.getSharedPreferences("device-baselines", Context.MODE_PRIVATE)
        SyncEngine(this, object : SyncScheduler {
            override fun post(block: () -> Unit) { handler.post { block() } }
            override fun after(ms: Long, block: () -> Unit): SyncCancellation {
                val runnable = Runnable { block() }
                handler.postDelayed(runnable, ms)
                return SyncCancellation { handler.removeCallbacks(runnable) }
            }
            override fun now() = SystemClock.elapsedRealtime()
            override fun wallTime() = System.currentTimeMillis()
        }, object : SyncBaselines {
            override fun lastSuccess(deviceId: String) = baselines.getLong(deviceId + ".at", 0)
            override fun save(deviceId: String, datasetId: String, digest: String, revision: Long, at: Long) {
                baselines.edit().putString(deviceId + ".dataset", datasetId).putString(deviceId + ".digest", digest)
                    .putLong(deviceId + ".revision", revision).putLong(deviceId + ".at", at).apply()
            }
        }, { state ->
            update(state)
            try { diagnostics.observe(state.status, state.detail, state.ready, state.busy, state.devices.size) }
            catch (_: Exception) {}
        }, { text, revision -> importCandidate(text, revision) })
    }

    val engine: SyncEngine get() = sharedEngine.value
    val state: SyncEngine.State get() = engine.state

    fun attach(activity: Activity) { this.activity = WeakReference(activity) }
    fun detach(activity: Activity) { if (this.activity.get() === activity) clearActivity() }
    fun clearActivity() { activity.clear() }
    fun authorizeAndScan(interactive: Boolean = false, activity: Activity? = null): Boolean {
        if (interactive) {
            if (activity != null) attach(activity) else clearActivity()
        }
        return engine.authorizeAndScan(interactive)
    }
    fun connect(deviceId: String): Boolean = engine.connect(deviceId)
    fun connect(device: SyncDevice): Boolean = engine.connect(device.id)
    fun publishSnapshot(text: String, force: Boolean, datasetId: String, revision: Long): Boolean =
        engine.publishSnapshot(text, force, datasetId, revision)
    fun requestExport(): Boolean = engine.requestExport()
    fun cancel() = engine.cancel()
    fun close() { engine.close(); clearActivity() }

    private val watchPackage="watchapp.nexus.0zzip"
    // Lite identity: bundleName + '_' + Base64(SEC1 uncompressed certificate EC point), not a cert hash/SPKI.
    private val watchFingerprint="watchapp.nexus.0zzip_BOc6BPXgVZY7Ik7lETcDy6ezKw77Dqm0EDBscNFv9kHcXaW7gXBRQmA8RfLcDvcCLkOSQIsB33zj/s2IS6u5utM="
    private fun identify() { p2p.setPeerPkgName(watchPackage).setPeerFingerPrint(watchFingerprint) }

    override fun checkPermission(success: (Boolean) -> Unit, failure: (String) -> Unit) {
        try {
            HiWear.getAuthClient(context).checkPermission(Permission.DEVICE_MANAGER)
                .addOnSuccessListener { success(it == true) }
                .addOnFailureListener { failure(describe(it, "checkPermission")) }
        } catch (error: Exception) { failure(describe(error, "checkPermission")) }
    }

    /** Never launches an Activity. Only an explicitly supplied, still-visible weak reference can authorize. */
    override fun requestPermission(success: (Boolean) -> Unit, failure: (String) -> Unit): Boolean {
        val visible = activity.get() ?: return false
        if (visible.isFinishing || visible.isDestroyed) return false
        try {
            // Only the permission UI client uses Activity; every background client uses application Context.
            HiWear.getAuthClient(visible).requestPermission(object : AuthCallback {
                override fun onOk(permissions: Array<Permission>) {
                    success(permissions.any { it.name == Permission.DEVICE_MANAGER.name })
                }
                override fun onCancel() { success(false) }
            }, Permission.DEVICE_MANAGER).addOnFailureListener { failure(describe(it, "requestPermission")) }
        } catch (error: Exception) { failure(describe(error, "requestPermission")) }
        return true
    }

    override fun scan(success: (List<SyncDevice>) -> Unit, failure: (String) -> Unit) {
        val generation = synchronized(lock) { ++scanGeneration }
        try {
            HiWear.getDeviceClient(context).commonDevice.addOnSuccessListener { found ->
                try {
                    val byId = linkedMapOf<String, Device>()
                    val result = linkedMapOf<String, SyncDevice>()
                    for (device in found.orEmpty()) {
                        val id = device.uuid.orEmpty()
                        if (id.isEmpty()) continue
                        byId[id] = device
                        result[id] = SyncDevice(id, device.name.orEmpty(), device.model.orEmpty(), device.isConnected, device.p2pCapability)
                    }
                    val current = synchronized(lock) {
                        if (generation != scanGeneration) false
                        else { devices.clear(); devices.putAll(byId); true }
                    }
                    if (current) success(result.values.toList())
                } catch (error: Exception) { failure(describe(error, "getCommonDevice")) }
            }.addOnFailureListener { failure(describe(it, "getCommonDevice")) }
        } catch (error: Exception) { failure(describe(error, "getCommonDevice")) }
    }

    private fun native(device: SyncDevice): Device? = synchronized(lock) { devices[device.id] }

    override fun installed(device: SyncDevice, success: (Boolean) -> Unit, failure: (String) -> Unit) {
        val selected = native(device)
        if (selected == null) { failure("设备列表已改变，请重新查询真实配对设备。"); return }
        try {
            identify()
            p2p.isAppInstalled(selected, watchPackage).addOnSuccessListener { success(it == true) }
                .addOnFailureListener { failure(describe(it, "isAppInstalled")) }
        } catch (error: Exception) { failure(describe(error, "isAppInstalled")) }
    }

    override fun register(device: SyncDevice, message: (String) -> Unit, success: () -> Unit, failure: (String) -> Unit) {
        val selected = native(device)
        if (selected == null) { failure("设备列表已改变，请重新查询真实配对设备。"); return }
        unregister()
        val generation = synchronized(lock) { nativeGeneration }
        val receiver = Receiver { packet ->
            val current = synchronized(lock) { registration?.generation == generation && nativeGeneration == generation }
            if (current && packet.type == Message.MESSAGE_TYPE_DATA) {
                val bytes = packet.data
                if (bytes != null && bytes.size <= 1024 && bytes.all { it.toInt() in 32..126 }) {
                    message(bytes.toString(Charsets.US_ASCII))
                }
            }
        }
        val item = NativeRegistration(generation, receiver)
        synchronized(lock) { registration = item }
        try {
            identify()
            p2p.registerReceiver(selected, receiver).addOnSuccessListener {
                // Cleanup is keyed to the exact callback, not whichever receiver is current now.
                val current = synchronized(lock) { registration === item && generation == nativeGeneration }
                if (current) success() else release(receiver)
            }.addOnFailureListener { error ->
                val current = synchronized(lock) {
                    if (registration === item && generation == nativeGeneration) { registration = null; true } else false
                }
                release(receiver)
                if (current) failure(describe(error, "registerReceiver"))
            }
        } catch (error: Exception) {
            synchronized(lock) { if (registration === item) registration = null }
            release(receiver)
            failure(describe(error, "registerReceiver"))
        }
    }

    override fun unregister() {
        val old = synchronized(lock) {
            nativeGeneration++; scanGeneration++
            registration.also { registration = null }
        }
        old?.let { release(it.receiver) }
    }

    private fun release(receiver: Receiver) {
        try { p2p.unregisterReceiver(receiver).addOnFailureListener { describe(it, "unregisterReceiver") } }
        catch (error: Exception) { describe(error, "unregisterReceiver") }
    }

    override fun send(device: SyncDevice, text: String, result: (Int) -> Unit, failure: (String) -> Unit) {
        val selected = native(device)
        if (selected == null) { failure("设备列表已改变，请重新查询真实配对设备。"); return }
        if (text.length > 1024 || text.any { it.code !in 32..126 }) { failure("消息超出传输上限，未发送。"); return }
        try {
            p2p.send(selected, Message.Builder().setPayload(text.toByteArray(Charsets.US_ASCII)).build(), object : SendCallback {
                override fun onSendResult(code: Int) { result(code) }
                override fun onSendProgress(progress: Long) {}
            }).addOnFailureListener { failure(describe(it, "p2p.send")) }
        } catch (error: Exception) { failure(describe(error, "p2p.send")) }
    }

    private fun describe(e: Exception, phase: String): String {
        // Keep the original primary message read singular; observability cannot gate the failure callback.
        val message = e.message
        try {
            val record = WearErrorRecord.captureWithMessage(e, phase, System.currentTimeMillis(), message) { cause ->
                (cause as? WearEngineException)?.errorCode
            }
            val raw = record.full
            latestDiagnostic = raw
            Log.w("ElctonWear", raw)
            try { diagnostics.record(record) } catch (_: Exception) {}
            // Diagnostics change no protocol generation. SDK callbacks themselves are guarded by SyncEngine.
            if (sharedEngine.isInitialized()) handler.post {
                try { engine.updateDiagnostic(raw) } catch (_: Exception) {}
            }
        } catch (observationError: Exception) {
            Log.w("ElctonWear", "Diagnostic capture failed: " + observationError.javaClass.simpleName)
        }
        return UserFacingError.explain(message.orEmpty())
    }
}
