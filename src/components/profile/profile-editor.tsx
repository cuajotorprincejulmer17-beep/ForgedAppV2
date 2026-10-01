"use client";

import { Check, LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import type { Profile } from "@/types/database";
import {
  initialProfileEditorState,
  saveProfileAction,
} from "@/app/profile/actions";

type ProfileEditorProps = {
  profile: Profile;
};

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [state, formAction, pending] = useActionState(saveProfileAction, initialProfileEditorState);
  const avatarInitial = (profile.display_name || profile.username).slice(0, 1).toUpperCase();

  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <div className="profile-card-header">
        <div className="profile-avatar" aria-hidden="true">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : avatarInitial}
        </div>
        <div>
          <p className="profile-eyebrow">YOUR PROFILE</p>
          <h1 id="profile-title">Shape your Forged identity</h1>
          <p className="profile-handle">@{profile.username}</p>
        </div>
        <span className={`profile-status profile-status--${profile.status}`}>
          <span aria-hidden="true" />{profile.status}
        </span>
      </div>

      <form className="profile-form" action={formAction} noValidate aria-busy={pending}>
        <label className="profile-field" htmlFor="profile-display-name">
          <span>Display name</span>
          <input
            id="profile-display-name"
            name="display_name"
            type="text"
            maxLength={40}
            defaultValue={profile.display_name ?? ""}
            aria-invalid={state.field === "display_name"}
          />
        </label>

        <label className="profile-field" htmlFor="profile-username">
          <span>Username</span>
          <div className="profile-input-prefix"><span>@</span>
            <input
              id="profile-username"
              name="username"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              maxLength={20}
              defaultValue={profile.username}
              aria-invalid={state.field === "username"}
            />
          </div>
        </label>

        <label className="profile-field profile-field--wide" htmlFor="profile-bio">
          <span>Bio <em>{profile.bio?.length ?? 0}/280</em></span>
          <textarea
            id="profile-bio"
            name="bio"
            maxLength={280}
            rows={4}
            defaultValue={profile.bio ?? ""}
            aria-invalid={state.field === "bio"}
          />
        </label>

        <label className="profile-field profile-field--wide" htmlFor="profile-avatar-url">
          <span>Avatar URL <em>Optional</em></span>
          <input
            id="profile-avatar-url"
            name="avatar_url"
            type="text"
            defaultValue={profile.avatar_url ?? ""}
            aria-invalid={state.field === "avatar_url"}
          />
        </label>

        <div className="profile-glow-note profile-field--wide">
          <span className="profile-glow-orb" aria-hidden="true" />
          <div><strong>Identity glow</strong><p>Your identity glow and account status are managed by Forged.</p></div>
        </div>

        {state.message && (
          <p className={`profile-feedback profile-feedback--${state.status}`} role={state.status === "error" ? "alert" : "status"}>
            {state.status === "success" ? <Check aria-hidden="true" /> : null}{state.message}
          </p>
        )}

        <button className="profile-save" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="profile-spinner" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {pending ? "Saving profile..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
