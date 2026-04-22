const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static(__dirname));
const server = http.createServer(app);
const io = new Server(server);

let players = [];
let tema = "";
let impostor = "";



const temas = ["Praia", "Hospital", "Escola", "Restaurante"];

io.on("connection", (socket) => {
    io.emit("players", players);
    console.log("Alguém conectou:", socket.id);
    
    socket.on("join", (name) => {
        let playerExists = players.some(p => p.id === socket.id);
        if (!playerExists) {
            players.push({ id: socket.id, name: name });
        }
        io.emit("players", players);
        
    });

    socket.on("start", () => {
        tema = temas[Math.floor(Math.random() * temas.length)];
        impostor = players[Math.floor(Math.random() * players.length)];

        // Avisa todo mundo para iniciar a contagem visual
        io.emit("preparing_start");

        // Espera 3.5 segundos (tempo da contagem) para enviar os papéis
        setTimeout(() => {
            players.forEach(p => {
                if (p.id === impostor.id) {
                    io.to(p.id).emit("role", { tema: "???", impostor: true });
                } else {
                    io.to(p.id).emit("role", { tema, impostor: false });
                }
            });
        }, 3500); 
    });

    socket.on("disconnect", () => {
        console.log("Desconectou:", socket.id);

        players = players.filter(p => p.id !== socket.id);
        io.emit("players", players);

        console.log("Players restantes:", players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));