const {
    quote
} = require("@mengkodingan/ckptw");
const { aliases } = require("./main-menu");

module.exports = {
    name: "changelogs",
    aliases: ["cl"],
    category: "info",
    code: async (ctx) => {
        const [userLanguage] = await Promise.all([
            global.db.get(`user.${ctx.sender.jid.replace(/@.*|:.*/g, "")}.language`)
        ]);

        return ctx.reply(await global.tools.msg.translate(`Changelogs ${global.bot.version}\n\n- Added TicTacToe\n- Fixed Some Bugs\n- UI Improvement`, userLanguage)); // Can be changed according to your wishes.
    }
};