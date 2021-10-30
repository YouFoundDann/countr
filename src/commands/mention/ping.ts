import { MentionCommand } from "../../types/command";
import { msToTime } from "../../utils/time";

export default {
  execute: async message => message.channel.send("〽️ Pinging...").then(m => {
    m.edit(`🏓 Server latency is \`${m.createdTimestamp - message.createdTimestamp}ms\`, API latenchy is \`${Math.round(message.client.ws.ping)}ms\` and my uptime is \`${msToTime(message.client.uptime || 0)}\``);
    return m;
  })
} as MentionCommand;