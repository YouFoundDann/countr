import { NewsChannel, TextChannel } from "discord.js";
import { CountingData } from "./countingData";
import { propertyTypes, Property, PropertyValue } from "./properties";

interface Action {
  short: string;
  long?: string;
  properties?: Array<Property>;
  explanation(properties: Array<PropertyValue>): string;
  run(data: CountingData, properties: Array<PropertyValue>): Promise<boolean>
}

const actions: Record<string, Action> = {
  "giverole": {
    short: "Give a role to the user",
    long: "This will add a role to the user who triggered this flow.",
    properties: [ propertyTypes.role ],
    explanation: ([ role ]: [ string ]) => `Add the user to ${role}`,
    run: async ({ message: { member }}, [ roleId ]: [ string ]) => {
      await member?.roles.add(roleId).catch(() => null);
      return false;
    }
  },
  "takerole": {
    short: "Remove a role from the user",
    long: "This will remove a role from the user who triggered this flow.",
    properties: [ propertyTypes.role ],
    explanation: ([ role ]: [ string ]) => `Remove the user from ${role}`,
    run: async ({ message: { member }}, [ roleId ]: [ string ]) => {
      await member?.roles.remove(roleId).catch(() => null);
      return false;
    }
  },
  "prunerole": {
    short: "Remove everyone from a role",
    long: [
      "This will remove everyone from this role.",
      "Note: This might not remove everyone from the role due to caching. Some inactive users might not lose their role."
    ].join("\n"),
    properties: [ propertyTypes.role ],
    explanation: ([ role ]: [ string ]) => `Remove everyone from ${role}`,
    run: async ({ message: { guild }}, [ roleId ]: [ string ]) => {
      const role = guild?.roles.resolve(roleId);
      if (role) await Promise.all(role.members.map(async member => await member.roles.remove(roleId).catch()));
      return false;
    }
  },
  "pin": {
    short: "Pin the count message",
    explanation: () => "Pin the count",
    run: async ({ countingMessage }) => {
      await countingMessage.pin().catch(async () => {
        const pinned = await countingMessage.channel.messages.fetchPinned().catch(() => null);
        if (pinned?.size == 50) await pinned.last()?.unpin().then(() => countingMessage.pin().catch()).catch();
      });
      return false;
    }
  },
  "sendmessage": {
    short: "Send a message",
    long: "This will sned a message in any channel you'd like",
    properties: [ propertyTypes.channel, propertyTypes.text ],
    explanation: ([ channel, text ]: [ string, string ]) => `Send a message in ${channel}: \`\`\`${text}\`\`\``,
    run: async ({ count, score, message: { guild, member, author, content } }, [ channelId, text ]: [ string, string ]) => {
      const channel = guild?.channels.resolve(channelId);
      if (channel && channel.isText()) await channel.send({
        content: text
          .replace(/{count}/gi, count.toString())
          .replace(/{mention}/gi, member?.toString() || "")
          .replace(/{tag}/gi, author.tag)
          .replace(/{username}/gi, author.username)
          .replace(/{nickname}/gi, member?.displayName || author.username)
          .replace(/{everyone}/gi, guild?.roles.everyone.toString() || "")
          .replace(/{score}/gi, score.toString())
          .replace(/{content}/gi, content),
        allowedMentions: { parse: [ "everyone", "users", "roles" ] }
      }).catch();
      return false;
    }
  },
  "lock": {
    short: "Lock the counting channel",
    long: "This will lock the counting channel for the everyone-role",
    explanation: () => "Lock the counting channel",
    run: async ({ message: { channel, guild } }) => {
      if (guild && (channel instanceof TextChannel || channel instanceof NewsChannel)) await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false });
      return false;
    }
  },
  "reset": {
    short: "Reset the count",
    explanation: () => "Reset the count to 0",
    run: async ({ message: { channel }, gdb }) => {
      const dbChannel = gdb.channels.get(channel.id);
      if (dbChannel) {
        dbChannel.count = { number: 0 };
        return true;
      } else return false;
    }
  }
};

export default actions;