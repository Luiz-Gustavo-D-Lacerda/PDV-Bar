function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.on('entrar_terminal', (terminalId) => {
      socket.join(`terminal:${terminalId}`);
    });

    socket.on('entrar_mesa', (mesaId) => {
      socket.join(`mesa:${mesaId}`);
    });

    socket.on('entrar_garcom', () => {
      socket.join('garcom');
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { setupSocket };
