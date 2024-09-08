const {
    createUrl
} = require("./api.js");
const {
    convertMsToDuration
} = require("./general.js");
const {
    translate
} = require("./msg.js");
const pkg = require("../package.json");
const {
    bold,
    italic,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const moment = require("moment-timezone");
const fetch = require("node-fetch");

async function get(type, ctx) {
    const [userLanguage] = await Promise.all([
        global.db.get(`user.${ctx.sender.jid.replace(/@.*|:.*/g, "")}.language`)
    ]);

    let text = "";

    const generateMenuText = async (cmds, tags) => {
        let menuText =
            `${await translate(`Hai ${ctx.sender.pushName || "Kak"}, berikut adalah daftar perintah yang tersedia!`, userLanguage)}\n` +
            "\n" +
            `${quote(await translate(`Waktu aktif: ${convertMsToDuration(Date.now() - global.system.startTime) || "kurang dari satu detik."}`, userLanguage))}\n` +
            `${quote(await translate(`Tanggal: ${moment.tz(global.system.timeZone).format("DD/MM/YY")}`, userLanguage))}\n` +
            `${quote(await translate(`Waktu: ${moment.tz(global.system.timeZone).format("HH:mm:ss")}`, userLanguage))}\n` +
            `${quote(`${await translate("Versi Bot", userLanguage)}: ${pkg.version}`)}\n` +
            `${quote(`Prefix: ${ctx._used.prefix}`)}\n` +
            "\n" +
            `${italic(await translate("Laporkan ke Owner jika terjadi kesalahan!", userLanguage))}\n` +
            `${global.msg.readmore}\n`;

        for (const category of Object.keys(tags)) {
            const categoryCommands = Array.from(cmds.values())
                .filter(command => command.category === category)
                .map(command => ({
                    name: command.name,
                    aliases: command.aliases
                }));

            if (categoryCommands.length > 0) {
                menuText += `${bold(tags[category])}\n`;

                categoryCommands.forEach(cmd => {
                    menuText += quote(monospace(`${ctx._used.prefix || "/"}${cmd.name}`));
                    if (category === "main" && cmd.aliases && cmd.aliases.length > 0) {
                        menuText += `\n` + cmd.aliases.map(alias => quote(monospace(`${ctx._used.prefix || "/"}${alias}`))).join("\n");
                    }
                    menuText += "\n";
                });

                menuText += "\n";
            }
        }

        menuText += global.msg.footer;
        return menuText;
    };

    try {
        switch (type) {
            case "disable_enable": {
                const deList = ["antilink", "welcome"];
                text = deList.map(item => `${quote(item)}`).join("\n");
                text += "\n" + global.msg.footer;
                break;
            }

            case "menu": {
                const cmds = ctx._self.cmd;
                const tags = {
                    main: "Main",
                    profile: "Profile",
                    ai: "AI",
                    game: "Game",
                    converter: "Converter",
                    downloader: "Downloader",
                    fun: "Fun",
                    group: "Group",
                    internet: "Internet",
                    maker: "Maker",
                    tools: "Tools",
                    owner: "Owner",
                    info: "Info",
                    "": "No Category"
                };

                if (!cmds || cmds.size === 0) {
                    text = quote(`⚠ ${await translate("Terjadi kesalahan: Tidak ada perintah yang ditemukan.", userLanguage)}`);
                } else {
                    text = generateMenuText(cmds, tags);
                }
                break;
            }

            default: {
                text = quote(`⚠ ${await translate("Terjadi kesalahan: Jenis daftar tidak dikenal.", userLanguage)}`);
                break;
            }
        }
    } catch (error) {
        text = quote(`⚠ ${await translate("Terjadi kesalahan", userLanguage)}: ${error.message}`);
    }

    return text;
}

module.exports = {
    get
};