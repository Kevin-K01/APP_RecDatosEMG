import asyncio
from bleak import BleakClient, BleakScanner, BleakError
from collections import deque
from threading import Thread, Lock, Event

MYO_ADDRESS = "F7:4C:23:AB:3D:24"

EMG_CHARACTERISTICS = [
    "d5060105-a904-deb9-4748-2c7f4a124842",
    "d5060205-a904-deb9-4748-2c7f4a124842",
    "d5060305-a904-deb9-4748-2c7f4a124842",
    "d5060405-a904-deb9-4748-2c7f4a124842"
]

IMU_CHARACTERISTIC = "d5060402-a904-deb9-4748-2c7f4a124842"
COMMAND_CHARACTERISTIC = "d5060401-a904-deb9-4748-2c7f4a124842"
COMMAND_PAYLOAD = bytearray([0x01, 0x03, 0x02, 0x01, 0x01])  # EMG filtrado + IMU + Clasificador
POSE_CHARACTERISTIC = "d5060103-a904-deb9-4748-2c7f4a124842"  # Clasificador de poses

POSES = {
    0x00: "Rest",
    0x01: "Fist",
    0x02: "Wave In",
    0x03: "Wave Out",
    0x04: "Fingers Spread",
    0x05: "Double Tap"
}

class MyoBLEClient:
    def __init__(self, address=MYO_ADDRESS, maxlen=512):
        self.address = address
        self.emg_lock = Lock()
        self.emg_data_queue = deque(maxlen=maxlen)
        self.acel_lock = Lock()
        self.acelerometro = deque(maxlen=maxlen)
        self.gyro_lock = Lock()
        self.giroscopio = deque(maxlen=maxlen)
        self.pose_lock = Lock()
        self.poses = deque(maxlen=maxlen)
        self._loop = None
        self._thread = None
        self._stop_event = Event()
        self._client = None

    # =======================
    # Handlers
    # =======================
    def emg_handler(self, sender, data):
        valores_emg_int16 = [
            int.from_bytes(data[i:i+2], byteorder='little', signed=True)
            for i in range(0, len(data), 2)
        ]
        valores_emg_int8 = [max(-128, min(127, valor // 256)) for valor in valores_emg_int16]
        with self.emg_lock:
            self.emg_data_queue.append(valores_emg_int8)

    def imu_handler(self, sender, data):
        accel = [int.from_bytes(data[i:i+2], byteorder='little', signed=True) for i in range(8, 14, 2)]
        gyro = [int.from_bytes(data[i:i+2], byteorder='little', signed=True) for i in range(14, 20, 2)]
        with self.acel_lock:
            self.acelerometro.append(accel)
        with self.gyro_lock:
            self.giroscopio.append(gyro)

    def pose_handler(self, sender, data):
        if len(data) < 3:
            return
        event_type = data[0]      # 0x03 = classifier_event_pose
        pose_value = int.from_bytes(data[1:3], byteorder='little')
        pose_name = POSES.get(pose_value, f"Unknown ({pose_value})")
        #print(f"Pose detectada: {pose_name}")

        # Guardar pose en deque para acceso thread-safe
        with self.pose_lock:
            self.poses.append(pose_name)

    async def start_pose_notify(self):
        if self._client and self._client.is_connected:
            await self._client.start_notify(POSE_CHARACTERISTIC, self.pose_handler)

    # =======================
    # Escaneo BLE
    # =======================
    async def scan_for_device(self):
        try:
            devices = await BleakScanner.discover(timeout=5.0)
            for d in devices:
                if d.address.upper() == self.address.upper():
                    return d
            return None
        except BleakError as e:
            print(f"No hay adaptador BLE disponible: {e}")
            return None

    # =======================
    # Loop principal
    # =======================
    async def _run(self):
        last_data_time = None
        while not self._stop_event.is_set():
            try:
                device = await self.scan_for_device()
                if not device:
                    print("Myo no encontrado o adaptador BLE ausente. Reintentando en 5s...")
                    await asyncio.sleep(5)
                    continue

                print("Intentando conectar al Myo BLE en", self.address)
                try:
                    async with BleakClient(device.address) as client:
                        self._client = client
                        await asyncio.sleep(1)

                        if not client.is_connected:
                            print("No se pudo conectar al Myo BLE")
                            await asyncio.sleep(5)
                            continue

                        print("Conectado al Myo BLE")

                        # Unlock
                        UNLOCK_PAYLOAD = bytearray([0x01, 0x01, 0x00])
                        await client.write_gatt_char(COMMAND_CHARACTERISTIC, UNLOCK_PAYLOAD)
                        await asyncio.sleep(0.5)  # Tiempo para que Myo procese unlock

                        # EMG + IMU + Clasificador
                        await client.write_gatt_char(COMMAND_CHARACTERISTIC, COMMAND_PAYLOAD)
                        print("Streaming EMG + IMU + Clasificador activado")

                        # Notificaciones
                        for uuid in EMG_CHARACTERISTICS:
                            await client.start_notify(uuid, self.emg_handler)
                        await client.start_notify(IMU_CHARACTERISTIC, self.imu_handler)
                        await client.start_notify(POSE_CHARACTERISTIC, self.pose_handler)

                        last_data_time = asyncio.get_event_loop().time()

                        while not self._stop_event.is_set():
                            if self.emg_data_queue and asyncio.get_event_loop().time() - last_data_time > 2:
                                print("No se reciben datos. Reiniciando conexión...")
                                break
                            if self.emg_data_queue:
                                last_data_time = asyncio.get_event_loop().time()
                            if not client.is_connected:
                                print("Myo BLE desconectado, intentando reconectar...")
                                break
                            await asyncio.sleep(0.1)

                        for uuid in EMG_CHARACTERISTICS + [IMU_CHARACTERISTIC, POSE_CHARACTERISTIC]:
                            try:
                                await client.stop_notify(uuid)
                            except Exception:
                                pass
                        print("Streaming detenido o conexión perdida")

                except BleakError as e:
                    print(f"Error de BLE durante la conexión: {e}. Reintentando en 5s...")

            except Exception as e:
                import traceback
                print(f"Error en conexión BLE: {e}")
                traceback.print_exc()

            await asyncio.sleep(5)

    # =======================
    # Thread
    # =======================
    def _thread_target(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.run_until_complete(self._run())
        self._loop.close()

    def iniciar(self):
        if self._thread and self._thread.is_alive():
            print("Ya está corriendo la conexión")
            return
        print("Iniciando conexión Myo BLE...")
        self._stop_event.clear()
        self._thread = Thread(target=self._thread_target, daemon=True)
        self._thread.start()

    def detener(self):
        if not self._thread:
            return
        print("Deteniendo conexión Myo BLE...")
        self._stop_event.set()
        if self._loop:
            for task in asyncio.all_tasks(self._loop):
                task.cancel()
        self._thread.join(timeout=5)
        print("Conexión detenida")

    # =======================
    # Acceso a datos
    # =======================
    def get_emg_data(self):
        with self.emg_lock:
            return self.emg_data_queue[-1] if self.emg_data_queue else None

    def get_acelerometro(self):
        with self.acel_lock:
            return self.acelerometro[-1] if self.acelerometro else None

    def get_giroscopio(self):
        with self.gyro_lock:
            return self.giroscopio[-1] if self.giroscopio else None

    def get_poses(self):
        with self.pose_lock:
            return self.poses[-1] if self.poses else None

# =======================
# Instancia global
# =======================
myo_ble_client = MyoBLEClient()
myo_ble_client.iniciar()
