from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from threading import Thread
from Connection_MyoBLE import myo_ble_client
import time
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*",port=5000, async_mode="threading")

# Configuración de la base de datos
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'flaskuser'
app.config['MYSQL_PORT'] = 3307
app.config['MYSQL_PASSWORD'] = 'contrasena'
app.config['MYSQL_DB'] = 'appmyorehaby'
app.config['PROPAGATE_EXCEPTIONS'] = True
mysql = MySQL(app)

def iniciar_myo():
    myo_ble_client.iniciar()

async def emitir_emg():
    while True:
        emg = myo_ble_client.get_emg_data()
        if emg:
            socketio.emit('emg_data', {'emg': emg})
        await socketio.sleep(0.05)
        
async def emitir_acelerometro():
    while True:
        acel = myo_ble_client.get_acelerometro()
        if acel:
            socketio.emit('acel_data', {'acelerometro': acel})
        await socketio.sleep(0.05)
        
async def emitir_gyroscopio():
    while True:
        gyro = myo_ble_client.get_giroscopio()
        if gyro:
            socketio.emit('gyro_data', {'gyroscopio': gyro})
        await socketio.sleep(0.05)

# Función para verificar si el usuario ya existe
def usuario_existente(nombre):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE fullname = %s", (nombre,))
    resultado = cursor.fetchone()
    cursor.close()
    return resultado is not None

#funcion de comprobacion de usario en la base de datos
def verificar_usuario(nombre,contrasena):
    cursor = mysql.connection.cursor()
    query = "SELECT * FROM usuarios WHERE fullname = %s"
    cursor.execute(query, (nombre,))
    usuario = cursor.fetchone()
    cursor.close()

    if usuario and bcrypt.checkpw(contrasena.encode('utf-8'), usuario[3].encode('utf-8')):
        return True
    return False

# Ruta principal index
@app.route('/')
def index():
    return "Servidor WebSocket activo"

# Ruta para agregar un nuevo usuario
@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    contrasena = data.get('contrasena')

    # Verificar si el usuario ya existe
    if usuario_existente(nombre):
        return {"error": "El usuario ya existe"}, 409
    # Hashear la contraseña antes de guardarla
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(contrasena.encode('utf-8'), salt)
    # Insertar el nuevo usuario
    cursor = mysql.connection.cursor()
    cursor.execute("INSERT INTO usuarios (fullname, email, password) VALUES (%s, %s, %s)", (nombre, email, hashed_password))
    mysql.connection.commit()
    cursor.close()

    return {"mensaje": "Usuario agregado exitosamente"}, 201


# Ruta para iniciar sesión
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    nombre = data.get('usuario')
    contrasena = data.get('contrasena')
    
    if verificar_usuario(nombre, contrasena):
        return jsonify({"mensaje": "Inicio de sesión exitoso", "nombre": nombre}), 200 
    else:
        return jsonify({"mensaje": "Usuario o contraseña incorrectos"}), 401

@socketio.on('connect')
def handle_connect():
    print("Cliente conectado")
@socketio.on('disconnect')
def handle_disconnect():
    print("Cliente desconectado")
    myo_ble_client.detener()


if __name__ == "__main__":
    thread_myo = Thread(target=iniciar_myo, daemon=True)
    thread_myo.start()
    # Inicia tareas asíncronas correctamente
    socketio.start_background_task(emitir_emg)
    socketio.start_background_task(emitir_acelerometro)
    socketio.start_background_task(emitir_gyroscopio)
    socketio.run(app, host="0.0.0.0", port=5000, debug=False,)  #agregar server='eventlet' para produccion