require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = '!';
const CATEGORIA_ID = '1358081315966156900'; // ID da categoria desejada
const CARGOS_PERMITIDOS = ['Gerente', '01', '02'];

client.once('ready', () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'registrar') {
        if (args.length < 3) {
            return message.reply('❌ Use: `!registrar Nome_Sobrenome ID cargo`');
        }

        const nome = args[0];
        const id = args[1];
        const cargoInformado = args[2].toLowerCase();
        const novoNick = `${id} | ${nome}`;

        try {
            const cargoDiscord = message.guild.roles.cache.find(r => r.name.toLowerCase() === cargoInformado);
            if (!cargoDiscord) {
                return message.reply(`❌ Cargo "${cargoInformado}" não encontrado no servidor.`);
            }

            // Dá o cargo
            await message.member.roles.add(cargoDiscord);

            // Muda o nick
            await message.member.setNickname(novoNick);

            // Se não for membro, termina aqui com uma reação
            if (cargoInformado !== 'membro') {
                return message.react('✅');
            }

            // Verifica se já tem canal
            const canalExistente = message.guild.channels.cache.find(canal =>
                canal.name.includes(`farm-${id}`) || canal.name.includes(`farm-${nome}`)
            );
            if (canalExistente) {
                return message.reply('❌ Você já se registrou! Só é permitido um registro por pessoa.');
            }

            // Permissões do canal
            const permissoes = [
                {
                    id: message.guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: message.author.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                }
            ];

            CARGOS_PERMITIDOS.forEach(cargoNome => {
                const role = message.guild.roles.cache.find(r => r.name === cargoNome);
                if (role) {
                    permissoes.push({
                        id: role.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    });
                }
            });

            const canal = await message.guild.channels.create({
                name: `🎁farm-${novoNick}`,
                type: 0,
                parent: CATEGORIA_ID,
                permissionOverwrites: permissoes,
                reason: `Canal de registro para ${message.author.tag}`
            });

            // Envia a mensagem dentro do canal criado
            await canal.send("📸 Aqui você deixará diariamente o print diário do farm, com 'dd/mm' que esta farm equivale.");

            // Reage à mensagem do comando
            await message.react('✅');

        } catch (error) {
            console.error(error);
            message.reply('❌ Ocorreu um erro ao registrar. Verifique permissões ou dados digitados.');
        }
    }
});

client.login(TOKEN);
