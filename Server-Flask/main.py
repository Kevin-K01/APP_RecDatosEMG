from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuración de la base de datos
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'flaskuser'
app.config['MYSQL_PORT'] = 3307
app.config['MYSQL_PASSWORD'] = 'contrasena'
app.config['MYSQL_DB'] = 'appmyorehaby'
app.config['PROPAGATE_EXCEPTIONS'] = True
mysql = MySQL(app)

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

# Evento de conexión de SocketIO
@socketio.on('connect')
def handle_connect():
    print("Cliente conectado")

# Ejecutar la aplicación
if __name__ == '__main__':
    socketio.run(app, debug=True)
