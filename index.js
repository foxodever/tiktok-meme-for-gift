/* 
Подключение библиотек
*/
const { WebcastPushConnection } = require('tiktok-livestream-chat-connector');
const fs = require('fs');
const express = require('express')
const app = express();

/*
Конфиги
*/
const gifts = require('./gift.json');
const config = require('./config.json');

if (config.username.includes("@")) config.username.replace("@", ""); // Убираю @ из ника


// Дефолтный видос
let crnt = config.default;

app.get('/static', function(req, res) {
    let ph = atob(req.query.p);
    res.sendFile(ph)
});
/*
Для отображения картинки из файловой системы
*/
app.post('/api', function(req, res) {
    res.send(crnt)
});

/*
Главная страница которая и будет показывать видео
Мне лень делать норм обнову так что вот AJAX
Будут идеи как поменять? Пишите
*/
app.get('/', function(req, res) {
    res.send(`
<script src="https://code.jquery.com/jquery-latest.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
obr()
function isValidUrl(string) {
    if(string.includes("file")) {
        return true;
    } else {
        return false;
    }
};
function obr() {
    $.ajax({
        type: "POST",
        url: "/api",
        data: {
            a:1
        }
    }).done(function(r) {
        setTimeout(obr, 1000);
        if(r.includes(".mp4")) {
            if($('#info').html().includes(r) || $('#info').html().includes(encodeURIComponent(btoa(r)))) return;
            if(isValidUrl(r)) {
                $('#info').html(\`
                <video id="vid" width="100%" controls="none">
                 <source src="\`+r+\`" type='video/mp4'>
                </video>\`);
            } else {
                $('#info').html(\`
                <video id="vid"  width="100%" controls="none">
                 <source src="/static?p=\`+encodeURIComponent(btoa(r))+\`" type='video/mp4'>
                </video>\`);
            }
            document.getElementById("vid").play();
            document.getElementById("vid").addEventListener('ended', (event) => {
                document.getElementById("vid").play();
            })
        } else {
            if(isValidUrl(r)) {
                $('#info').html("<img style=\\"max-width:100%\\" src='"+r+"'>");
            } else {
                $('#info').html("<img style=\\"max-width:100%\\" src='/static?p="+encodeURIComponent(btoa(r))+"'>");
            }
        }
    });
}
</script>
<div id="info"></div>`)
});

// Подготавливаем комнату
let tiktokChatConnection = new WebcastPushConnection(config.username);

/*
Подклчюаемся
*/
tiktokChatConnection.connect().then(state => {}).catch(err => {
    // Ловим ошибку
    console.error('Не удалось подключится к комнате', err);
    process.exit("-1")
})

/*
Обработка подарков =)
*/
tiktokChatConnection.on('gift', data => {
    if (gifts[data.giftId].file) crnt = gifts[data.giftId].file;
    console.log("Подарок | " + data.uniqueId + " дарит " + gifts[data.giftId].name);
})

/*
Ловим конец стрима
*/
tiktokChatConnection.on('streamEnd', () => {
    console.clear();
    console.log("Стрим закончился");
    process.exit(1);
})


/*
Запуск HTTP сервера
*/
app.listen(config.port, () => {
    console.log("HTTP сервер запущен на порту " + config.port)
})