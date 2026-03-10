const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true });

bot.onText(/\/start/, (msg)=>{

const chatId = msg.chat.id;
const userId = msg.from.id;

bot.sendMessage(chatId,
`🎉 অভিনন্দন ${msg.from.first_name}

⬇️ নিচে আয় শুরু করুন বাটনে ক্লিক করুন!

🔗 আপনার রেফার লিংক:
https://t.me/Bd_Ads_Earn_Bot/app?startapp=${userId}`,
{
reply_markup:{
inline_keyboard:[

[
{
text:"আয় শুরু করুন",
web_app:{
url:"https://yourdomain.com"
}
}
],

[
{
text:"অফিশিয়াল নিউজ",
url:"https://t.me/zomato_app_official_channel"
}
],

[
{
text:"কাজের ভিডিও",
url:"https://t.me/your_channel"
}
],

[
{
text:"পেমেন্ট গ্রুপ",
url:"https://t.me/zomato_app_payment_proof"
}
]

]
}
});

});