import json
import sys

PIPE_NAME = r'\\.\pipe\RevitMCPBridge2026'

def call_revit(method: str, params: dict) -> dict:
    if sys.platform != 'win32':
        return {"success": False, "error": "Not running on Windows — Revit unavailable"}
    try:
        import win32file
        import pywintypes
        handle = win32file.CreateFile(
            PIPE_NAME,
            win32file.GENERIC_READ | win32file.GENERIC_WRITE,
            0, None, win32file.OPEN_EXISTING, 0, None
        )
        payload = json.dumps({"method": method, "params": params}) + "\n"
        win32file.WriteFile(handle, payload.encode('utf-8'))
        response_data = b""
        while True:
            try:
                err, chunk = win32file.ReadFile(handle, 65536)
                response_data += chunk
                if b"\n" in chunk:
                    break
            except pywintypes.error as e:
                if e.winerror == 234:
                    continue
                break
        win32file.CloseHandle(handle)
        return json.loads(response_data.decode('utf-8').strip('\x00').strip())
    except Exception as e:
        return {"success": False, "error": str(e)}

def is_revit_connected() -> bool:
    result = call_revit("getLevels", {})
    return result.get("success", False)
