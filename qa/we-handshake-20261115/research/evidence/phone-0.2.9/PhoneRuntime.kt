package com.hcbiu.elcton

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.util.concurrent.Executors

/** Application scope owns the ONLY engine/store; UI is an observer, not the transport owner. */
class PhoneRuntime(context: Context) {
    private val app = context.applicationContext as ElctonApplication
    private val main = Handler(Looper.getMainLooper())
    private val dispatcher = MainThreadActions({ block -> main.post { block() } }, { Looper.myLooper() == Looper.getMainLooper() })
    private val listeners = LinkedHashSet<() -> Unit>()
    val schedule = PhoneSchedule(ScheduleStore(app)) { notifyObservers() }
    private val adapter = WearProbe(app, { notifyObservers() }, { raw, revision -> actions.receiveImport(raw, revision) })
    val actions: PhoneActions = PhoneActions(adapter.engine, schedule)
    val sync get() = adapter.engine.state
    private val network = Executors.newSingleThreadExecutor { task -> Thread(task, "elcton-pickup").apply { isDaemon = true } }
    private var pickupGeneration = 0L
    private var pickup: PickupClient? = null
    private var pickupBusy = false
    private var pickupError: String? = null

    fun observe(listener: () -> Unit) { listeners.add(listener); listener() }
    fun unobserve(listener: () -> Unit) { listeners.remove(listener) }
    private fun notifyObservers() { listeners.toList().forEach { it() } }
    fun scan(activity: Activity? = null): Boolean = adapter.authorizeAndScan(activity != null, activity)
    fun connect(deviceId: String): Boolean = !pickupBusy && actions.connect(deviceId)
    fun publish(confirm: Boolean, force: Boolean = false) = !pickupBusy && actions.publish(confirm, force)
    fun startImport(confirm: Boolean = false) = !pickupBusy && actions.startImport(confirm)
    fun importDocument(raw: String, confirm: Boolean = false): Boolean = !pickupBusy && actions.importDocument(raw, confirm)
    fun save(book: ScheduleBook) = !pickupBusy && schedule.save(book)
    fun cancelAll() {
        dispatcher.invalidate()
        pickupGeneration++
        pickup?.cancel(); pickup = null; pickupBusy = false; pickupError = null
        actions.abort()
        notifyObservers()
    }
    fun disconnect() { cancelAll() }
    fun onBackground() {
        if (!McpKeepAlive.active) cancelAll()
        adapter.clearActivity()
    }

    fun pickupImport(code: String, confirm: Boolean): Boolean {
        if (pickupBusy || sync.busy || schedule.state.loadError != null) return false
        require(Regex("[0-9]{6}").matches(code)) { "取件码必须是六位数字" }
        val generation = ++pickupGeneration
        val client = PickupClient(); pickup = client; pickupBusy = true; pickupError = null
        val revision = schedule.state.book.revision
        notifyObservers()
        network.execute {
            val fetched = runCatching { client.fetch(code) }
            main.post {
                if (generation != pickupGeneration) return@post
                pickupBusy = false; pickup = null
                if (schedule.state.book.revision != revision || sync.busy) {
                    pickupError = "导入期间课表或同步状态已改变，请重新检查"
                } else fetched.onSuccess {
                    if (!actions.importDocument(it, confirm)) pickupError = schedule.state.notice
                }.onFailure { error -> pickupError = UserFacingError.validation(error.message) }
                notifyObservers()
            }
        }
        return true
    }

    /** HTTP worker marshals bounded work to the same Android main-thread state as UI/SDK. */
    fun mcp(name: String, args: JSONObject): JSONObject = dispatcher.invoke {
        if (!McpKeepAlive.enabled(app)) JSONObject().put("error", "mcp_session_stopped")
        else runAction(name, args)
    }
    private fun stateJson() = actions.stateJson().put("pickup_busy", pickupBusy).put("pickup_error", pickupError ?: JSONObject.NULL)
    private fun accepted(value: Boolean) = stateJson().put("accepted", value).put("state", if (value) "pending" else "rejected")
        .apply { if (!value) put("error", "not_ready_busy_or_confirmation_required") }

    private fun runAction(name: String, args: JSONObject): JSONObject = when (name) {
        "sync_connect" -> accepted(connect(args.getString("device_id")))
        "sync_disconnect" -> { disconnect(); stateJson().put("accepted", true).put("state", "cancelled") }
        "start_import" -> accepted(startImport(args.optBoolean("confirm", false)))
        "start_publish" -> accepted(publish(args.getBoolean("confirm"), args.optBoolean("force", false)))
        "abort" -> { cancelAll(); stateJson().put("accepted", true).put("state", "cancelled") }
        "courses_read" -> actions.coursesJson()
        "courses_write" -> {
            if (args.has("expected_revision") && args.getLong("expected_revision") != schedule.state.book.revision) JSONObject().put("error", "stale_revision")
            else {
                val ok = importDocument(args.getJSONObject("document").toString(), args.optBoolean("confirm", false))
                actions.coursesJson().put("accepted", ok).put("state", if (!ok) "rejected" else if (args.optBoolean("confirm", false)) "saved" else "preview")
                    .apply { if (!ok) put("error", "validation_failed_or_busy") }
            }
        }
        "pickup_import" -> accepted(pickupImport(args.getString("pickup"), args.optBoolean("confirm", false)))
        "devices_list" -> actions.devicesJson().apply {
            if (args.optBoolean("refresh", false)) put("refresh_accepted", scan()).put("state", "pending")
        }
        "pairing_state" -> stateJson().put("devices", actions.devicesJson().getJSONArray("devices"))
        "sync_state" -> stateJson()
        else -> JSONObject().put("error", "unknown_tool")
    }
}
