import { WebClient } from "@slack/web-api";

namespace Slack {
  export interface Channel {
    id: string;
    name: string;
    is_channel: boolean;
    created: number;
    creator: string;
    is_archived: boolean;
    is_general: boolean;
    name_normalized: string;
    is_shared: boolean;
    is_org_shared: boolean;
    is_member: boolean;
    is_private: boolean;
    is_mpim: boolean;
    members: string[];
    topic: {
      value: string;
      creator: string;
      last_set: number;
    };
    purpose: {
      value: string;
      creator: string;
      last_set: number;
    };
    previous_names: string[];
    num_members: number;
  }

  export interface Message {
    type: "message";
    user: string;
    text: string;
    ts: string;
  }

  export class API {
    private bot: WebClient;
    private user: WebClient;

    constructor(botToken: string, userToken: string) {
      this.bot = new WebClient(botToken);
      this.user = new WebClient(userToken);
    }

    async channels(): Promise<Channel[]> {
      const channels = await this.bot.channels
        .list()
        .then(res => res.channels as Channel[]);
      return channels;
    }

    async messages(
      channel: Channel,
      option?: { asc: boolean }
    ): Promise<Message[]> {
      const messages = await this.user.channels
        .history({
          channel: channel.id,
          count: 1000,
          oldest: channel.created.toString()
        })
        .then(res => res.messages as Message[]);
      if (option && option.asc) {
        return messages.reverse();
      }
      return messages;
    }

    async deleteMessage(channel: Channel, message: Message) {
      await this.user.chat.delete({
        channel: channel.id,
        ts: message.ts
      });
    }
  }
}

export default Slack;
