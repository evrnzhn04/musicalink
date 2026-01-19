create table public.profiles (
  id uuid not null,
  username text null,
  display_name text null,
  avatar_url text null,
  spotify_id text not null,
  email text null,
  bio text null,
  current_track jsonb null,
  is_online boolean null default false,
  last_seen timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_spotify_id_key unique (spotify_id)
) TABLESPACE pg_default;


create table public.profile_songs (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  spotify_track_id text not null,
  track_name text not null,
  artist_name text not null,
  album_image_url text null,
  "order" smallint null default 0,
  created_at timestamp with time zone null default now(),
  constraint profile_songs_pkey primary key (id)
) TABLESPACE pg_default;


create table public.messages (
  id bigserial not null,
  conversation_id text not null,
  sender_id uuid not null,
  receiver_id uuid not null,
  content text not null,
  message_type text null default 'text'::text,
  track_data jsonb null,
  is_read boolean null default false,
  read_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_receiver_id_fkey foreign KEY (receiver_id) references profiles (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_conversation on public.messages using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at desc) TABLESPACE pg_default;


create table public.friendships (
  id bigserial not null,
  requester_id uuid not null,
  receiver_id uuid not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint friendships_pkey primary key (id),
  constraint friendships_requester_id_receiver_id_key unique (requester_id, receiver_id),
  constraint friendships_receiver_id_fkey foreign KEY (receiver_id) references profiles (id) on delete CASCADE,
  constraint friendships_requester_id_fkey foreign KEY (requester_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;