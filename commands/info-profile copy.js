const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");

module.exports = {
    name: "profile",
    category: "info",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true
        });
        if (status) return ctx.reply(message);


        try {
            const senderNumber = ctx.sender.jid.split("@")[0];
            const [coin, premium,TicTacToe,] = await Promise.all([
                global.db.get(`user.${senderNumber}.coin`) || "-",
                global.db.get(`user.${senderNumber}.isPremium`) ? "Ya" : "Tidak",
                global.db.get(`user.${senderNumber}.TicTacToe`) || "-",
            ]);

            // No need to fetch or handle profile picture URL

            return await ctx.reply({
                text: `${quote(`Nama: ${ctx.sender.pushName}`)}\n` +
                    `${quote(`Premium: ${premium}`)}\n` +
                    `${quote(`Koin: ${coin}`)}\n` +
                    `${quote(`TicTacToe Trofi: ${TicTacToe}`)}` +
                    "\n" +
                    global.msg.footer,
            });
        } catch (error) {
            console.error("Error:", error);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};
