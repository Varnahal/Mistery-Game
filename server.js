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
        "Objetos Comuns": [
            "Escova de Dente", "Controle Remoto", "Chaveiro", "Travesseiro", "Guarda-chuva", 
            "Garrafa de Café", "Relógio de Pulso", "Óculos de Sol", "Mochila", "Tesoura",
            "Lâmpada", "Cadeira de Escritório", "Espelho", "Fone de Ouvido"
        ],
        "Eletrônicos e Tech": [
            "Smartphone", "Notebook", "Videogame", "Roteador Wi-Fi", "Drone", 
            "Câmera Fotográfica", "Calculadora", "Micro-ondas", "Televisão", "Power Bank"
        ],
        "Ferramentas e Construção": [
            "Martelo", "Furadeira", "Chave de Fenda", "Trena", "Escada", 
            "Serrote", "Alicate", "Pá", "Lanterna", "Capacete de Obra"
        ],
        "Lugares Públicos": ["Praia", "Hospital", "Escola", "Restaurante", "Aeroporto", "Cinema", "Zoológico", "Academia"],
        "Aventura e Ficção": ["Navio Pirata", "Estação Espacial", "Castelo Medieval", "Fundo do Mar", "Escola de Magia"]
    };

    const nomesCategorias = Object.keys(categorias);
    socket.emit("lista_categorias", nomesCategorias);

    // ... restante do código anterior ...

    socket.on("start", (categoriaEscolhida) => {
        // Verifica se é o líder
        if (players.length > 0 && socket.id === players[0].id) {
            
            let categoriaFinal = categoriaEscolhida;

            // Se for aleatório, sorteia uma categoria primeiro
            if (categoriaEscolhida === "aleatorio") {
                const chaves = Object.keys(categorias);
                categoriaFinal = chaves[Math.floor(Math.random() * chaves.length)];
            }

            // Sorteia o tema dentro da categoria escolhida (ou sorteada)
            const listaLocais = categorias[categoriaFinal];
            tema = listaLocais[Math.floor(Math.random() * listaLocais.length)];
            
            impostor = players[Math.floor(Math.random() * players.length)];

            io.emit("preparing_start");

            setTimeout(() => {
                players.forEach(p => {
                    const ehImpostor = (p.id === impostor.id);
                    io.to(p.id).emit("role", { 
                        categoria: categoriaFinal, 
                        tema: ehImpostor ? "???" : tema, 
                        impostor: ehImpostor 
                    });
                });
            }, 3500);
        }
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