import { map, flatten } from "lodash";
import Config from "./config";
import Slack from "./slack";

async function main() {
  const config = Config.load();

  const slack = new Slack.API(config.token.bot, config.token.user);

  const joinedChannels = await slack
    .channels()
    .then(channels => channels.filter(channel => channel.is_member));

  console.log(`Cleaner has joined ${map(joinedChannels, "name").join(", ")}.`);

  await Promise.all(
    Object.entries(joinedChannels).map(async ([_, channel]) => {
      // メッセージを時刻昇順で取得
      const messages = await slack.messages(channel, { asc: true });

      // メッセージにファイルが含まれている場合はファイルを取得
      // ただし, Slackbot が投稿した画像は削除しない.
      const files = flatten(messages
        .map(message => {
          if (message.user !== "USLACKBOT" && message.files)
            return message.files;
        })
        .filter(file => file !== undefined) as (Slack.File[])[]);

      // チャンネル設定があれば取得
      const thisChannelSetting = config.channels.find(
        setting => setting.name === channel.name
      );

      // チャンネル設定で maxMessageNumber が設定されていればそれを
      // されていなければデフォルト設定を使用する
      const maxMessageNumber =
        thisChannelSetting && thisChannelSetting.maxMessageNumber !== undefined
          ? thisChannelSetting.maxMessageNumber
          : config.default.maxMessageNumber;

      // チャンネル設定で deleteFiles が設定されていればそれを
      // されていなければデフォルト設定を使用する
      const shouldDeleteFiles =
        thisChannelSetting && thisChannelSetting.deleteFiles !== undefined
          ? thisChannelSetting.deleteFiles
          : config.default.deleteFiles;

      if (messages.length > maxMessageNumber) {
        console.log(
          `${channel.name} exceeds ${messages.length -
            maxMessageNumber} messages.`
        );

        // 削除対象のメッセージリスト
        const deleteMessages = messages.slice(
          0,
          messages.length - maxMessageNumber
        );

        // メッセージを削除
        await Promise.all(
          deleteMessages.map(async message => {
            await slack.deleteMessage(channel, message);
          })
        );

        // ファイルを削除
        if (shouldDeleteFiles) {
          await Promise.all(
            files.map(async file => {
              await slack.deleteFile(file);
            })
          );
        }
      }
    })
  );
}

if (process.env.LOCAL) {
  main();
}

exports.handler = async () => {
  await main();
};
