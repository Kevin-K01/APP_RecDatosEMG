import myo
from collections import deque
from threading import Lock
import time

class EmgCollector(myo.DeviceListener):
    def __init__(self, n=512):
        self.n = n
        self.lock = Lock()
        self.emg_data_queue = deque(maxlen=n)
        self.selected_sensors = [True] * 8
        self.acelerometro =deque(maxlen=n)
        self.giroscopio = deque(maxlen=n)
        


    def on_connected(self, event):
        event.device.stream_emg(True)
        print("Dispositivo Myo conectado. Transmisión EMG habilitada")

    def on_orientation(self, event):
        """ Captura los datos de orientación: acelerómetro y giroscopio """
        acelerometro = event.acceleration
        giroscopio = event.gyroscope

        # Almacenar en las colas correspondientes
        self.acelerometro.append((event.timestamp, acelerometro))
        self.giroscopio.append((event.timestamp, giroscopio))

    def on_emg(self, event):
        with self.lock:
            self.emg_data_queue.append((event.timestamp, list(event.emg)))
            
            
    def get_emg_data(self):
        with self.lock:
            if self.emg_data_queue:
                return self.emg_data_queue[-1]
            else:
                return None
class RecEmg:
    def __init__(self):
        myo.init()
        self.listener = EmgCollector()
        self.hub = myo.Hub()
        self.runing = False

    def iniciar(self):
        self.runing = True
        print("Iniciando recolección de datos EMG...")
        try:
            self.hub.run_forever(self.listener, 1000)
        except KeyboardInterrupt:
            print("\nAplicación detenida.")
        finally:
            self.detener()

    def detener(self):
        self.runing = False
        try:
            self.hub.stop()
            print("Recolección de datos EMG detenida.")
        except AttributeError:
            pass

    def get_emg_data(self):
        return self.listener.get_emg_data()

#instancia global de la clase RecEmg
rec_emg = RecEmg()