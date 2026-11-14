package com.hcbiu.elcton

import java.util.zip.CRC32

/** The ASCII wire format matches the callback-only watch implementation. */
object Wire {
    data class Chunk(val seq: Int, val data: String, val message: String)

    fun ascii(text: String): String = buildString {
        text.forEach { c ->
            if (c.code > 126) append("\\u" + c.code.toString(16).padStart(4, '0')) else append(c)
        }
    }

    fun quote(text: String): String = buildString {
        append('"')
        text.forEach { c ->
            when (c) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> if (c.code < 32 || c.code > 126) append("\\u" + c.code.toString(16).padStart(4, '0')) else append(c)
            }
        }
        append('"')
    }

    fun crc32(text: String): String {
        require(text.all { it.code < 128 }) { "NON_ASCII" }
        return CRC32().apply { update(text.toByteArray(Charsets.US_ASCII)) }.value.toString(16).padStart(8, '0')
    }

    fun header(type: String, transferId: String): String =
        "\"protocol\":\"elcton.sync\",\"version\":1,\"sender\":\"phone\",\"type\":" + quote(type) + ",\"transferId\":" + quote(transferId)

    fun chunks(text: String, transferId: String): List<Chunk> {
        require(Regex("[A-Za-z0-9_-]{1,40}").matches(transferId)) { "INVALID_TRANSFER_ID" }
        require(text.all { it.code in 32..126 }) { "NON_ASCII" }
        val result = mutableListOf<Chunk>()
        var offset = 0
        while (offset < text.length) {
            val seq = result.size
            var size = minOf(700, text.length - offset)
            var payload: String
            var message: String
            do {
                payload = text.substring(offset, offset + size)
                message = "{" + header("CHUNK", transferId) + ",\"seq\":" + seq + ",\"data\":" + quote(payload) + "}"
                if (message.length <= 1024) break
                size--
            } while (size > 0)
            require(size > 0) { "PACKET_TOO_LARGE" }
            result += Chunk(seq, payload, message)
            offset += size
        }
        return result
    }
}
