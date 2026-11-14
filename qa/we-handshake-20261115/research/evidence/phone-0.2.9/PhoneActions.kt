package com.hcbiu.elcton

import org.json.JSONArray
import org.json.JSONObject

/** Shared domain actions. UI and MCP both use this instance, never a second transfer state. */
class PhoneActions(val sync: SyncEngine, val schedule: PhoneSchedule) {
    private var importConfirmation = false
    private var importBaseRevision: Long? = null

    fun connect(deviceId: String): Boolean {
        val selected = sync.state.devices.firstOrNull { it.id == deviceId } ?: return false
        return sync.connect(selected.id)
    }
    fun scan(interactive: Boolean = false) = sync.authorizeAndScan(interactive)
    fun disconnect() { importConfirmation = false; importBaseRevision = null; sync.cancel() }
    fun abort() { disconnect(); schedule.cancelImport() }
    fun startImport(confirm: Boolean = false): Boolean {
        if (schedule.state.loadError != null || !sync.state.ready || sync.state.busy) return false
        importConfirmation = confirm
        importBaseRevision = schedule.state.book.revision
        if (!sync.requestExport()) { importConfirmation = false; importBaseRevision = null; return false }
        return true
    }
    fun receiveImport(raw: String, remoteRevision: Long) {
        val confirm = importConfirmation && importBaseRevision == schedule.state.book.revision
        importConfirmation = false; importBaseRevision = null
        if (schedule.prepareImport(raw, remoteRevision) && confirm) schedule.confirmImport()
    }
    fun importDocument(document: String, confirm: Boolean = false): Boolean {
        if (sync.state.busy) return false
        if (!schedule.prepareImport(document)) return false
        return !confirm || schedule.confirmImport()
    }
    fun publish(confirm: Boolean, force: Boolean = false): Boolean {
        if (!confirm || schedule.state.loadError != null) return false
        val state = sync.state; val book = schedule.state.book
        if (!state.ready || state.busy) return false
        if ((state.dirty || state.hasData && state.datasetId != book.datasetId) && !force) return false
        return sync.publishSnapshot(book.wireJson(), force, book.datasetId, maxOf(1L, book.revision))
    }
    fun stateJson(): JSONObject {
        val state = sync.state
        return JSONObject().put("status", state.status).put("detail", state.detail).put("ready", state.ready).put("busy", state.busy)
            .put("selected", state.selected).put("digest", state.digest).put("dirty", state.dirty).put("source_revision", state.revision)
            .put("dataset_id", state.datasetId).put("has_data", state.hasData).put("last_success_at", state.lastSuccessAt)
            .put("permission_granted", state.permissionGranted ?: JSONObject.NULL)
            .put("phone_revision", schedule.state.book.revision).put("import_pending", schedule.state.pendingImport != null)
    }
    fun coursesJson(): JSONObject = JSONObject().put("document", JSONObject(schedule.state.book.wireJson()))
        .put("dataset_id", schedule.state.book.datasetId).put("revision", schedule.state.book.revision)
        .put("load_error", schedule.state.loadError ?: JSONObject.NULL)
        .put("pending_import", schedule.state.pendingImport?.let { JSONObject(it.wireJson()) } ?: JSONObject.NULL)
        .put("notice", schedule.state.notice)
    fun devicesJson(): JSONObject = JSONObject().put("devices", JSONArray(sync.state.devices.map { device ->
        JSONObject().put("device_id", device.id).put("name", device.name).put("model", device.model)
            .put("connected", device.connected).put("p2p_capability", device.p2pCapability)
    })).put("observed", sync.state.permissionGranted != null).put("scanning", sync.state.busy)
}
