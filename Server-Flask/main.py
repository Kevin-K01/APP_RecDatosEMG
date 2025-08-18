from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from threading import Thread
from Connection_MyoBLE import myo_ble_client
import time
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuración de la base de datos
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'flaskuser'
app.config['MYSQL_PORT'] = 3307
app.config['MYSQL_PASSWORD'] = 'contrasena'
app.config['MYSQL_DB'] = 'appmyorehaby'
app.config['PROPAGATE_EXCEPTIONS'] = True
mysql = MySQL(app)

# =======================
# Iniciar Myo
# =======================
def iniciar_myo():
    myo_ble_client.iniciar()

# =======================
# Hilos para emitir datos
# =======================
def emitir_emg():
    while True:
        emg = myo_ble_client.get_emg_data()
        if emg:
            socketio.emit('emg_data', {'emg': emg})
        socketio.sleep(0.02)

def emitir_acelerometro():
    while True:
        acel = myo_ble_client.get_acelerometro()
        if acel:
            socketio.emit('acel_data', {'acelerometro': acel})
        socketio.sleep(0.02)

def emitir_gyroscopio():
    while True:
        gyro = myo_ble_client.get_giroscopio()
        if gyro:
            socketio.emit('gyro_data', {'gyroscopio': gyro})
        socketio.sleep(0.02)

# Nuevo hilo para emitir la pose
def emitir_pose():
    while True:
        pose_data = myo_ble_client.get_poses()
        if pose_data:
            socketio.emit("pose_data", {"pose": pose_data})
        socketio.sleep(0.02)

# =======================
# Funciones de usuario
# =======================
def usuario_existente(nombre):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE fullname = %s", (nombre,))
    resultado = cursor.fetchone()
    cursor.close()
    return resultado is not None

def verificar_usuario(nombre, contrasena):
    cursor = mysql.connection.cursor()
    query = "SELECT * FROM usuarios WHERE fullname = %s"
    cursor.execute(query, (nombre,))
    usuario = cursor.fetchone()
    cursor.close()

    if usuario and bcrypt.checkpw(contrasena.encode('utf-8'), usuario[3].encode('utf-8')):
        return True
    return False

# =======================
# Rutas
# =======================
@app.route('/')
def index():
    return "Servidor WebSocket activo"

@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    contrasena = data.get('contrasena')

    if usuario_existente(nombre):
        return {"error": "El usuario ya existe"}, 409

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(contrasena.encode('utf-8'), salt)

    cursor = mysql.connection.cursor()
    cursor.execute(
        "INSERT INTO usuarios (fullname, email, password) VALUES (%s, %s, %s)",
        (nombre, email, hashed_password)
    )
    mysql.connection.commit()
    cursor.close()

    return {"mensaje": "Usuario agregado exitosamente"}, 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    nombre = data.get('usuario')
    contrasena = data.get('contrasena')
    
    if verificar_usuario(nombre, contrasena):
        return jsonify({"mensaje": "Inicio de sesión exitoso", "nombre": nombre}), 200
    else:
        return jsonify({"mensaje": "Usuario o contraseña incorrectos"}), 401

# =======================
# Main
# =======================
if __name__ == "__main__":
    # Servidor SocketIO
    thread_socketio = Thread(
        target=socketio.run,
        args=(app,),
        kwargs={"debug": True, "use_reloader": False, "allow_unsafe_werkzeug": True}
    )
    thread_socketio.start()

    # Conexión Myo
    thread_myo = Thread(target=iniciar_myo)
    thread_myo.start()

    # Hilos de datos
    thread_emg = Thread(target=emitir_emg)
    thread_emg.start()
    
    thread_acel = Thread(target=emitir_acelerometro)
    thread_acel.start()
    
    thread_gyro = Thread(target=emitir_gyroscopio)
    thread_gyro.start()
    
    # Hilo de poses
    thread_pose = Thread(target=emitir_pose)
    thread_pose.start()
