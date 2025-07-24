import subprocess
import base64
import os
import serial
import time

PICO_PORT = 'COM9'
PYBOARD_PATH = r'C:\Users\Administrator\Desktop\Minor Project Github\AIR-QUALITY-MEASUREMENT\pyboard.py'

def stop_main_py(port):
    try:
        with serial.Serial(port, 115200, timeout=1) as ser:
            ser.write(b'\x03')  # Ctrl+C
            time.sleep(0.5)
            ser.write(b'\n')    # Newline to clean up buffer
            print("🛑 main.py interrupted successfully")
    except Exception as e:
        print(f"❌ Could not interrupt main.py: {e}")

def restart_main_py(port):
    try:
        with serial.Serial(port, 115200, timeout=1) as ser:
            ser.write(b'\x04')  # Ctrl+D
            print("🔁 Pico soft rebooted (main.py restarted)")
    except Exception as e:
        print(f"❌ Could not restart Pico: {e}")

def download_file_from_pico(port, source_file, dest_file):
    try:
        command = (
            f"import ubinascii\n"
            f"with open('{source_file}', 'rb') as f:\n"
            f" data = f.read()\n"
            f" print(ubinascii.b2a_base64(data).decode(), end='')"
        )

        result = subprocess.run(
            ['python', PYBOARD_PATH, '--device', port, '-c', command],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            print("❌ Error communicating with Pico:", result.stderr)
            return

        base64_data = result.stdout.strip()
        file_data = base64.b64decode(base64_data)

        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        with open(dest_file, 'wb') as f:
            f.write(file_data)

        print(f"✅ {source_file} → {dest_file}")
    except Exception as e:
        print(f"❌ Transfer error: {e}")


# === Full Transfer Workflow ===
files_to_download = {
    'pm_data.csv': 'AIR-QUALITY-MEASUREMENT/sensor/main/pm_data.csv',
    'aqi_log.json': 'AIR-QUALITY-MEASUREMENT/sensor/main/aqi_log.json',
}

# 1. Stop main.py if running
stop_main_py(PICO_PORT)

# 2. Download all files
for pico_path, local_path in files_to_download.items():
    download_file_from_pico(PICO_PORT, pico_path, local_path)

# 3. Optional: Restart main.py after download
restart_main_py(PICO_PORT)
