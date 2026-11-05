
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;

let godot = null;

// Página do controle
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Normalizar controles
function normalizar(data) {
    const limitar = (v, min, max) =>
        Math.max(min, Math.min(max, Number(v) || 0));

    return {
        type: 'input',
        steer: limitar(data.steer, -1, 1),
        gas: limitar(data.gas, 0, 1),
        brake: limitar(data.brake, 0, 1)
    };
}

// Enviar para Godot
function enviar(data) {
    if (godot?.readyState === WebSocket.OPEN) {
        godot.send(JSON.stringify(data));
    }
}

// Conexões
wss.on('connection', (ws) => {

    console.log('Cliente conectado');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Godot se identifica
            if (data.type === 'register' && data.role === 'godot') {
                godot = ws;
                console.log('Godot conectado');
                return;
            }

            // Receber controles do celular
            if (data.type === 'input' && ws !== godot) {
                enviar(normalizar(data));
            }

        } catch (error) {
            console.log('Mensagem inválida');
        }
    });

    ws.on('close', () => {
        if (godot === ws) {
            godot = null;
            console.log('Godot desconectado');
        }
    });

});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
