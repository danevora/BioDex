"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, UserProfile } from "@/hooks/useUserProfile";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 160;

interface FormErrors {
  username?: string;
  displayName?: string;
  bio?: string;
}

interface ProfileEditFormProps {
  profile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

function ProfileEditForm({ profile, onSuccess, onCancel }: ProfileEditFormProps) {
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(profile.username || "");
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (username.trim()) {
      if (!USERNAME_REGEX.test(username)) {
        newErrors.username =
          "Username must be 3-20 characters, alphanumeric and underscores only";
      }
    }

    // Display name validation
    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      newErrors.displayName = `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`;
    }

    // Bio validation
    if (bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: username.trim() || undefined,
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        // Check for username conflict error
        if (error.message.includes("Username already taken")) {
          setErrors((prev) => ({ ...prev, username: "Username already taken" }));
        } else {
          setApiError(error.message);
        }
      } else {
        setApiError("An error occurred while saving. Please try again.");
      }
    }
  };

  const isLoading = updateProfile.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {apiError}
        </div>
      )}

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            disabled={isLoading}
            className="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
            placeholder="username"
          />
        </div>
        {errors.username ? (
          <p className="mt-1 text-xs text-red-600">{errors.username}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            3-20 characters, letters, numbers, and underscores only
          </p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (errors.displayName) {
              setErrors((prev) => ({ ...prev, displayName: undefined }));
            }
          }}
          disabled={isLoading}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
          placeholder="Your display name"
        />
        {errors.displayName ? (
          <p className="mt-1 text-xs text-red-600">{errors.displayName}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            if (errors.bio) {
              setErrors((prev) => ({ ...prev, bio: undefined }));
            }
          }}
          disabled={isLoading}
          maxLength={MAX_BIO_LENGTH}
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
          placeholder="Tell us about yourself..."
        />
        {errors.bio ? (
          <p className="mt-1 text-xs text-red-600">{errors.bio}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProfileEditModal({
  open,
  onOpenChange,
  profile,
}: ProfileEditModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Your username must be unique.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ProfileEditForm
            profile={profile}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
