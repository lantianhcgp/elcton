"""Synthetic subprocess tests only: fake SDK/public gate, no real SDK control."""
import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import types
import unittest
from unittest import mock

SOURCE = Path(os.environ.get('NATIVE_DIAGNOSTIC_SOURCE',
                            str(Path(__file__).with_name('native_parse_diagnostic.py'))))
helper = types.ModuleType('native_diagnostic_under_test')
helper.__file__ = str(SOURCE)
exec(compile(SOURCE.read_bytes(), str(SOURCE), 'exec'), helper.__dict__)


class NativeDiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.app = self.root / 'fake.app'
        self.app.write_bytes(b'FAKE public archive; not SDK evidence')
        self.sdk = self.root / 'fake-sdk'
        self.sdk.write_bytes(b'FAKE SDK; never launched')
        self.output = self.root / 'report.json'
        self.verify = mock.Mock()
        self.archive = mock.Mock(side_effect=[{'fake.hap': b'FAKE hap'}, {
            'assets/js/a.js': b'first original JS\r\n',
            'assets/js/b.js': b'second original JS\x00',
            'assets/ignore.txt': b'not JS',
        }])
        self.addCleanup(mock.patch.stopall)
        mock.patch.object(helper, 'SDK_SHA',
                          hashlib.sha256(self.sdk.read_bytes()).hexdigest()).start()
        mock.patch.object(helper.runpy, 'run_path', return_value={
            'verify': self.verify, 'archive': self.archive}).start()

    def run_diagnostic(self, effects):
        effects = iter(effects)

        def synthetic_run(*args, **kwargs):
            effect = next(effects)
            if isinstance(effect, Exception):
                raise effect
            if kwargs.get('text'):
                return subprocess.CompletedProcess(effect.args, effect.returncode,
                    effect.stdout.decode('utf-8', errors='replace').replace('\r\n', '\n'),
                    effect.stderr.decode('utf-8', errors='replace').replace('\r\n', '\n'))
            return effect

        with mock.patch.object(helper.subprocess, 'run', side_effect=synthetic_run) as run:
            with contextlib.redirect_stdout(io.StringIO()):
                try:
                    helper.diagnostic(self.app, self.sdk, self.output)
                except (subprocess.TimeoutExpired, OSError):
                    self.assertTrue(self.output.exists(), 'exception discarded prior rows/report')
                    raise
        self.verify.assert_called_once_with(self.app)
        return json.loads(self.output.read_text()), run

    def assert_stream(self, row, stream, raw):
        self.assertIn(stream + '_hex', row, 'lossless native stream missing')
        self.assertEqual(bytes.fromhex(row[stream + '_hex']), raw)
        self.assertEqual(row[stream + '_bytes'], len(raw))
        self.assertEqual(row[stream + '_sha256'], hashlib.sha256(raw).hexdigest())

    def test_binary_streams_are_lossless_and_subprocess_stays_exact(self):
        raw_out, raw_err = b'A\r\n\xff\x00', b'B\r\n\x80\x00'
        report, run = self.run_diagnostic([
            subprocess.CompletedProcess([], 0, raw_out, raw_err),
            subprocess.CompletedProcess([], -11, b'', b'crash\xff'),
        ])
        row = report['rows'][0]
        self.assert_stream(row, 'stdout', raw_out)
        self.assert_stream(row, 'stderr', raw_err)
        self.assertEqual(row['status'], 'completed')
        self.assertEqual(report['rows'][1]['returncode'], -11)
        self.assertFalse(report['all_parsed'])
        for call in run.call_args_list:
            args = call.args[0]
            self.assertEqual(args[0:2], [str(self.sdk), '--parse-only'])
            self.assertEqual(call.kwargs['timeout'], 30)
            self.assertTrue(call.kwargs['capture_output'])
            self.assertIs(call.kwargs.get('text', False), False)

    def test_timeout_preserves_prior_rows_and_partial_binary_streams(self):
        timeout = subprocess.TimeoutExpired(['fake-sdk'], 30,
                                            output=b'partial\xff\r\n', stderr=b'err\x80')
        report, _ = self.run_diagnostic([
            subprocess.CompletedProcess([], 0, b'prior', b''), timeout,
        ])
        self.assertEqual(len(report['rows']), 2)
        self.assertEqual(report['rows'][0]['returncode'], 0)
        self.assert_stream(report['rows'][0], 'stdout', b'prior')
        row = report['rows'][1]
        self.assertEqual(row['status'], 'timeout')
        self.assertIsNone(row['returncode'])
        self.assert_stream(row, 'stdout', b'partial\xff\r\n')
        self.assert_stream(row, 'stderr', b'err\x80')
        self.assertFalse(report['all_parsed'])

    def test_launch_error_preserves_prior_rows_without_inventing_exit(self):
        report, _ = self.run_diagnostic([
            subprocess.CompletedProcess([], 0, b'prior', b''),
            OSError('synthetic launch failure'),
        ])
        self.assertEqual(len(report['rows']), 2)
        self.assertEqual(report['rows'][0]['returncode'], 0)
        row = report['rows'][1]
        self.assertEqual(row['status'], 'launch_error')
        self.assertIsNone(row['returncode'])
        self.assert_stream(row, 'stdout', b'')
        self.assert_stream(row, 'stderr', b'')
        self.assertFalse(report['all_parsed'])

    def test_only_observed_successful_exits_allow_all_parsed(self):
        report, _ = self.run_diagnostic([
            subprocess.CompletedProcess([], 0, b'', b''),
            subprocess.CompletedProcess([], 0, b'', b''),
        ])
        self.assertTrue(report['all_parsed'])
        self.assertTrue(all(r.get('status') == 'completed' for r in report['rows']))

    def test_no_observed_process_is_not_all_parsed(self):
        self.archive.side_effect = [{'fake.hap': b'FAKE hap'}, {}]
        report, run = self.run_diagnostic([])
        run.assert_not_called()
        self.assertEqual(report['rows'], [])
        self.assertFalse(report['all_parsed'])


if __name__ == '__main__':
    unittest.main()
