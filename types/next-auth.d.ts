declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId?: string
      discordUsername?: string
      discordDiscriminator?: string
      discordAvatar?: string
    }
  }

  interface JWT {
    discordId?: string
    discordUsername?: string
    discordDiscriminator?: string
    discordAvatar?: string
  }
}
