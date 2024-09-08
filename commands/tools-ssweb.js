const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");

module.exports = {
    name: "ssweb",
    category: "tools",
    code: async (ctx) => {
        const [userLanguage] = await Promise.all([
            global.db.get(`user.${ctx.sender.jid.replace(/@.*|:.*/g, "")}.language`)
        ]);

        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            coin: 3
        });
        if (status) return ctx.reply(message);

        const url = ctx.args[0] || null;

        if (!url) return ctx.reply(
            `${quote(`📌 ${await global.tools.msg.translate(global.msg.argument, userLanguage)}`)}\n` +
            quote(`${await global.tools.msg.translate("Contoh", userLanguage)}: ${monospace(`${ctx._used.prefix + ctx._used.command} https://example.com/`)}`)
        );

        const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
        if (!urlRegex.test(url)) return ctx.reply(global.msg.urlInvalid);

        try {
            const apiUrl = global.tools.api.createUrl("chiwa", "/api/ssweb", {
                url
            });

            return await ctx.reply({
                image: {
                    url: apiUrl
                },
                mimetype: mime.contentType("png"),
                caption: `${quote(`URL: ${url}`)}\n` +
                    "\n" +
                    global.msg.footer
            });
        } catch (error) {
            console.error("Error:", error);
            return ctx.reply(quote(`⚠ ${await global.tools.msg.translate("Terjadi kesalahan", userLanguage)}: ${error.message}`));
        }
    }
};