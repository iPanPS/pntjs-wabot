const { quote } = require("@mengkodingan/ckptw");
const axios = require("axios");
const session = new Map();

module.exports = {
    name: "tictactoe",
    aliases: ["ttt"],
    category: "game",
    code: async (ctx) => {
        const [userLanguage] = await Promise.all([
            global.db.get(`user.${ctx.sender.jid.replace(/@.*|:.*/g, "")}.language`)
        ]);
        const { status, message } = await global.handler(ctx, { banned: true });

        if (status) return ctx.reply(message);

        // Ensure the game is only allowed in group chats
        if (!ctx.isGroup) return ctx.reply(quote("⚠ This game can only be played in a group chat!"));

        // Check if a game is already running in the group
        if (session.has(ctx.id)) {
            const currentSession = session.get(ctx.id);
            const { players } = currentSession;

            // If both players have joined, ignore further joins
            if (players['X'] && players['O']) return await ctx.reply(quote("⚠ A game session is already in progress!"));
        } else {
            // Initialize a new session if none exists
            session.set(ctx.id, { board: Array(9).fill(null), players: {}, playerXTurn: true });
        }

        const currentSession = session.get(ctx.id);
        const senderId = ctx.sender?.jid?.replace(/@.*|:.*/g, "") || ctx.message?.key?.participant?.replace(/@.*|:.*/g, "");

        // Check if senderId was correctly retrieved
        if (!senderId) {
            console.error("Sender ID is missing or incorrectly formatted.");
            return ctx.reply(quote("⚠ Unable to retrieve your ID. Please try again."));
        }

        // Assign players
        if (!currentSession.players['X']) {
            currentSession.players['X'] = senderId;
            await ctx.reply(quote(`${await global.tools.msg.translate(`🕹️ Player ❌ (${senderId}) has joined the game! Waiting for another player to join as ⭕...`, userLanguage)}`));
        } else if (!currentSession.players['O'] && currentSession.players['X'] !== senderId) {
            currentSession.players['O'] = senderId;
            await ctx.reply(quote(`🕹️ Player ⭕ (${senderId}) has joined the game! Game starting...`));
            startGame(ctx, currentSession);
        } else {
            return await ctx.reply(quote("⚠ You are already in the game or the game already has two players!"));
        }
    }
};

// Function to start the game
async function startGame(ctx, currentSession) {
    const [userLanguage] = await Promise.all([
        global.db.get(`user.${ctx.sender.jid.replace(/@.*|:.*/g, "")}.language`)
    ]);
    const { board, players } = currentSession;
    const timeout = 90000; // Timeout duration for each turn

    const displayBoard = (board) => {
        return `
        ${board[0] || '1️⃣'} | ${board[1] || '2️⃣'} | ${board[2] || '3️⃣'}
        ${board[3] || '4️⃣'} | ${board[4] || '5️⃣'} | ${board[5] || '6️⃣'}
        ${board[6] || '7️⃣'} | ${board[7] || '8️⃣'} | ${board[8] || '9️⃣'}
        `.replace(/X/g, '❌').replace(/O/g, '⭕'); // Replace X and O with emojis
    };

    ctx.reply(
        `${quote("🕹️ Tic-Tac-Toe Game Started!")} \n` +
        `${displayBoard(board)}\n` +
        quote(`It's ${players['X']}'s turn (❌). Send a number (1-9) to place your mark.`) +
        "\n" + global.msg.footer
    );

    const collector = ctx.MessageCollector({
        filter: (m) => {
            // Collect messages only from valid players and within the group context
            console.log("Message received:", m); // Debugging statement
            const user = m?.sender?.jid?.replace(/@.*|:.*/g, "") || m?.key?.participant?.replace(/@.*|:.*/g, "");
            console.log("Message received from:", user); // Debugging statement
            return [players['X'], players['O']].includes(user);
        },
        time: timeout
    });

    collector.on("collect", async (m) => {
        console.log("Collected message:", m); // Debugging statement
        const user = m?.sender?.jid?.replace(/@.*|:.*/g, "") || m?.key?.participant?.replace(/@.*|:.*/g, "");
        console.log("Collected message from user:", user); // Debugging statement

        const { board, players, playerXTurn } = session.get(ctx.id);

        // Check if sender information is missing
        if (!user) {
            console.error("Sender information missing."); // Debugging statement
            return;
        }

        // Determine whose turn it is
        const currentPlayer = playerXTurn ? 'X' : 'O';
        const currentPlayerId = players[currentPlayer];
        console.log("Current player:", currentPlayer, "ID:", currentPlayerId); // Debugging statement

        // Check if it's the correct player's turn
        if (user !== currentPlayerId) {
            await ctx.reply(quote(`${await global.tools.msg.translate("⚠ It's not your turn! Wait for the other player.", userLanguage)}`));
            return;
        }

        const position = parseInt(m.content.trim(), 10);
        console.log("Position received:", position); // Debugging statement
        if (isNaN(position) || position < 1 || position > 9) {
            await ctx.reply(quote(`${await global.tools.msg.translate("⚠ Invalid input! Please send a number between 1 and 9", userLanguage)}`));
            return;
        }

        if (board[position - 1]) {
            await ctx.reply(quote("⚠ This position is already taken! Choose another one."));
            return;
        }

        // Place mark on the board
        board[position - 1] = currentPlayer === 'X' ? '❌' : '⭕';

        if (checkWin(board, currentPlayer === 'X' ? '❌' : '⭕')) {
            session.delete(ctx.id);
            await ctx.reply(`${quote(`🏆 Player ${currentPlayer === 'X' ? '❌' : '⭕'} (${currentPlayerId}) wins!`)}\n${displayBoard(board)}`);
            const TicTacToe = 1;
            await global.db.add(`user.${currentPlayerId}.userTicTacToe`, TicTacToe);
            await ctx.reply(`${quote(`Trophy ${currentPlayer === 'X' ? '❌' : '⭕'} (${currentPlayerId}) +1 !`)}`);
         
            return collector.stop();
        }

        if (board.every(cell => cell)) {
            session.delete(ctx.id);
            await ctx.reply(`${quote("🤝 It's a draw!")} \n${displayBoard(board)}`);
            return collector.stop();
        }

        // Switch turns
        currentSession.playerXTurn = !playerXTurn; // Toggle turn
        session.set(ctx.id, currentSession); // Update session with new turn

        await ctx.reply(
            `${quote(`It's ${players[currentSession.playerXTurn ? 'X' : 'O']}'s turn (${currentSession.playerXTurn ? '❌' : '⭕'}).`)}\n` +
            `${displayBoard(board)}`
        );
    });

    collector.on("end", async () => {
        if (session.has(ctx.id)) {
            session.delete(ctx.id);
            return ctx.reply(quote("⌛ Game ended due to inactivity."));
        }
    });
}

// Function to check for a win
function checkWin(board, player) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]            // Diagonals
    ];
    return winConditions.some(condition =>
        condition.every(index => board[index] === player)
    );
}
