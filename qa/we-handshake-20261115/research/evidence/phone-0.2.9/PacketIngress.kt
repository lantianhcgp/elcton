package com.hcbiu.elcton

import org.json.JSONObject

/** Reject coercions at the SDK boundary before any packet may advance state. */
object PacketIngress {
    /** Only an uncorrelated preparation reply may terminate the pending READY handshake. */
    fun preparationError(message:JSONObject,awaitingReady:Boolean,activeTransfer:Boolean):String? {
        if(!awaitingReady || activeTransfer || message.optString("type")!="ERROR" || message.optString("transferId").isNotEmpty())return null
        return "手表准备失败（${message.optString("code")}）。还没有发送课表；请查看表端同步页的具体错误。"
    }
    fun watch(raw:String):JSONObject? {
        if(raw.isEmpty() || raw.length>1024 || raw.any{it.code !in 32..126}) return null
        return try {
            val m=JSONObject(raw)
            if(m.opt("protocol")!="elcton.sync" || exactInteger(m.opt("version"))!=1L || m.opt("sender")!="watch")return null
            val type=m.opt("type") as? String ?: return null
            val id=m.opt("transferId") as? String ?: return null
            if(id.isEmpty() && type!="READY" && type!="ERROR")return null
            if(id.isNotEmpty()&&!Regex("[A-Za-z0-9_-]{1,40}").matches(id))return null
            fun int(key:String,min:Long,max:Long)=exactInteger(m.opt(key))?.let{it in min..max}==true
            fun str(key:String,max:Int)=m.opt(key) is String && (m.opt(key) as String).length<=max
            fun digest()=m.opt("digest") is String && Regex("[0-9a-f]{8}").matches(m.opt("digest") as String)
            val valid=when(type){
                "READY"->int("maxBytes",1,32768)&&int("sourceRevision",0,9007199254740990L)&&str("datasetId",64)&&str("digest",8)&&
                    ((m.opt("digest") as String).isEmpty()||digest())&&m.opt("localDirty") is Boolean&&m.opt("hasData") is Boolean
                "ACK"->int("seq",-1,127)
                "APPLIED"->digest()&&int("sourceRevision",1,9007199254740990L)
                "EXPORT_META"->int("length",1,32768)&&int("chunks",1,128)&&digest()&&int("sourceRevision",0,9007199254740990L)
                "EXPORT_CHUNK"->int("seq",0,127)&&str("data",900)&&(m.opt("data") as String).all{it.code in 32..126}
                "ERROR"->m.opt("code") is String&&Regex("[A-Z0-9_]{1,48}").matches(m.opt("code") as String)
                "CANCELLED","EXPORT_CLOSED"->true
                else->false
            }
            if(valid)m else null
        }catch(_:Exception){null}
    }
}
