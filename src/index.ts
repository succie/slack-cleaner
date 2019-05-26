import { map } from "lodash";
import Config from "./config";
import Slack from "./slack";

async function main() {
  const config = Config.load();

  const slack = new Slack.API(config.token.bot, config.token.user);

  const joinedChannels = await slack
    .channels()
    .then(channels => channels.filter(channel => channel.is_member));

  console.log(
    `Joined channels of cleaner is ${map(joinedChannels, "name").join(", ")}`
  );

  await Promise.all(
    Object.entries(joinedChannels).map(async ([_, channel]) => {
      const messages = await slack.messages(channel, { asc: true });

      console.log(`${channel.name} has ${messages.length} messages.`);

      const thisChannelSetting = config.channels.find(
        setting => setting.name === channel.name
      );

      const maxMessageNumber =
        thisChannelSetting && thisChannelSetting.maxMessageNumber !== undefined
          ? thisChannelSetting.maxMessageNumber
          : config.default.maxMessageNumber;

      if (messages.length > maxMessageNumber) {
        console.log(
          `${channel.name} exceeds ${messages.length -
            maxMessageNumber} messages.`
        );

        const deleteMessages = messages.slice(
          0,
          messages.length - maxMessageNumber
        );

        await Promise.all(
          deleteMessages.map(async message => {
            await slack.deleteMessage(channel, message);
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
