import { map, flatten } from "lodash";
import Config from "./config";
import Slack from "./slack";

async function main() {
  const config = Config.load();

  const slack = new Slack.API(config.token.bot, config.token.user);

  // 参加しているチャンネル
  const joinedChannels = await slack
    .channels()
    .then(channels => channels.filter(channel => channel.is_member));

  console.log(`Cleaner has joined ${map(joinedChannels, "name").join(", ")}.`);

  await Promise.all(
    Object.entries(joinedChannels).map(async ([_, channel]) => {
      // チャンネル設定があれば取得
      const thisChannelSetting = config.channels.find(
        setting => setting.name === channel.name
      );

      // チャンネル設定で progressMessages が設定されていればそれを
      // されていなければデフォルト設定を使用する
      const progressMessages =
        thisChannelSetting && thisChannelSetting.progressMessages != undefined
          ? thisChannelSetting.progressMessages
          : config.default.progressMessages;

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

      // メッセージを時刻昇順で取得
      const messages = await slack.messages(channel, { asc: true });

      // Start progress message
      if (progressMessages && progressMessages.start) {
        await Promise.all(
          progressMessages.start.map(async pm => {
            await slack.postMessage(channel, pm);
          })
        );
      }

      // メッセージにファイルが含まれている場合はファイルを取得
      // ただし, Slackbot が投稿した画像は削除しない.
      const files = flatten(messages
        .map(message => {
          if (message.user !== "USLACKBOT" && message.files)
            return message.files;
        })
        .filter(file => file !== undefined) as (Slack.File[])[]);

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

        // Running progress message
        if (progressMessages && progressMessages.running) {
          await Promise.all(
            progressMessages.running.map(async pm => {
              await slack.postMessage(channel, pm);
            })
          );
        }

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

      // End progress message
      if (progressMessages && progressMessages.end) {
        await Promise.all(
          progressMessages.end.map(async pm => {
            await slack.postMessage(channel, pm);
          })
        );
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
