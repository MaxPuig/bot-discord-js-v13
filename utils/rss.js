let Parser = require('rss-parser');
let parser = new Parser();
const fs = require('fs');
let rssChannels = [];

//Cada 15 mins, si hay una oferta nueva la envía
async function sendRSS(client) {
    rssChannels = JSON.parse(fs.readFileSync('./data/rss.json', 'utf-8'));
    try {
        if (rssChannels.length > 0) {
            let oferta = await freeGames();
            if (oferta.length > 0) {
                for (const channel in rssChannels) {
                    client.channels.cache.get(rssChannels[channel]).send(oferta);
                }
            }
        }
    } catch (error) { }
};


//Establece el canal donde tiene que enviar los mensajes
function setRSSchannel(msg, prefix) {
    if (msg.content == `${prefix}rss` && msg.member.permissions.has('ADMINISTRATOR')) {
        rssChannels = JSON.parse(fs.readFileSync('./data/rss.json', 'utf-8'));
        if (rssChannels.indexOf(msg.channel.id) !== -1) {
            msg.channel.send('El canal ya estaba establecido. `' + prefix + 'rss borrar` Para dejar de enviar las ofertas.');
        } else {
            rssChannels.push(msg.channel.id)
            fs.writeFileSync('./data/rss.json', JSON.stringify(rssChannels));
            msg.channel.send('Canal establecido. `' + prefix + 'rss borrar` Para dejar de enviar las ofertas.');
        }
    }
};


function deleteRSSchannel(msg, prefix) {
    if (msg.content == `${prefix}rss borrar` && msg.member.permissions.has('ADMINISTRATOR')) {
        rssChannels = JSON.parse(fs.readFileSync('./data/rss.json', 'utf-8'));
        const index = rssChannels.indexOf(msg.channel.id);
        if (index > -1) { rssChannels.splice(index, 1); }
        fs.writeFileSync('./data/rss.json', JSON.stringify(rssChannels));
        msg.channel.send('Este canal ya no recibirá ofertas. \n`' + prefix + 'rss` para volver a recibirlas. (Solo admin)');
    }
};


//Crea un string con las nuevas ofertas
async function freeGames() {
    let feed = await parser.parseURL('https://steamcommunity.com/groups/GrabFreeGames/rss/');
    let nombres;
    let nombresNuevos = [];
    let mensaje = '';
    try {
        nombres = JSON.parse(fs.readFileSync('./data/freeGames.json', 'utf-8'));
    } catch (error) {
        nombres = [];
    }
    feed.items.forEach(item => {
        nombresNuevos.push(item.title);
        if (!nombres.includes(item.title)) {
            if (!mensaje.startsWith('**Nueva Oferta**')) {
                mensaje += '**Nueva Oferta**\n';
            }
            let links = item.content.split('href="');
            links.shift();
            let gameLinks = [];
            for (let link of links) {
                if (link.includes("discord.gg")) { break; }
                link = link.split('"')[0];
                link = link.replace('https://steamcommunity.com/linkfilter/?url=', '');
                link = link.replace('store.epicgames.com/GRABFREEGAMES/', 'www.epicgames.com/store/es-ES/p/');
                gameLinks.push(link);
            }
            mensaje += item.title + '\n' + gameLinks.join('\n') + '\n\n';
        }
    });
    fs.writeFileSync('./data/freeGames.json', JSON.stringify(nombresNuevos));
    return mensaje.substring(0, 2000);
};



module.exports = { sendRSS, setRSSchannel, deleteRSSchannel };