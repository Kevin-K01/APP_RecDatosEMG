import asyncio
from bleak import BleakClient
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
COMMAND_PAYLOAD = bytearray([0x01, 0x03, 0x02, 0x01, 0x00])  # EMG filtrado + IMU

class MyoBLEClient:
    def __init__(self, address=MYO_ADDRESS, maxlen=512):
        self.address = address
        self.emg_lock = Lock()
        self.emg_data_queue = deque(maxlen=maxlen)
        self.acel_lock = Lock()
        self.acelerometro = deque(maxlen=maxlen)
        self.gyro_lock = Lock()
        self.giroscopio = deque(maxlen=maxlen)
        self._loop = None
        self._thread = None
        self._stop_event = Event()
        self._client = None

    def emg_handler(self, sender, data):
        valores_emg_int16 = [
            int.from_bytes(data[i:i+2], byteorder='little', signed=True)
            for i in range(0, len(data), 2)
        ]
        valores_emg_int8 = [
            max(-128, min(127, valor // 256))
            for valor in valores_emg_int16
        ]
        with self.emg_lock:
            self.emg_data_queue.append(valores_emg_int8)

    def imu_handler(self, sender, data):
        accel = [int.from_bytes(data[i:i+2], byteorder='little', signed=True) for i in range(8, 14, 2)]
        gyro = [int.from_bytes(data[i:i+2], byteorder='little', signed=True) for i in range(14, 20, 2)]
        with self.acel_lock:
            self.acelerometro.append(accel)
        with self.gyro_lock:
            self.giroscopio.append(gyro)

    async def _run(self):
        while not self._stop_event.is_set():
            try:
                print("Intentando conectar al Myo BLE en", self.address)
                async with BleakClient(self.address) as client:
                    self._client = client
                    await asyncio.sleep(1)

                    if not client.is_connected:
                        print("No se pudo conectar al Myo BLE")
                        await asyncio.sleep(5)
                        continue

                    print("Conectado al Myo BLE")

                    UNLOCK_PAYLOAD = bytearray([0x01, 0x01, 0x00])
                    await client.write_gatt_char(COMMAND_CHARACTERISTIC, UNLOCK_PAYLOAD)
                    print("Myo desbloqueado")

                    await client.write_gatt_char(COMMAND_CHARACTERISTIC, COMMAND_PAYLOAD)
                    print("Streaming EMG + IMU activado")

                    for uuid in EMG_CHARACTERISTICS:
                        await client.start_notify(uuid, self.emg_handler)
                        print(f"Notificaciones activadas para EMG: {uuid}")
                    await client.start_notify(IMU_CHARACTERISTIC, self.imu_handler)
                    print(f"Notificaciones activadas para IMU: {IMU_CHARACTERISTIC}")

                    while not self._stop_event.is_set():
                        if not client.is_connected:
                            print("Myo BLE desconectado, intentando reconectar...")
                            break
                        await asyncio.sleep(0.1)

                    for uuid in EMG_CHARACTERISTICS:
                        try:
                            await client.stop_notify(uuid)
                        except Exception:
                            pass
                    try:
                        await client.stop_notify(IMU_CHARACTERISTIC)
                    except Exception:
                        pass
                    print("Streaming detenido o conexión perdida")

            except Exception as e:
                import traceback
                print(f"Error en conexión BLE: {e}")
                traceback.print_exc()

            await asyncio.sleep(5)  # Esperar antes de volver a intentar conectar


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
            # Cancelar tareas pendientes para que salga el loop rápido
            for task in asyncio.all_tasks(self._loop):
                task.cancel()
        self._thread.join(timeout=5)
        print("Conexión detenida")

    def get_emg_data(self):
        with self.emg_lock:
            return self.emg_data_queue[-1] if self.emg_data_queue else None

    def get_acelerometro(self):
        with self.acel_lock:
            return self.acelerometro[-1] if self.acelerometro else None

    def get_giroscopio(self):
        with self.gyro_lock:
            return self.giroscopio[-1] if self.giroscopio else None

# Instancia global
myo_ble_client = MyoBLEClient()