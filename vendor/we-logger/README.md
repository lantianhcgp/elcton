# Pinned WE application logger

`watch/logsink.js` is the exact byte-preserved canonical module from local upstream `~/lite-watch-logger` at `80b09b6a8b2f059f47bd6c94252001b5e68f0cca` (2921 bytes, SHA256 in `UPSTREAM.json`). No upstream/vendor behavior was edited.

Build generation applies the strict count-checked `scripts/we_logger_timer_compat.py` to this pinned module. Its 3018-byte output is byte-equal to the existing S67 stage3 adapter output: native timer ID 0 is valid; null denotes no ownership; one-shot pump/watchdog clears its own handle before invoking work, never the executing ACE Arguments. Transport/capture/queue/timing APIs remain canonical. Host tests do not establish FIT3/native heap acceptance.

This private upstream checkout has no `LICENSE` file; no invented license text is added. Parent must resolve any public redistribution licensing question separately.
