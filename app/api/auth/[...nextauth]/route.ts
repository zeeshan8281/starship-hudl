import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discordId = profile.id
        token.discordUsername = profile.username
        token.discordDiscriminator = profile.discriminator
        token.discordAvatar = profile.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.discordId = token.discordId as string
        session.user.discordUsername = token.discordUsername as string
        session.user.discordDiscriminator = token.discordDiscriminator as string
        session.user.discordAvatar = token.discordAvatar as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
})

export { handler as GET, handler as POST }
