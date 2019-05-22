import { WebClient } from "@slack/web-api";
import { map } from "lodash";
import config from "config";

const bot = new WebClient(config.get("token.bot"));
const user = new WebClient(config.get("token.user"));

const MAX_MESSAGE_NUMBER = Number(config.get("default.maxMessageNumber"));

interface JointedChannel {
  id: string;
  name: string;
  created: string;
}

interface ChannelsSetting {
  name: string;
  maxMessageNumber: number;
}

async function main() {
  // Bot が参加しているチャンネル一覧.
  const joinedChannels: JointedChannel[] = await bot.channels
    .list()
    .then(res => {
      return (res.channels as any[])
        .filter(channel => {
          return !!channel.is_member;
        })
        .map(channel => {
          return {
            id: channel.id,
            name: channel.name,
            created: channel.created
          };
        });
    })
    .catch(err => {
      console.error(err);
      return [];
    });

  console.log(
    `Joined channels of cleaner is ${[...map(joinedChannels, "name")]}`
  );

  const channelSettings = config.get<ChannelsSetting[]>("channels");

  for await (let channel of joinedChannels) {
    const messages = await user.channels
      .history({
        channel: channel.id,
        count: 1000,
        // チャンネル作成時間がそのチャンネルの一番古い時間のため oldest に設定.
        oldest: channel.created
      })
      .then(res => {
        // 新しい順で返ってくるので, 古い順にする.
        return (res.messages as any[]).reverse();
      })
      .catch(err => {
        console.error(err);
        return [];
      });

    console.log(`${channel.name} has ${messages.length} messages.`);

    // チャンネル設定を探す.
    const thisChannelSetting = channelSettings.find(
      setting => setting.name === channel.name
    );
    // あった場合はその maxMessageNumber を設定し, 無ければ MAX_MESSAGE_NUMBER を設定する.
    const maxMessageNumber = thisChannelSetting
      ? thisChannelSetting.maxMessageNumber
      : MAX_MESSAGE_NUMBER;

    // maxMessageNumber を超えていた場合, メッセージ数 - maxMessageNumber 分のメッセージを消す.
    if (messages.length > maxMessageNumber) {
      console.log(
        `${channel.name} exceeds ${messages.length -
          maxMessageNumber} messages.`
      );
      for (let i = 0; i < messages.length - maxMessageNumber; i++) {
        await user.chat
          .delete({ channel: channel.id, ts: messages[i].ts })
          .catch(err => {
            console.error(err);
          });
      }
    }
  }
}

if (process.env.LOCAL) {
  main();
}

exports.handler = async () => {
  await main();
};
