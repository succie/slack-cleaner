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
    files?: File[];
  }

  export interface File {
    id: string;
    created: number;
    timestamp: number;
    name: string;
    title: string;
    mimetype: string;
    filetype: string;
    pretty_type: string;
    user: string;
    editable: boolean;
    size: number;
    mode: string;
    is_external: boolean;
    external_type: string;
    is_public: boolean;
    public_url_shared: boolean;
    display_as_bot: boolean;
    username: string;
    url_private: string;
    url_private_download: string;
    thumb_64: string;
    thumb_80: string;
    thumb_360: string;
    thumb_360_w: number;
    thumb_360_h: number;
    thumb_160: string;
    thumb_360_gif: string;
    image_exif_rotation: number;
    original_w: number;
    original_h: number;
    deanimate_gif: string;
    pjpeg: string;
    permalink: string;
    permalink_public: string;
    comments_count: number;
    is_starred: boolean;
    shares: object;
    channels: string[];
    groups: string[];
    ims: string[];
    has_rich_preview: boolean;
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

    async postMessage(channel: Channel, message: string) {
      await this.bot.chat.postMessage({ channel: channel.id, text: message });
    }

    async deleteMessage(channel: Channel, message: Message) {
      await this.user.chat.delete({
        channel: channel.id,
        ts: message.ts
      });
    }

    async deleteFile(file: File) {
      await this.user.files.delete({ file: file.id });
    }
  }
}

export default Slack;
