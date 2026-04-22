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


    socket.on("mouse_move", (data) => {
        // Envia a posição para todos, EXCETO para quem enviou
        socket.broadcast.emit("mouse_update", {
            id: socket.id,
            name: data.name,
            x: data.x,
            y: data.y
        });
    });

    // Quando alguém desconectar, avisar para remover o cursor
    socket.on("disconnect", () => {
        io.emit("remove_cursor", socket.id);
        // ... resto do seu código de disconnect
    });

    // Organização por categorias
    const categorias = {
        "Lugares Públicos": ["Praia", "Hospital", "Escola", "Restaurante", "Aeroporto", "Cinema", "Zoológico", "Academia", "Museu", "Supermercado"],
        "Aventura e Ficção": ["Navio Pirata", "Estação Espacial", "Castelo Medieval", "Fundo do Mar", "Escola de Magia", "Apocalipse Zumbi", "Base em Marte"],
        "Trabalho e Cotidiano": ["Escritório", "Canteiro de Obras", "Delegacia", "Oficina Mecânica", "Corpo de Bombeiros", "Salão de Beleza", "Fazenda"]
    };

    // ... restante do código anterior ...

    socket.on("start", () => {
        // 1. Sorteia a categoria
        const chaves = Object.keys(categorias);
        const categoriaSorteada = chaves[Math.floor(Math.random() * chaves.length)];
        
        // 2. Sorteia o tema dentro daquela categoria
        const listaLocais = categorias[categoriaSorteada];
        const temaSorteado = listaLocais[Math.floor(Math.random() * listaLocais.length)];
        
        // 3. Sorteia o impostor
        const impostorSorteado = players[Math.floor(Math.random() * players.length)];

        // 4. Avisa todo mundo da contagem (3, 2, 1...)
        io.emit("preparing_start");

        // 5. Envia os papéis após a contagem
        setTimeout(() => {
            players.forEach(p => {
                const ehImpostor = (p.id === impostorSorteado.id);
                io.to(p.id).emit("role", { 
                    categoria: categoriaSorteada, 
                    tema: ehImpostor ? "???" : temaSorteado, 
                    impostor: ehImpostor 
                });
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