package com.hcbiu.elcton

/** Model names are diagnostic only. Unknown P2P status may be probed, never called verified. */
object DevicePolicy {
    fun canAttemptSync(connected: Boolean, p2p: Int, supported: Int, unsupported: Int): Boolean =
        connected && (p2p == supported || p2p != unsupported)
}
