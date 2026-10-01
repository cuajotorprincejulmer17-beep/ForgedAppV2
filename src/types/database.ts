/**
 * Types for the live FORGED Supabase schema.
 *
 * The schema itself is already applied to the project and is NOT
 * managed from this codebase (no migrations live here). These types
 * are a hand-authored mirror of that schema so the Supabase client and
 * every service function get compile-time safety.
 *
 * If the live schema ever changes, update this file to match — never
 * the other way around.
 */

export type UserStatus = "online" | "idle" | "dnd" | "invisible";
export type CommunityRole = "owner" | "admin" | "member";
export type SpaceType = "text" | "voice" | "announcement" | "forum";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type NotificationType =
  | "mention"
  | "friend_request"
  | "friend_accepted"
  | "message"
  | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          avatar_seed: string;
          identity_glow_id: string | null;
          tutorial_completed: boolean;
          status: UserStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_seed?: string;
          identity_glow_id?: string | null;
          tutorial_completed?: boolean;
          status?: UserStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_seed?: string;
          identity_glow_id?: string | null;
          tutorial_completed?: boolean;
          status?: UserStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon_url: string | null;
          banner_url: string | null;
          owner_id: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon_url?: string | null;
          banner_url?: string | null;
          owner_id: string;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon_url?: string | null;
          banner_url?: string | null;
          owner_id?: string;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: CommunityRole;
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: CommunityRole;
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: CommunityRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          community_id: string;
          name: string;
          type: SpaceType;
          category: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          name: string;
          type?: SpaceType;
          category?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          name?: string;
          type?: SpaceType;
          category?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          content: string;
          reply_to_id: string | null;
          created_at: string;
          edited_at: string | null;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          content: string;
          reply_to_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          content?: string;
          reply_to_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
        };
        Relationships: [];
      };
      message_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        Update: {
          message_id?: string;
          user_id?: string;
          emoji?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: FriendshipStatus;
        };
        Relationships: [];
      };
      dm_conversations: {
        Row: {
          id: string;
        };
        Insert: {
          id?: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [];
      };
      dm_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dm_messages: {
        Row: {
          id: string;
          conversation_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          community_id: string;
          code: string;
          created_by: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          community_id: string;
          code: string;
          created_by: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          community_id?: string;
          code?: string;
          created_by?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_community: {
        Args: {
          p_name: string;
          p_slug: string;
          p_description?: string | null;
          p_is_public?: boolean;
        };
        Returns: string;
      };
      join_community: {
        Args: { p_cid: string };
        Returns: void;
      };
      join_by_invite: {
        Args: { p_code: string };
        Returns: string;
      };
      start_dm: {
        Args: { other_user: string };
        Returns: string;
      };
    };
    Enums: {
      user_status: UserStatus;
      community_role: CommunityRole;
      space_type: SpaceType;
      friendship_status: FriendshipStatus;
      notification_type: NotificationType;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The only profile fields a user-facing profile update path may send.
 * System-controlled profile fields deliberately do not appear here.
 */
export type EditableProfileFields = {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember =
  Database["public"]["Tables"]["community_members"]["Row"];
export type Space = Database["public"]["Tables"]["spaces"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageReaction =
  Database["public"]["Tables"]["message_reactions"]["Row"];
export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
export type DmConversation =
  Database["public"]["Tables"]["dm_conversations"]["Row"];
export type DmParticipant =
  Database["public"]["Tables"]["dm_participants"]["Row"];
export type DmMessage = Database["public"]["Tables"]["dm_messages"]["Row"];
export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
